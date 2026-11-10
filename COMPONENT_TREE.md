# Component Tree
## Cat Breed Explorer & Cat Care

เอกสารนี้แสดงโครงสร้างส่วนประกอบ (Component Tree)
ของเว็บไซต์ Cat Breed Explorer & Cat Care
ซึ่งพัฒนาด้วย React และ Vite

## 1. ภาพรวมโครงสร้าง Component

```text
main.jsx
└── App.jsx
    ├── AppHeader
    ├── HeroSection
    ├── MainTabs
    ├── MessageBanner
    ├── LoginRequired
    ├── BreedSection
    ├── PetsSection
    ├── RemindersSection
    ├── HistorySection
    ├── BreedDetailModal
    └── ReminderAlertModal
```

หมายเหตุ:
- App.jsx เป็น Component หลักที่ควบคุมการทำงานของหน้าเว็บไซต์
- Component ต่าง ๆ ถูกเรียกใช้งานจาก App.jsx
- บางส่วนจะแสดงผลตามสถานะการเข้าสู่ระบบ
  หรือเมนูที่ผู้ใช้งานเลือก

## 2. รายละเอียดหน้าที่ของแต่ละ Component

| Component | หน้าที่ |
|---|---|
| AppHeader | แสดงส่วนหัวและเมนูนำทางของเว็บไซต์ |
| HeroSection | แสดงส่วนแนะนำเว็บไซต์ |
| MainTabs | แสดงเมนูแบ่งหมวดหมู่การใช้งาน |
| MessageBanner | แสดงข้อความแจ้งเตือนหรือข้อความสถานะ |
| LoginRequired | แสดงข้อความแจ้งให้เข้าสู่ระบบก่อนใช้งาน |
| BreedSection | แสดงและจัดการข้อมูลสายพันธุ์แมว |
| PetsSection | แสดงส่วนจัดการข้อมูลแมวของผู้ใช้งาน |
| RemindersSection | แสดงส่วนจัดการการแจ้งเตือนการดูแลแมว |
| HistorySection | แสดงประวัติการสแกน |
| BreedDetailModal | แสดงหน้าต่างรายละเอียดสายพันธุ์แมว |
| ReminderAlertModal | แสดงหน้าต่างแจ้งเตือนการดูแลแมว |

## 3. โครงสร้างไฟล์ Frontend

```text
client/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── index.css
    │
    ├── components/
    │   ├── AppHeader.jsx
    │   ├── HeroSection.jsx
    │   ├── MainTabs.jsx
    │   ├── MessageBanner.jsx
    │   ├── LoginRequired.jsx
    │   ├── BreedSection.jsx
    │   ├── BreedDetailModal.jsx
    │   ├── PetsSection.jsx
    │   ├── RemindersSection.jsx
    │   ├── ReminderAlertModal.jsx
    │   └── HistorySection.jsx
    │
    ├── services/
    │   └── api.js
    │
    └── assets/
        ├── hero.png
        ├── react.svg
        └── vite.svg
```

## 4. หน้าที่ของไฟล์หลัก

- main.jsx: จุดเริ่มต้นของ React Application
- App.jsx: Component หลักและควบคุมการแสดงผลของเว็บไซต์
- App.css: กำหนดรูปแบบการตกแต่งส่วนประกอบของเว็บไซต์
- index.css: กำหนดรูปแบบ CSS พื้นฐาน
- services/api.js: จัดการการเรียกใช้งาน API ระหว่าง Frontend และ Backend
- components/: จัดเก็บ Component ที่แบ่งตามหน้าที่การทำงาน
- assets/: จัดเก็บรูปภาพและไฟล์ประกอบเว็บไซต์

## 5. การทำงานร่วมกันของ Component

App.jsx ทำหน้าที่เป็นศูนย์กลางในการจัดการสถานะ
และเรียกใช้ Component ต่าง ๆ เพื่อแสดงผลหน้าเว็บไซต์

Component แต่ละส่วนรับข้อมูลและฟังก์ชันจาก App.jsx
เพื่อให้สามารถทำงานร่วมกันได้อย่างเป็นระบบ
และช่วยให้การพัฒนาและดูแลโค้ดทำได้สะดวกยิ่งขึ้น
