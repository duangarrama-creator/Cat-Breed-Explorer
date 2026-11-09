function ReminderAlertModal({
  activeReminderAlert,
  setActiveReminderAlert,
  completeReminder,
}) {
  if (!activeReminderAlert) return null

  return (
    <div
      className="modal-overlay reminder-alert-overlay"
      onClick={() => setActiveReminderAlert(null)}
    >
      <div
        className="reminder-alert-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="reminder-alert-icon">🔔🐱</div>
        <h2>ถึงเวลาดูแลน้องแมวแล้ว!</h2>
        <h3>{activeReminderAlert.title}</h3>

        {activeReminderAlert.description && (
          <p>{activeReminderAlert.description}</p>
        )}

        <div className="alert-actions">
          <button
            className="btn-primary"
            onClick={() => completeReminder(activeReminderAlert)}
          >
            ทำเสร็จแล้ว
          </button>

          <button
            className="btn-outline"
            onClick={() => setActiveReminderAlert(null)}
          >
            เตือนภายหลัง
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReminderAlertModal
