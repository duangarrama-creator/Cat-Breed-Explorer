function HeroSection({
  setActiveTab,
  setShowFavoritesOnly,
  favorites,
  breeds,
  pets,
  fallbackImage,
}) {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-label">WELCOME TO THE CAT WORLD</span>

        <h1>
          ค้นพบแมวสายพันธุ์
          <br />
          <span>ที่ใช่สำหรับคุณ</span>
        </h1>

        <p>
          ทำความรู้จักกับน้องแมวหลากหลายสายพันธุ์
          พร้อมข้อมูลและรูปภาพน่ารัก ๆ
        </p>

        <div className="hero-buttons">
          <button
            className="btn-primary"
            onClick={() => {
              setActiveTab('breeds')
              document
                .getElementById('breed-section')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            สำรวจสายพันธุ์แมว
          </button>

          <button
            className="btn-outline"
            onClick={() => setShowFavoritesOnly((value) => !value)}
          >
            ❤️ รายการโปรด ({favorites.length})
          </button>
        </div>

        <div className="hero-stats">
          <div>
            <strong>{breeds.length || '—'}</strong>
            <span>สายพันธุ์แมว</span>
          </div>

          <div>
            <strong>{favorites.length}</strong>
            <span>รายการโปรด</span>
          </div>

          <div>
            <strong>{pets.length}</strong>
            <span>แมวของฉัน</span>
          </div>
        </div>
      </div>

      <div className="hero-image">
        <img
          src="https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg"
          alt="แมวน่ารัก"
          onError={(event) => {
            event.currentTarget.src = fallbackImage
          }}
        />

        <div className="floating-note">
          <span>🐾</span>
          <div>
            <strong>Every cat is special</strong>
            <small>แมวทุกตัวมีความพิเศษ</small>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
