const API_BASE_URL = '/api';

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

// ดึง URL รูปแมวจากข้อมูลสายพันธุ์โดยตรง
export async function getBreedImage(breedId) {
  const breeds = await getBreeds();

  const breed = breeds.find((item) => item.id === breedId);

  return breed?.image?.url || null;
}

// ตรวจสอบ Backend
export async function getServerStatus() {
  const response = await fetch(`${API_BASE_URL}/status`);

  if (!response.ok) {
    throw new Error('ไม่สามารถเชื่อมต่อ Backend ได้');
  }

  return response.json();
}