
const $ = (selector) => document.querySelector(selector);

// =====================================================
// STATE
// =====================================================

function loadSavedFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("catBreedFavorites") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function loadLocalData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const state = {
  breeds: [],
  filtered: [],
  favorites: new Set(loadSavedFavorites()),
  currentBreed: null,
  breedById: new Map(),
  favoritesOnly: false,
  currentUser: null,
  pets: loadLocalData("catBreedPets"),
  reminders: loadLocalData("catBreedReminders"),
  scanHistory: loadLocalData("catBreedScanHistory"),
  selectedScanImage: null,
  scanObjectUrl: null
};

// =====================================================
// HELPERS
// =====================================================

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "#b94b43" : "#64856b";
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
  }

  return data;
}

function saveLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// =====================================================
// INSERTION SORT - DSA
// =====================================================

function insertionSort(items, compareFn) {
  const result = [...items];

  for (let i = 1; i < result.length; i++) {
    const current = result[i];
    let j = i - 1;

    while (j >= 0 && compareFn(result[j], current) > 0) {
      result[j + 1] = result[j];
      j--;
    }

    result[j + 1] = current;
  }

  return result;
}

// =====================================================
// DATE
// =====================================================

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// =====================================================
// IMAGE SYSTEM
// =====================================================

const breedImageCache = new Map();
const breedImageLoading = new Map();
const breedImageFailed = new Set();

const CAT_PLACEHOLDER =
  "https://placehold.co/600x400/f4eee5/806b59?text=Cat";

function imageFor(breed) {
  if (!breed) return CAT_PLACEHOLDER;

  return breedImageCache.get(breed.id) ||
    breed.image?.url ||
    breed.image_url ||
    CAT_PLACEHOLDER;
}

async function loadBreedImage(breed) {
  if (!breed || !breed.id) return CAT_PLACEHOLDER;

  const cached = breedImageCache.get(breed.id);
  if (cached) return cached;

  if (breedImageFailed.has(breed.id)) return CAT_PLACEHOLDER;

  if (breedImageLoading.has(breed.id)) {
    return breedImageLoading.get(breed.id);
  }

  const loadingPromise = (async () => {
    try {
      const data = await apiFetch(
        `/api/breeds/${encodeURIComponent(breed.id)}/image`
      );

      const image = data.image || data.url || data.image_url || data;
      let imageUrl = "";

      if (typeof image === "string") {
        imageUrl = image;
      } else if (image && typeof image === "object") {
        imageUrl = image.url || image.image_url || image.image || "";
      }

      if (imageUrl) {
        breedImageCache.set(breed.id, imageUrl);
        return imageUrl;
      }

      breedImageFailed.add(breed.id);
      return CAT_PLACEHOLDER;
    } catch (error) {
      console.warn(`ไม่สามารถโหลดรูปสายพันธุ์ ${breed.name}:`, error.message);
      breedImageFailed.add(breed.id);
      return CAT_PLACEHOLDER;
    } finally {
      breedImageLoading.delete(breed.id);
    }
  })();

  breedImageLoading.set(breed.id, loadingPromise);
  return loadingPromise;
}

function loadCardImage(card, breed) {
  const image = card.querySelector("img");
  if (!image) return;

  loadBreedImage(breed).then((imageUrl) => {
    if (!card.isConnected) return;

    if (imageUrl && imageUrl !== CAT_PLACEHOLDER) {
      image.dataset.loadedFromApi = "true";
      image.src = imageUrl;
    }
  });
}

// =====================================================
// THAI BREED DESCRIPTIONS
// =====================================================

