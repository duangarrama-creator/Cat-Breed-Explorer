function AppHeader({ user, handleLogout, setShowAuth, setActiveTab }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setActiveTab('breeds')
          }}
        >
          <span className="brand-icon">🐈</span>
          <span>
            <strong>Cat Breed Explorer</strong>
            <small>สำรวจโลกของสายพันธุ์แมว</small>
          </span>
        </a>

        <div className="header-actions">
          {user ? (
            <>
              <span className="user-greeting">
                สวัสดี {user.username || user.email || 'คนรักแมว'} 🐾
              </span>
              <button className="btn-outline" onClick={handleLogout}>
                ออกจากระบบ
              </button>
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={() => setShowAuth(true)}
            >
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader
