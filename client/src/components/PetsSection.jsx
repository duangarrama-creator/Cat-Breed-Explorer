function PetsSection({
  petForm,
  setPetForm,
  addPet,
  pets,
  deletePet,
}) {
  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <span className="section-label">MYCATS</span>
          <h2>น้องแมวของฉัน 🐾</h2>
          <p>เก็บข้อมูลและบันทึกเรื่องราวของน้องแมว</p>
        </div>
      </div>

      <form className="form-card" onSubmit={addPet}>
        <h3>➕ เพิ่มข้อมูลน้องแมว</h3>

        <div className="form-grid">
          <label>
            ชื่อแมว *
            <input
              value={petForm.name}
              onChange={(event) =>
                setPetForm({ ...petForm, name: event.target.value })
              }
              placeholder="ชื่อน้องแมว"
              required
            />
          </label>

          <label>
            สายพันธุ์
            <input
              value={petForm.breed}
              onChange={(event) =>
                setPetForm({ ...petForm, breed: event.target.value })
              }
              placeholder="เช่น Persian"
            />
          </label>

          <label>
            วันเกิด
            <input
              type="date"
              value={petForm.birthday}
              onChange={(event) =>
                setPetForm({ ...petForm, birthday: event.target.value })
              }
            />
          </label>

          <label>
            หมายเหตุ
            <input
              value={petForm.notes}
              onChange={(event) =>
                setPetForm({ ...petForm, notes: event.target.value })
              }
              placeholder="ข้อมูลเพิ่มเติม"
            />
          </label>
        </div>

        <button className="btn-primary" type="submit">
          บันทึกข้อมูลแมว
        </button>
      </form>

      {pets.length === 0 ? (
        <div className="empty-state">
          <span>🐈</span>
          <h3>ยังไม่มีข้อมูลน้องแมว</h3>
          <p>เพิ่มข้อมูลแมวของคุณได้จากแบบฟอร์มด้านบนค่ะ</p>
        </div>
      ) : (
        <div className="pet-grid">
          {pets.map((pet) => (
            <article className="pet-card" key={pet.id}>
              <div className="pet-card-icon">🐈</div>
              <h3>{pet.name}</h3>
              <p>สายพันธุ์: {pet.breed || 'ไม่ระบุ'}</p>
              <p>วันเกิด: {pet.birthday || 'ไม่ระบุ'}</p>
              {pet.notes && <p>{pet.notes}</p>}

              <button
                className="btn-danger"
                onClick={() => deletePet(pet.id)}
              >
                ลบข้อมูล
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PetsSection
