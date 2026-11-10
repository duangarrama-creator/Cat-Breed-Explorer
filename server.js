
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = (process.env.THECATAPI_KEY || "").trim();

const db = new Database(path.join(__dirname, "users.db"));

db.pragma("foreign_keys = ON");

// ======================================
// DATABASE
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT DEFAULT 'Cat',
    breed TEXT DEFAULT '',
    birth_date TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pet_id INTEGER,
    image_url TEXT DEFAULT '',
    predicted_breed TEXT DEFAULT '',
    confidence REAL,
    result_json TEXT DEFAULT '',
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pet_id INTEGER,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_at TEXT NOT NULL,
    repeat_rule TEXT DEFAULT 'none',
    is_done INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
  );
`);

// ======================================
// MIDDLEWARE
// ======================================
app.use(
  cors({
    origin: "https://cat-breed-explorer-jlzf.vercel.app",
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "cat-care-local-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

// ======================================
// AUTHENTICATION MIDDLEWARE
// ======================================

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "กรุณาเข้าสู่ระบบก่อนใช้งาน"
    });
  }

  next();
}

function getUserPet(petId, userId) {
  return db.prepare(`
    SELECT * FROM pets
    WHERE id = ? AND user_id = ?
  `).get(petId, userId);
}

// ======================================
// THE CAT API
// ======================================

const API_BASE = "https://api.thecatapi.com/v1";

async function theCatApi(url) {
  const headers = {};

  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }

  const response = await fetch(url, { headers });
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(
      data.message || `TheCatAPI HTTP ${response.status}`
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

// ======================================
// REGISTER
// ======================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const cleanUsername = (username || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password) {
      return res.status(400).json({
        message: "กรุณากรอกข้อมูลให้ครบทุกช่อง"
      });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({
        message: "ชื่อผู้ใช้ต้องมีความยาว 3–20 ตัวอักษร"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "รูปแบบอีเมลไม่ถูกต้อง"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
      });
    }

    const existingUser = db.prepare(`
      SELECT id FROM users
      WHERE username = ? OR email = ?
    `).get(cleanUsername, cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        message: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `).run(cleanUsername, cleanEmail, hashedPassword);

    req.session.userId = result.lastInsertRowid;
    req.session.username = cleanUsername;

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user: {
        id: result.lastInsertRowid,
        username: cleanUsername,
        email: cleanEmail
      }
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการสมัครสมาชิก"
    });
  }
});

// ======================================
// LOGIN
// ======================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({
        message: "กรุณากรอกอีเมลและรหัสผ่าน"
      });
    }

    const user = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
    });
  }
});

// ======================================
// CHECK LOGIN STATUS
// ======================================

app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  const user = db.prepare(`
    SELECT id, username, email
    FROM users
    WHERE id = ?
  `).get(req.session.userId);

  res.json({ user: user || null });
});

// ======================================
// LOGOUT
// ======================================

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "ออกจากระบบไม่สำเร็จ"
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      message: "ออกจากระบบสำเร็จ"
    });
  });
});

// ======================================
// MY PETS - GET ALL
// ======================================

app.get("/api/pets", requireLogin, (req, res) => {
  try {
    const pets = db.prepare(`
      SELECT * FROM pets
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.session.userId);

    res.json({
      count: pets.length,
      pets
    });

  } catch (error) {
    console.error("Get pets error:", error);

    res.status(500).json({
      message: "ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้"
    });
  }
});

// ======================================
// MY PETS - GET ONE
// ======================================

app.get("/api/pets/:id", requireLogin, (req, res) => {
  const pet = getUserPet(req.params.id, req.session.userId);

  if (!pet) {
    return res.status(404).json({
      message: "ไม่พบข้อมูลสัตว์เลี้ยง"
    });
  }

  res.json({ pet });
});

// ======================================
// MY PETS - ADD
// ======================================

app.post("/api/pets", requireLogin, (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      birth_date,
      gender,
      image_url,
      notes
    } = req.body;

    const cleanName = (name || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        message: "กรุณากรอกชื่อสัตว์เลี้ยง"
      });
    }

    const result = db.prepare(`
      INSERT INTO pets (
        user_id, name, species, breed,
        birth_date, gender, image_url, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.userId,
      cleanName,
      species || "Cat",
      breed || "",
      birth_date || "",
      gender || "",
      image_url || "",
      notes || ""
    );

    const pet = getUserPet(result.lastInsertRowid, req.session.userId);

    res.status(201).json({
      message: "เพิ่มสัตว์เลี้ยงสำเร็จ",
      pet
    });

  } catch (error) {
    console.error("Add pet error:", error);

    res.status(500).json({
      message: "ไม่สามารถเพิ่มสัตว์เลี้ยงได้"
    });
  }
});

// ======================================
// MY PETS - UPDATE
// ======================================

app.patch("/api/pets/:id", requireLogin, (req, res) => {
  try {
    const pet = getUserPet(req.params.id, req.session.userId);

    if (!pet) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลสัตว์เลี้ยง"
      });
    }

    const allowedFields = [
      "name",
      "species",
      "breed",
      "birth_date",
      "gender",
      "image_url",
      "notes"
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "ไม่มีข้อมูลที่ต้องการแก้ไข"
      });
    }

    if (req.body.name !== undefined && !String(req.body.name).trim()) {
      return res.status(400).json({
        message: "ชื่อสัตว์เลี้ยงห้ามเป็นค่าว่าง"
      });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    values.push(req.params.id, req.session.userId);

    db.prepare(`
      UPDATE pets
      SET ${updates.join(", ")}
      WHERE id = ? AND user_id = ?
    `).run(...values);

    res.json({
      message: "แก้ไขข้อมูลสัตว์เลี้ยงสำเร็จ",
      pet: getUserPet(req.params.id, req.session.userId)
    });

  } catch (error) {
    console.error("Update pet error:", error);

    res.status(500).json({
      message: "ไม่สามารถแก้ไขข้อมูลสัตว์เลี้ยงได้"
    });
  }
});

