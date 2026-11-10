const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

// โหลดข้อมูลสายพันธุ์แมว
export async function getBreeds() {
  const response = await fetch(`${API_BASE_URL}/breeds`);

  if (!response.ok) {
    throw new Error('ไม่สามารถโหลดข้อมูลสายพันธุ์แมวได้');
  }

  const data = await response.json();

  if (!Array.isArray(data.breeds)) {
    throw new Error('รูปแบบข้อมูลสายพันธุ์แมวไม่ถูกต้อง');
  }

  return data.breeds;
}

// ดึงรูปภาพเฉพาะสายพันธุ์ด้วย ID
export async function getBreedImage(breedId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/breeds/${encodeURIComponent(breedId)}/image`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return data.image?.url || null;
  } catch (error) {
    console.error('โหลดรูปสายพันธุ์ไม่สำเร็จ:', breedId, error);
    return null;
  }
}

// ตรวจสอบ Backend
export async function getServerStatus() {
  const response = await fetch(`${API_BASE_URL}/status`);

  if (!response.ok) {
    throw new Error('ไม่สามารถเชื่อมต่อ Backend ได้');
  }

  return response.json();
}