const thaiDescriptions = {
  "Abyssinian": "แมวอะบิสซิเนียน มีลักษณะเด่นด้านความกระตือรือร้นและความอยากรู้อยากเห็น",
  "American Shorthair": "แมวอเมริกันชอร์ตแฮร์ เป็นแมวขนสั้นที่มีลักษณะเป็นมิตรและปรับตัวได้ดี",
  "Bengal": "แมวเบงกอล มีลวดลายขนโดดเด่นคล้ายแมวป่าและมีลักษณะกระตือรือร้น",
  "Birman": "แมวเบอร์แมน เป็นแมวขนกึ่งยาวที่มีลักษณะโดดเด่นและเป็นเอกลักษณ์",
  "Bombay": "แมวบอมเบย์ มีขนสีดำเป็นเอกลักษณ์และรูปลักษณ์คล้ายแมวเสือดำ",
  "British Shorthair": "แมวบริติชชอร์ตแฮร์ มีรูปร่างค่อนข้างกลม ขนสั้นหนา และใบหน้ากลม",
  "Burmese": "แมวเบอร์มีส เป็นแมวขนสั้นที่มีรูปลักษณ์โดดเด่น",
  "Cornish Rex": "แมวคอร์นิชเร็กซ์ มีขนหยิกสั้นและรูปร่างเพรียว",
  "Devon Rex": "แมวเดวอนเร็กซ์ มีขนสั้นหยิก ใบหูใหญ่ และรูปลักษณ์โดดเด่น",
  "Egyptian Mau": "แมวอียิปต์เชียนเมา มีลวดลายจุดบนขนและรูปลักษณ์คล้ายแมวโบราณ",
  "Exotic Shorthair": "แมวเอ็กโซติกชอร์ตแฮร์ มีใบหน้ากลมและขนสั้นหนา",
  "Himalayan": "แมวหิมาลายัน มีขนยาวและสีขนบริเวณใบหน้า หู และปลายเท้า",
  "Japanese Bobtail": "แมวเจแปนีสบ็อบเทล มีลักษณะเด่นคือหางสั้นคล้ายปอมปอม",
  "Maine Coon": "แมวเมนคูน เป็นแมวขนาดใหญ่ มีขนยาวและหางฟู",
  "Manx": "แมวแมนซ์ มีลักษณะเด่นคือหางสั้นหรือไม่มีหาง",
  "Norwegian Forest Cat": "แมวป่านอร์เวย์ มีขนหนาและยาว เหมาะกับสภาพอากาศหนาวเย็น",
  "Ocicat": "แมวโอซิแคต มีลวดลายจุดคล้ายแมวป่า แต่เป็นแมวบ้าน",
  "Oriental": "แมวโอเรียนทัล มีรูปร่างเพรียว หูใหญ่ และใบหน้าโดดเด่น",
  "Persian": "แมวเปอร์เซีย มีขนยาว ใบหน้ากลม และรูปลักษณ์ที่เป็นเอกลักษณ์",
  "Ragdoll": "แมวแร็กดอลล์ เป็นแมวขนกึ่งยาว มีดวงตาสีฟ้า",
  "Russian Blue": "แมวรัสเซียนบลู มีขนสีเทาอมฟ้าและดวงตาสีเขียว",
  "Scottish Fold": "แมวสก็อตติชโฟลด์ มีลักษณะเด่นคือใบหูพับไปด้านหน้า",
  "Siamese": "แมวสยาม มีสีขนบริเวณใบหน้า หู ขา และหางแตกต่างจากลำตัว",
  "Siberian": "แมวไซบีเรียน มีขนหนาและยาว เหมาะกับสภาพอากาศหนาวเย็น",
  "Singapura": "แมวสิงคโปร์ มีขนาดเล็กและรูปลักษณ์ที่เป็นเอกลักษณ์",
  "Snowshoe": "แมวสโนว์ชู มีลักษณะเด่นคือสีขนและอุ้งเท้าสีขาว",
  "Somali": "แมวโซมาลี มีขนกึ่งยาวและหางฟู",
  "Sphynx": "แมวสฟิงซ์ มีลักษณะเด่นคือแทบไม่มีขน",
  "Tonkinese": "แมวท็องกินีส มีลักษณะสีขนและรูปลักษณ์ที่เป็นเอกลักษณ์",
  "Turkish Angora": "แมวเตอร์กิชแองโกรา มีขนยาวนุ่มและรูปร่างเพรียว",
  "Turkish Van": "แมวเตอร์กิชแวน มีลักษณะสีขนบริเวณหัวและหางที่โดดเด่น"
};

function getThaiDescription(breed) {
  if (!breed) return "ไม่มีข้อมูลสายพันธุ์แมว";

  return thaiDescriptions[breed.name] ||
    `แมวสายพันธุ์${breed.name} มีลักษณะเฉพาะของสายพันธุ์ สามารถดูรายละเอียดเพิ่มเติมได้ด้านล่าง`;
}

// =====================================================
// THAI TEMPERAMENT
// =====================================================

