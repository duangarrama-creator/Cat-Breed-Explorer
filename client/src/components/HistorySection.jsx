function HistorySection({
  history,
  formatDate,
  setActiveTab,
}) {
  return (
    <section className="dashboard-section">
      <div className="section-heading">
        <div>
          <span className="section-label">YOUR HISTORY</span>
          <h2>ประวัติการดูสายพันธุ์แมว 📖</h2>
          <p>สายพันธุ์ที่คุณเคยเปิดดู</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <span>📖</span>
          <h3>ยังไม่มีประวัติ</h3>
          <p>ลองเปิดดูรายละเอียดสายพันธุ์แมวเพื่อบันทึกประวัติค่ะ</p>
          <button
            className="btn-primary"
            onClick={() => setActiveTab('breeds')}
          >
            สำรวจสายพันธุ์แมว
          </button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <article className="history-card" key={item.id}>
              <span>🐈</span>
              <div>
                <strong>
                  {item.breed_name || item.name || 'สายพันธุ์แมว'}
                </strong>
                <small>
                  {formatDate(item.created_at || item.scanned_at)}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default HistorySection