// ======================================
// MY PETS - DELETE
// ======================================

app.delete("/api/pets/:id", requireLogin, (req, res) => {
  const result = db.prepare(`
    DELETE FROM pets
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.session.userId);

  if (result.changes === 0) {
    return res.status(404).json({
      message: "ไม่พบข้อมูลสัตว์เลี้ยง"
    });
  }

  res.json({
    message: "ลบข้อมูลสัตว์เลี้ยงสำเร็จ"
  });
});

// ======================================
// SCAN HISTORY - GET ALL
// ======================================

app.get("/api/scan-history", requireLogin, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT
        scan_history.*,
        pets.name AS pet_name
      FROM scan_history
      LEFT JOIN pets
        ON scan_history.pet_id = pets.id
      WHERE scan_history.user_id = ?
      ORDER BY scan_history.scanned_at DESC
    `).all(req.session.userId);

    res.json({
      count: history.length,
      history
    });

  } catch (error) {
    console.error("Get scan history error:", error);

    res.status(500).json({
      message: "ไม่สามารถโหลดประวัติการสแกนได้"
    });
  }
});

// ======================================
// SCAN HISTORY - ADD
// ======================================

app.post("/api/scan-history", requireLogin, (req, res) => {
  try {
    const {
      pet_id,
      image_url,
      predicted_breed,
      confidence,
      result
    } = req.body;

    if (pet_id && !getUserPet(pet_id, req.session.userId)) {
      return res.status(404).json({
        message: "ไม่พบสัตว์เลี้ยงที่เลือก"
      });
    }

    const resultJson = result
      ? JSON.stringify(result)
      : "";

    const resultInsert = db.prepare(`
      INSERT INTO scan_history (
        user_id, pet_id, image_url,
        predicted_breed, confidence, result_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.session.userId,
      pet_id || null,
      image_url || "",
      predicted_breed || "",
      confidence === undefined ? null : Number(confidence),
      resultJson
    );

    const history = db.prepare(`
      SELECT * FROM scan_history
      WHERE id = ? AND user_id = ?
    `).get(resultInsert.lastInsertRowid, req.session.userId);

    res.status(201).json({
      message: "บันทึกประวัติการสแกนสำเร็จ",
      history
    });

  } catch (error) {
    console.error("Add scan history error:", error);

    res.status(500).json({
      message: "ไม่สามารถบันทึกประวัติการสแกนได้"
    });
  }
});

// ======================================
// SCAN HISTORY - DELETE
// ======================================

app.delete("/api/scan-history/:id", requireLogin, (req, res) => {
  const result = db.prepare(`
    DELETE FROM scan_history
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.session.userId);

  if (result.changes === 0) {
    return res.status(404).json({
      message: "ไม่พบประวัติการสแกน"
    });
  }

  res.json({
    message: "ลบประวัติการสแกนสำเร็จ"
  });
});

// ======================================
// PET CARE REMINDER - GET ALL
// ======================================

app.get("/api/reminders", requireLogin, (req, res) => {
  try {
    const reminders = db.prepare(`
      SELECT
        reminders.*,
        pets.name AS pet_name
      FROM reminders
      LEFT JOIN pets
        ON reminders.pet_id = pets.id
      WHERE reminders.user_id = ?
      ORDER BY reminders.due_at ASC
    `).all(req.session.userId);

    res.json({
      count: reminders.length,
      reminders
    });

  } catch (error) {
    console.error("Get reminders error:", error);

    res.status(500).json({
      message: "ไม่สามารถโหลดการแจ้งเตือนได้"
    });
  }
});

// ======================================
// PET CARE REMINDER - ADD
// ======================================

app.post("/api/reminders", requireLogin, (req, res) => {
  try {
    const {
      pet_id,
      title,
      description,
      due_at,
      repeat_rule
    } = req.body;

    const cleanTitle = (title || "").trim();

    if (!cleanTitle || !due_at) {
      return res.status(400).json({
        message: "กรุณากรอกหัวข้อและวันเวลาที่ต้องการแจ้งเตือน"
      });
    }

    if (pet_id && !getUserPet(pet_id, req.session.userId)) {
      return res.status(404).json({
        message: "ไม่พบสัตว์เลี้ยงที่เลือก"
      });
    }

    const allowedRepeats = [
      "none",
      "daily",
      "weekly",
      "monthly"
    ];

    const repeat = allowedRepeats.includes(repeat_rule)
      ? repeat_rule
      : "none";

    const result = db.prepare(`
      INSERT INTO reminders (
        user_id, pet_id, title,
        description, due_at, repeat_rule
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.session.userId,
      pet_id || null,
      cleanTitle,
      description || "",
      due_at,
      repeat
    );

    const reminder = db.prepare(`
      SELECT * FROM reminders
      WHERE id = ? AND user_id = ?
    `).get(result.lastInsertRowid, req.session.userId);

    res.status(201).json({
      message: "สร้างการแจ้งเตือนสำเร็จ",
      reminder
    });

  } catch (error) {
    console.error("Add reminder error:", error);

    res.status(500).json({
      message: "ไม่สามารถสร้างการแจ้งเตือนได้"
    });
  }
});

// ======================================
// PET CARE REMINDER - UPDATE
// ======================================

app.patch("/api/reminders/:id", requireLogin, (req, res) => {
  try {
    const reminder = db.prepare(`
      SELECT * FROM reminders
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.session.userId);

    if (!reminder) {
      return res.status(404).json({
        message: "ไม่พบการแจ้งเตือน"
      });
    }

    const allowedFields = [
      "pet_id",
      "title",
      "description",
      "due_at",
      "repeat_rule"
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (
          field === "pet_id" &&
          req.body[field] !== null &&
          !getUserPet(req.body[field], req.session.userId)
        ) {
          return res.status(404).json({
            message: "ไม่พบสัตว์เลี้ยงที่เลือก"
          });
        }

        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "is_done")) {
      updates.push("is_done = ?");
      values.push(req.body.is_done ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "ไม่มีข้อมูลที่ต้องการแก้ไข"
      });
    }

    values.push(req.params.id, req.session.userId);

    db.prepare(`
      UPDATE reminders
      SET ${updates.join(", ")}
      WHERE id = ? AND user_id = ?
    `).run(...values);

    const updatedReminder = db.prepare(`
      SELECT * FROM reminders
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.session.userId);

    res.json({
      message: "แก้ไขการแจ้งเตือนสำเร็จ",
      reminder: updatedReminder
    });

  } catch (error) {
    console.error("Update reminder error:", error);

    res.status(500).json({
      message: "ไม่สามารถแก้ไขการแจ้งเตือนได้"
    });
  }
});

// ======================================
// PET CARE REMINDER - DELETE
// ======================================

app.delete("/api/reminders/:id", requireLogin, (req, res) => {
  const result = db.prepare(`
    DELETE FROM reminders
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.session.userId);

  if (result.changes === 0) {
    return res.status(404).json({
      message: "ไม่พบการแจ้งเตือน"
    });
  }

  res.json({
    message: "ลบการแจ้งเตือนสำเร็จ"
  });
});