const temperamentTranslations = {
  Active: "กระตือรือร้น",
  Adaptable: "ปรับตัวได้ดี",
  Affectionate: "ชอบแสดงความรัก",
  Agile: "คล่องแคล่ว",
  Alert: "ตื่นตัว",
  Calm: "สงบ",
  Curious: "ชอบสำรวจ",
  Dependable: "ไว้วางใจได้",
  Dignified: "สง่างาม",
  "Easy Going": "เลี้ยงง่าย",
  Energetic: "มีพลังงานสูง",
  Friendly: "เป็นมิตร",
  Gentle: "อ่อนโยน",
  Intelligent: "ฉลาด",
  Independent: "รักอิสระ",
  Lively: "ร่าเริง",
  Loyal: "ซื่อสัตย์",
  Playful: "ชอบเล่น",
  Quiet: "เงียบสงบ",
  Relaxed: "ผ่อนคลาย",
  Social: "ชอบเข้าสังคม",
  Sweet: "อ่อนหวาน",
  Vocal: "ชอบส่งเสียง",
  Watchful: "ช่างสังเกต"
};

function getThaiTemperament(value) {
  if (!value) return "ไม่มีข้อมูลนิสัย";

  return value.split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => temperamentTranslations[item] || item)
    .join("、");
}

function getThaiOrigin(origin) {
  if (!origin) return "ไม่ระบุถิ่นกำเนิด";

  const origins = {
    "United States": "สหรัฐอเมริกา",
    "United Kingdom": "สหราชอาณาจักร",
    Thailand: "ประเทศไทย",
    Japan: "ญี่ปุ่น",
    Russia: "รัสเซีย",
    France: "ฝรั่งเศส",
    Germany: "เยอรมนี",
    China: "จีน",
    Canada: "แคนาดา",
    Norway: "นอร์เวย์",
    Turkey: "ตุรกี",
    Egypt: "อียิปต์",
    Iran: "อิหร่าน",
    Persia: "เปอร์เซีย",
    Australia: "ออสเตรเลีย",
    Singapore: "สิงคโปร์"
  };

  return origins[origin] || origin;
}

// =====================================================
// FAVORITES
// =====================================================

function saveFavorites() {
  localStorage.setItem("catBreedFavorites", JSON.stringify([...state.favorites]));
  updateFavoriteCount();
}

function updateFavoriteCount() {
  const count = $("#favoriteTotal");
  if (count) count.textContent = state.favorites.size;

  const navCount = $("#favoriteCount");
  if (navCount) navCount.textContent = state.favorites.size;
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast("นำออกจากรายการโปรดแล้ว");
  } else {
    state.favorites.add(id);
    showToast("เพิ่มในรายการโปรดแล้ว");
  }

  saveFavorites();
  renderBreeds();

  if (state.currentBreed?.id === id) {
    updateModalFavoriteButtons();
  }
}

function updateModalFavoriteButtons() {
  const id = state.currentBreed?.id;
  if (!id) return;

  const active = state.favorites.has(id);
  const text = active ? "♥ เพิ่มในรายการโปรดแล้ว" : "♡ เพิ่มรายการโปรด";

  if ($("#modalFavorite")) $("#modalFavorite").textContent = text;
  if ($("#modalFavoriteBottom")) $("#modalFavoriteBottom").textContent = text;
}

// =====================================================
// BREED CARDS
// =====================================================

function createCard(breed) {
  const card = document.createElement("article");

  card.className = "breed-card";
  card.tabIndex = 0;
  card.dataset.id = breed.id;

  const favorite = state.favorites.has(breed.id);

  card.innerHTML = `
    <div class="breed-card-image">
      <img
        src="${escapeHTML(imageFor(breed))}"
        alt="${escapeHTML(breed.name)}"
        loading="lazy"
      >
      <button
        class="favorite-button ${favorite ? "active" : ""}"
        type="button"
        aria-label="เพิ่มหรือลบรายการโปรด"
      >${favorite ? "♥" : "♡"}</button>
    </div>
    <div class="breed-card-content">
      <h3>${escapeHTML(breed.name)}</h3>
      <p class="breed-origin">
        ถิ่นกำเนิด: ${escapeHTML(getThaiOrigin(breed.origin))}
      </p>
      <p class="breed-card-description">
        ${escapeHTML(getThaiDescription(breed))}
      </p>
      <span class="card-more">ดูรายละเอียดเพิ่มเติม →</span>
    </div>
  `;

  const image = card.querySelector("img");

  image.addEventListener("error", () => {
    image.src = CAT_PLACEHOLDER;
  });

  if (!breed.image?.url && !breed.image_url) {
    loadCardImage(card, breed);
  }

  card.querySelector(".favorite-button").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(breed.id);
  });

  card.addEventListener("click", () => openModalById(breed.id));

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModalById(breed.id);
    }
  });

  return card;
}

// =====================================================
// RENDER BREEDS
// =====================================================

function renderBreeds() {
  const grid = $("#breedGrid");
  if (!grid) return;

  const search = ($("#searchInput")?.value || "").trim().toLowerCase();
  const origin = $("#originFilter")?.value || "";
  const sort = $("#sortSelect")?.value || "default";

  let result = [...state.breeds];

  if (search) {
    result = result.filter((breed) =>
      `${breed.name} ${breed.origin || ""} ${getThaiTemperament(breed.temperament)}`
        .toLowerCase()
        .includes(search)
    );
  }

  if (origin) {
    result = result.filter((breed) => breed.origin === origin);
  }

  if (state.favoritesOnly) {
    result = result.filter((breed) => state.favorites.has(breed.id));
  }

  if (sort === "az") {
    result = insertionSort(result, (a, b) => a.name.localeCompare(b.name));
  } else if (sort === "za") {
    result = insertionSort(result, (a, b) => b.name.localeCompare(a.name));
  }

  state.filtered = result;
  grid.innerHTML = "";

  result.forEach((breed) => grid.appendChild(createCard(breed)));

  if ($("#resultsLabel")) {
    $("#resultsLabel").textContent = `พบ ${result.length} สายพันธุ์`;
  }

  if ($("#emptyState")) {
    $("#emptyState").hidden = result.length !== 0;
  }

  if ($("#breedTotal")) {
    $("#breedTotal").textContent = state.breeds.length;
  }

  updateFavoriteCount();
}

// =====================================================
// ORIGIN FILTER
// =====================================================

function populateOrigins() {
  const select = $("#originFilter");
  if (!select) return;

  const currentValue = select.value;
  const origins = [];

  state.breeds.forEach((breed) => {
    if (breed.origin && !origins.includes(breed.origin)) {
      origins.push(breed.origin);
    }
  });

  const sortedOrigins = insertionSort(origins, (a, b) => a.localeCompare(b));

  select.innerHTML = '<option value="">ทุกประเทศ</option>';

  sortedOrigins.forEach((origin) => {
    const option = document.createElement("option");
    option.value = origin;
    option.textContent = getThaiOrigin(origin);
    select.appendChild(option);
  });

  select.value = currentValue;
}

// =====================================================
// LOAD BREEDS API
// =====================================================

async function loadBreeds() {
  const loading = $("#loadingState");
  const error = $("#errorState");
  const grid = $("#breedGrid");

  if (loading) loading.hidden = false;
  if (error) error.hidden = true;
  if (grid) grid.innerHTML = "";

  try {
    const data = await apiFetch("/api/breeds");

    state.breeds = Array.isArray(data.breeds) ? data.breeds : [];
    state.breedById = new Map();

    state.breeds.forEach((breed) => state.breedById.set(breed.id, breed));

    populateOrigins();
    renderBreeds();
  } catch (err) {
    if (error) error.hidden = false;
    if ($("#errorMessage")) $("#errorMessage").textContent = err.message;
    showToast("ไม่สามารถโหลดข้อมูลสายพันธุ์แมวได้");
  } finally {
    if (loading) loading.hidden = true;
  }
}

// =====================================================
// BREED MODAL - FIXED
// =====================================================

