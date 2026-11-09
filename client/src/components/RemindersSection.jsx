function RemindersSection({
  reminderForm,
  setReminderForm,
  addReminder,
  enableNotifications,
  reminders,
  formatDate,
  completeReminder,
  deleteReminder,
}) {
  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <span className="section-label">CAT CARE</span>
          <h2>การแจ้งเตือนดูแลน้องแมว 🔔</h2>
          <p>ตั้งเตือนเวลาให้อาหาร อาบน้ำ ฉีดวัคซีน หรือพบสัตวแพทย์</p>
        </div>

        <button className="btn-outline" onClick={enableNotifications}>
          เปิดการแจ้งเตือนบนเบราว์เซอร์
        </button>
      </div>

      <form className="form-card" onSubmit={addReminder}>
        <h3>➕ เพิ่มการแจ้งเตือน</h3>

        <div className="form-grid">
          <label>
            หัวข้อ *
            <input
              value={reminderForm.title}
              onChange={(event) =>
                setReminderForm({
                  ...reminderForm,
                  title: event.target.value,
                })
              }
              placeholder="เช่น ให้อาหารน้องแมว"
              required
            />
          </label>

          <label>
            วันและเวลา *
            <input
              type="datetime-local"
              value={reminderForm.due_at}
              onChange={(event) =>
                setReminderForm({
                  ...reminderForm,
                  due_at: event.target.value,
                })
              }
              required
            />
          </label>

          <label>
            การแจ้งเตือนซ้ำ
            <select
              value={reminderForm.repeat_rule}
              onChange={(event) =>
                setReminderForm({
                  ...reminderForm,
                  repeat_rule: event.target.value,
                })
              }
            >
              <option value="none">ไม่แจ้งซ้ำ</option>
              <option value="daily">ทุกวัน</option>
              <option value="weekly">ทุกสัปดาห์</option>
              <option value="monthly">ทุกเดือน</option>
            </select>
          </label>

          <label>
            รายละเอียดเพิ่มเติม
            <input
              value={reminderForm.description}
              onChange={(event) =>
                setReminderForm({
                  ...reminderForm,
                  description: event.target.value,
                })
              }
              placeholder="รายละเอียด..."
            />
          </label>
        </div>

        <button className="btn-primary" type="submit">
          บันทึกการแจ้งเตือน
        </button>
      </form>

      {reminders.length === 0 ? (
        <div className="empty-state">
          <span>🔔</span>
          <h3>ยังไม่มีการแจ้งเตือน</h3>
          <p>เพิ่มรายการดูแลน้องแมวที่ต้องการได้เลยค่ะ</p>
        </div>
      ) : (
        <div className="reminder-list">
          {reminders.map((reminder) => (
            <article
              className={`reminder-card ${
                reminder.is_done ? 'completed' : ''
              }`}
              key={reminder.id}
            >
              <div className="reminder-icon">
                {reminder.is_done ? '✅' : '🔔'}
              </div>

              <div className="reminder-content">
                <h3>{reminder.title}</h3>
                <p>{reminder.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                <small>📅 {formatDate(reminder.due_at)}</small>
                <small>
                  🔁{' '}
                  {{
                    none: 'ไม่แจ้งซ้ำ',
                    daily: 'ทุกวัน',
                    weekly: 'ทุกสัปดาห์',
                    monthly: 'ทุกเดือน',
                  }[reminder.repeat_rule] || 'ไม่แจ้งซ้ำ'}
                </small>
              </div>

              <div className="reminder-actions">
                <button
                  className="btn-outline"
                  onClick={() => completeReminder(reminder)}
                >
                  {reminder.is_done ? 'ยกเลิกการทำเสร็จ' : 'ทำเสร็จแล้ว'}
                </button>

                <button
                  className="btn-danger"
                  onClick={() => deleteReminder(reminder.id)}
                >
                  ลบ
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default RemindersSection