// ======================================
// GET CAT BREEDS
// ======================================

app.get("/api/breeds", async (req, res) => {
  try {
    const breeds = await theCatApi(`${API_BASE}/breeds`);

    res.json({
      source: "TheCatAPI",
      count: breeds.length,
      breeds
    });

  } catch (error) {
    console.error("Breeds error:", error);

    res.status(error.status || 500).json({
      message: error.message || "ไม่สามารถโหลดข้อมูลสายพันธุ์แมวได้"
    });
  }
});


// ======================================
// BREED IMAGE API
// ======================================

app.get("/api/breeds/:id/image", async (req, res) => {
  try {
    const breedId = req.params.id;

    // ค้นหารูปภาพที่ระบุสายพันธุ์ตรงกับ ID เท่านั้น
    const images = await theCatApi(
      `${API_BASE}/images/search?breed_ids=${encodeURIComponent(breedId)}&limit=5`
    );

    // ตรวจสอบว่า API ส่งข้อมูลสายพันธุ์กลับมาตรงกันจริง
    const image = Array.isArray(images)
      ? images.find((item) =>
          item &&
          item.url &&
          Array.isArray(item.breeds) &&
          item.breeds.some((breed) => breed.id === breedId)
        ) || null
      : null;

    res.json({
      image
    });

  } catch (error) {
    console.error("Breed image error:", error);

    res.status(error.status || 500).json({
      message: error.message || "ไม่สามารถโหลดรูปแมวได้",
      image: null
    });
  }
});

// ======================================
// SERVER STATUS
// ======================================

app.get("/api/status", (req, res) => {
  res.json({
    server: "ok",
    database: "connected",
    apiKeyConfigured: Boolean(API_KEY)
  });
});

// ======================================
// FRONTEND FALLBACK
// ======================================

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      message: "ไม่พบ API ที่เรียกใช้งาน"
    });
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================================
// ERROR HANDLER
// ======================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"
  });
});

// ======================================
// START SERVER
// ======================================

app.listen(PORT, () => {
  console.log(`Cat Breed Explorer running at http://localhost:${PORT}`);
});