function openModalById(id) {
  const breed = state.breedById.get(id);
  if (!breed) {
    showToast("ไม่พบข้อมูลสายพันธุ์แมว");
    return;
  }

  const modal = $("#breedModal");
  if (!modal) {
    showToast("ไม่พบหน้าต่างรายละเอียดแมว");
    return;
  }

  state.currentBreed = breed;

  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value || "ไม่มีข้อมูล";
  };

  const image = $("#modalImage");

  if (image) {
    image.onerror = () => {
      image.onerror = null;
      image.src = CAT_PLACEHOLDER;
    };

    image.src = imageFor(breed);
    image.alt = breed.name;

    loadBreedImage(breed).then((imageUrl) => {
      if (state.currentBreed?.id === breed.id && imageUrl) {
        image.src = imageUrl;
      }
    });
  }

  setText("#modalBreedName", breed.name);
  setText("#modalOrigin", getThaiOrigin(breed.origin));
  setText("#modalTemperament", getThaiTemperament(breed.temperament));
  setText("#modalDescription", getThaiDescription(breed));

  setText(
    "#modalWeight",
    breed.weight?.metric ? `${breed.weight.metric} กิโลกรัม` : "ไม่มีข้อมูล"
  );

  setText(
    "#modalLife",
    breed.life_span ? `${breed.life_span} ปี` : "ไม่มีข้อมูล"
  );

  setText("#modalCountry", breed.country_code);
  setText("#modalAltName", breed.alt_names);

  // สร้างส่วนประวัติหากยังไม่มีใน HTML
  let historyElement = $("#modalHistory");

  if (!historyElement) {
    const descriptionElement = $("#modalDescription");

    if (descriptionElement) {
      historyElement = document.createElement("div");
      historyElement.id = "modalHistory";
      historyElement.innerHTML = `
        <h3>ประวัติและข้อมูลเพิ่มเติม</h3>
        <p id="modalHistoryText"></p>
      `;
      descriptionElement.insertAdjacentElement("afterend", historyElement);
    }
  }

  const historyText = $("#modalHistoryText");

  if (historyText) {
    historyText.textContent =
      breed.history ||
      breed.breed_history ||
      breed.description ||
      getThaiDescription(breed);
  }

  const tags = $("#traitTags");

  if (tags) {
    tags.innerHTML = "";

    getThaiTemperament(breed.temperament)
      .split("、")
      .filter(Boolean)
      .forEach((item) => {
        const tag = document.createElement("span");
        tag.textContent = item;
        tags.appendChild(tag);
      });
  }

  updateModalFavoriteButtons();

  // แก้ปัญหา modal มี class hidden ค้างอยู่
  modal.hidden = false;
  modal.classList.remove("hidden");
  modal.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeModal() {
  const modal = $("#breedModal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.classList.add("hidden");
  modal.hidden = true;

  document.body.classList.remove("modal-open");
}

// =====================================================
// AUTHENTICATION
// =====================================================

function showAuthModal() {
  const modal = $("#authModal");

  if (!modal) {
    showToast("ไม่พบหน้าต่างเข้าสู่ระบบ");
    return;
  }

  modal.hidden = false;
  modal.classList.remove("hidden");
  modal.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeAuthModal() {
  const modal = $("#authModal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.classList.add("hidden");
  modal.hidden = true;

  document.body.classList.remove("modal-open");
}

function updateAuthUI() {
  const loginButton = $("#loginButton");
  const logoutButton = $("#logoutButton");
  const userName = $("#userName");
  const authStatus = $("#authStatus");

  if (state.currentUser) {
    if (loginButton) loginButton.hidden = true;
    if (logoutButton) logoutButton.hidden = false;

    if (userName) {
      userName.textContent =
        state.currentUser.name ||
        state.currentUser.username ||
        state.currentUser.email ||
        "ผู้ใช้";
    }

    if (authStatus) authStatus.textContent = "เข้าสู่ระบบแล้ว";
  } else {
    if (loginButton) loginButton.hidden = false;
    if (logoutButton) logoutButton.hidden = true;
    if (userName) userName.textContent = "";
    if (authStatus) authStatus.textContent = "ยังไม่ได้เข้าสู่ระบบ";
  }
}

async function checkLoginStatus() {
  try {
    const data = await apiFetch("/api/auth/me");
    state.currentUser = data.user || data.currentUser || null;
  } catch {
    state.currentUser = null;
  }

  updateAuthUI();
}

async function loginUser(event) {
  event?.preventDefault();

  const username = $("#loginUsername")?.value.trim();
  const password = $("#loginPassword")?.value;
  const message = $("#loginMessage");

  if (!username || !password) {
    showMessage(message, "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", true);
    return;
  }

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    state.currentUser = data.user || data;
    updateAuthUI();
    closeAuthModal();
    await loadPrivateData();
    showToast("เข้าสู่ระบบสำเร็จ");
  } catch (error) {
    showMessage(message, error.message, true);
  }
}

async function registerUser(event) {
  event?.preventDefault();

  const username = $("#registerUsername")?.value.trim();
  const email = $("#registerEmail")?.value.trim();
  const password = $("#registerPassword")?.value;
  const message = $("#registerMessage");

  if (!username || !password) {
    showMessage(message, "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", true);
    return;
  }

  try {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password })
    });

    state.currentUser = data.user || data;
    updateAuthUI();
    closeAuthModal();
    await loadPrivateData();
    showToast("สมัครสมาชิกสำเร็จ");
  } catch (error) {
    showMessage(message, error.message, true);
  }
}

async function logoutUser() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.warn("Logout API:", error.message);
  }

  state.currentUser = null;
  state.pets = [];
  state.reminders = [];

  updateAuthUI();
  renderPets();
  renderReminders();

  showToast("ออกจากระบบแล้ว");
}

// =====================================================
// PRIVATE DATA
// =====================================================

async function loadPrivateData() {
  if (!state.currentUser) return;

  try {
    const data = await apiFetch("/api/private");

    if (Array.isArray(data.pets)) {
      state.pets = data.pets;
      saveLocalData("catBreedPets", state.pets);
    }

    if (Array.isArray(data.reminders)) {
      state.reminders = data.reminders;
      saveLocalData("catBreedReminders", state.reminders);
    }

    if (Array.isArray(data.scanHistory)) {
      state.scanHistory = data.scanHistory;
      saveLocalData("catBreedScanHistory", state.scanHistory);
    }
  } catch (error) {
    console.warn("โหลดข้อมูลส่วนตัว:", error.message);
  }

  renderPets();
  renderReminders();
  renderScanHistory();
}

// =====================================================
// PET MANAGEMENT
// =====================================================

function renderPets() {
  const container = $("#petList");
  if (!container) return;

  container.innerHTML = "";

  if (!state.pets.length) {
    container.innerHTML = `<p class="empty-message">ยังไม่มีข้อมูลสัตว์เลี้ยง</p>`;
    return;
  }

  state.pets.forEach((pet) => {
    const item = document.createElement("article");
    item.className = "pet-card";

    item.innerHTML = `
      <h3>${escapeHTML(pet.name || "ไม่มีชื่อ")}</h3>
      <p>สายพันธุ์: ${escapeHTML(pet.breed || "ไม่ระบุ")}</p>
      <p>วันเกิด: ${escapeHTML(pet.birthDate || "ไม่ระบุ")}</p>
      <p>เพศ: ${escapeHTML(pet.gender || "ไม่ระบุ")}</p>
      <button type="button" class="delete-pet" data-id="${escapeHTML(pet.id)}">
        ลบข้อมูล
      </button>
    `;

    item.querySelector(".delete-pet").addEventListener("click", () => {
      deletePet(pet.id);
    });

    container.appendChild(item);
  });
}

async function addPet(event) {
  event?.preventDefault();

  const name = $("#petName")?.value.trim();
  const breed = $("#petBreed")?.value.trim();
  const birthDate = $("#petBirthDate")?.value;
  const gender = $("#petGender")?.value;

  if (!name) {
    showToast("กรุณากรอกชื่อสัตว์เลี้ยง");
    return;
  }

  const pet = {
    id: crypto.randomUUID(),
    name,
    breed,
    birthDate,
    gender,
    createdAt: new Date().toISOString()
  };

  state.pets.push(pet);
  saveLocalData("catBreedPets", state.pets);

  if (state.currentUser) {
    try {
      await apiFetch("/api/pets", {
        method: "POST",
        body: JSON.stringify(pet)
      });
    } catch (error) {
      console.warn("บันทึกสัตว์เลี้ยงในเซิร์ฟเวอร์:", error.message);
    }
  }

  $("#petForm")?.reset();
  renderPets();
  showToast("เพิ่มข้อมูลสัตว์เลี้ยงแล้ว");
}

