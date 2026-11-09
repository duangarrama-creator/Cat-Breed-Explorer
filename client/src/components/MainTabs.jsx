function MainTabs({ activeTab, setActiveTab }) {
  return (
    <nav className="main-tabs">
      <button
        className={activeTab === 'breeds' ? 'active' : ''}
        onClick={() => setActiveTab('breeds')}
      >
        🐈 สายพันธุ์แมว
      </button>

      <button
        className={activeTab === 'pets' ? 'active' : ''}
        onClick={() => setActiveTab('pets')}
      >
        🐾 แมวของฉัน
      </button>

      <button
        className={activeTab === 'reminders' ? 'active' : ''}
        onClick={() => setActiveTab('reminders')}
      >
        🔔 การแจ้งเตือน
      </button>

      <button
        className={activeTab === 'history' ? 'active' : ''}
        onClick={() => setActiveTab('history')}
      >
        📖 ประวัติ
      </button>
    </nav>
  )
}

export default MainTabs