async function deletePet(id) {
  state.pets = state.pets.filter((pet) => String(pet.id) !== String(id));
  saveLocalData("catBreedPets", state.pets);

  if (state.currentUser) {
    try {
      await apiFetch(`/api/pets/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    } catch (error) {
      console.warn("ลบสัตว์เลี้ยงจากเซิร์ฟเวอร์:", error.message);
    }
  }

  renderPets();
  showToast("ลบข้อมูลสัตว์เลี้ยงแล้ว");
}

// =====================================================
// SCANNER
// =====================================================

function setupScanPreview() {
  const input = $("#scanImageInput");
  const preview = $("#scanPreview");

  if (!input) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("กรุณาเลือกไฟล์รูปภาพ");
      input.value = "";
      return;
    }

    if (state.scanObjectUrl) {
      URL.revokeObjectURL(state.scanObjectUrl);
    }

    state.selectedScanImage = file;
    state.scanObjectUrl = URL.createObjectURL(file);

    if (preview) {
      preview.src = state.scanObjectUrl;
      preview.hidden = false;
    }
  });
}

async function scanCatBreed() {
  if (!state.selectedScanImage) {
    showToast("กรุณาเลือกรูปแมวก่อน");
    return;
  }

  const resultElement = $("#scanResult");
  const button = $("#scanButton");

  if (button) {
    button.disabled = true;
    button.textContent = "กำลังวิเคราะห์...";
  }

  try {
    const formData = new FormData();
    formData.append("image", state.selectedScanImage);

    let result;

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถวิเคราะห์รูปภาพได้");
      }

      result = await response.json();
    } catch (error) {
      console.warn("Scanner API:", error.message);

      result = {
        breed: "ไม่สามารถระบุสายพันธุ์ได้",
        confidence: 0,
        message: "ระบบวิเคราะห์รูปภาพยังไม่พร้อมใช้งาน"
      };
    }

    const record = {
      id: crypto.randomUUID(),
      imageName: state.selectedScanImage.name,
      breed: result.breed || result.name || "ไม่สามารถระบุได้",
      confidence: result.confidence || 0,
      result,
      createdAt: new Date().toISOString()
    };

    state.scanHistory.unshift(record);
    state.scanHistory = state.scanHistory.slice(0, 50);
    saveLocalData("catBreedScanHistory", state.scanHistory);

    if (resultElement) {
      resultElement.innerHTML = `
        <h3>ผลการวิเคราะห์</h3>
        <p>สายพันธุ์: ${escapeHTML(record.breed)}</p>
        <p>ความมั่นใจ: ${escapeHTML(String(record.confidence))}%</p>
        <p>${escapeHTML(result.message || "")}</p>
      `;
    }

    renderScanHistory();
    showToast("วิเคราะห์รูปภาพเสร็จแล้ว");
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "วิเคราะห์สายพันธุ์";
    }
  }
}

function renderScanHistory() {
  const container = $("#scanHistoryList");
  if (!container) return;

  container.innerHTML = "";

  if (!state.scanHistory.length) {
    container.innerHTML = `<p class="empty-message">ยังไม่มีประวัติการสแกน</p>`;
    return;
  }

  state.scanHistory.forEach((item) => {
    const element = document.createElement("article");
    element.className = "scan-history-item";

    element.innerHTML = `
      <h4>${escapeHTML(item.breed || "ไม่ทราบสายพันธุ์")}</h4>
      <p>ไฟล์: ${escapeHTML(item.imageName || "-")}</p>
      <p>ความมั่นใจ: ${escapeHTML(String(item.confidence || 0))}%</p>
      <p>วันที่: ${escapeHTML(formatDate(item.createdAt))}</p>
      <button type="button" class="delete-scan" data-id="${escapeHTML(item.id)}">
        ลบ
      </button>
    `;

    element.querySelector(".delete-scan").addEventListener("click", () => {
      state.scanHistory = state.scanHistory.filter(
        (scan) => String(scan.id) !== String(item.id)
      );

      saveLocalData("catBreedScanHistory", state.scanHistory);
      renderScanHistory();
    });

    container.appendChild(element);
  });
}

// =====================================================
// REMINDERS
// =====================================================

function renderReminders() {
  const container = $("#reminderList");
  if (!container) return;

  container.innerHTML = "";

  if (!state.reminders.length) {
    container.innerHTML = `<p class="empty-message">ยังไม่มีการแจ้งเตือน</p>`;
    return;
  }

  const sorted = insertionSort(
    state.reminders,
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  sorted.forEach((reminder) => {
    const item = document.createElement("article");
    item.className = "reminder-card";

    item.innerHTML = `
      <h3>${escapeHTML(reminder.title || "การแจ้งเตือน")}</h3>
      <p>${escapeHTML(reminder.description || "")}</p>
      <p>วันที่: ${escapeHTML(formatDate(reminder.date))}</p>
      <button type="button" class="delete-reminder" data-id="${escapeHTML(reminder.id)}">
        ลบ
      </button>
    `;

    item.querySelector(".delete-reminder").addEventListener("click", () => {
      deleteReminder(reminder.id);
    });

    container.appendChild(item);
  });
}

async function addReminder(event) {
  event?.preventDefault();

  const title = $("#reminderTitle")?.value.trim();
  const description = $("#reminderDescription")?.value.trim();
  const date = $("#reminderDate")?.value;

  if (!title || !date) {
    showToast("กรุณากรอกหัวข้อและวันที่");
    return;
  }

  const reminder = {
    id: crypto.randomUUID(),
    title,
    description,
    date,
    createdAt: new Date().toISOString()
  };

  state.reminders.push(reminder);
  saveLocalData("catBreedReminders", state.reminders);

  if (state.currentUser) {
    try {
      await apiFetch("/api/reminders", {
        method: "POST",
        body: JSON.stringify(reminder)
      });
    } catch (error) {
      console.warn("บันทึกการแจ้งเตือน:", error.message);
    }
  }

  $("#reminderForm")?.reset();
  renderReminders();
  showToast("เพิ่มการแจ้งเตือนแล้ว");
}

async function deleteReminder(id) {
  state.reminders = state.reminders.filter(
    (item) => String(item.id) !== String(id)
  );

  saveLocalData("catBreedReminders", state.reminders);

  if (state.currentUser) {
    try {
      await apiFetch(`/api/reminders/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    } catch (error) {
      console.warn("ลบการแจ้งเตือน:", error.message);
    }
  }

  renderReminders();
  showToast("ลบการแจ้งเตือนแล้ว");
}

// =====================================================
// AUTH TABS
// =====================================================

function setupAuthTabs() {
  const loginTab = $("#loginTab");
  const registerTab = $("#registerTab");
  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");

  loginTab?.addEventListener("click", () => {
    loginForm?.removeAttribute("hidden");
    registerForm?.setAttribute("hidden", "");

    loginTab.classList.add("active");
    registerTab?.classList.remove("active");
  });

  registerTab?.addEventListener("click", () => {
    registerForm?.removeAttribute("hidden");
    loginForm?.setAttribute("hidden", "");

    registerTab.classList.add("active");
    loginTab?.classList.remove("active");
  });
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {
  $("#searchInput")?.addEventListener("input", renderBreeds);
  $("#originFilter")?.addEventListener("change", renderBreeds);
  $("#sortSelect")?.addEventListener("change", renderBreeds);

  $("#favoritesToggle")?.addEventListener("click", () => {
    state.favoritesOnly = !state.favoritesOnly;

    $("#favoritesToggle")?.classList.toggle("active", state.favoritesOnly);
    renderBreeds();
  });

  $("#showAllBreeds")?.addEventListener("click", () => {
    state.favoritesOnly = false;
    $("#favoritesToggle")?.classList.remove("active");
    renderBreeds();
  });

  $("#modalClose")?.addEventListener("click", closeModal);

  // ปิดเมื่อคลิกพื้นหลังหรือ backdrop
  $("#breedModal")?.addEventListener("click", (event) => {
    if (
      event.target === $("#breedModal") ||
      event.target.closest("[data-close-modal]")
    ) {
      closeModal();
    }
  });

  $("#modalFavorite")?.addEventListener("click", () => {
    if (state.currentBreed) toggleFavorite(state.currentBreed.id);
  });

  $("#modalFavoriteBottom")?.addEventListener("click", () => {
    if (state.currentBreed) toggleFavorite(state.currentBreed.id);
  });

  $("#loginButton")?.addEventListener("click", showAuthModal);
  $("#authClose")?.addEventListener("click", closeAuthModal);

  $("#authModal")?.addEventListener("click", (event) => {
    if (
      event.target === $("#authModal") ||
      event.target.closest("[data-close-modal]")
    ) {
      closeAuthModal();
    }
  });

  $("#loginForm")?.addEventListener("submit", loginUser);
  $("#registerForm")?.addEventListener("submit", registerUser);
  $("#logoutButton")?.addEventListener("click", logoutUser);
  $("#petForm")?.addEventListener("submit", addPet);
  $("#reminderForm")?.addEventListener("submit", addReminder);
  $("#scanButton")?.addEventListener("click", scanCatBreed);

  setupAuthTabs();
  setupScanPreview();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeAuthModal();
    }
  });
}

// =====================================================
// INITIALIZE APP
// =====================================================

async function initializeApp() {
  setupEventListeners();

  updateFavoriteCount();
  renderPets();
  renderReminders();
  renderScanHistory();

  await Promise.all([
    loadBreeds(),
    checkLoginStatus()
  ]);

  if (state.currentUser) {
    await loadPrivateData();
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);
