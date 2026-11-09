function BreedSection({
  serverStatus,
  search,
  setSearch,
  sortOrder,
  setSortOrder,
  showFavoritesOnly,
  setShowFavoritesOnly,
  loading,
  error,
  loadBreeds,
  filteredBreeds,
  favorites,
  openBreed,
  getBreedImageUrl,
  fallbackImage,
  toggleFavorite,
}) {
  return (
    <section id="breed-section" className="breed-section">
      <div className="section-heading">
        <div>
          <span className="section-label">CAT BREEDS</span>
          <h2>สายพันธุ์แมวทั้งหมด</h2>
          <p>เลือกดูข้อมูลแมวสายพันธุ์ที่คุณสนใจ</p>
        </div>

        <div className="server-status">
          <span className={serverStatus ? 'status-dot online' : 'status-dot'} />
          {serverStatus ? 'เชื่อมต่อเซิร์ฟเวอร์แล้ว' : 'กำลังตรวจสอบเซิร์ฟเวอร์'}
        </div>
      </div>

      <div className="breed-toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาสายพันธุ์แมว..."
          />
          {search && (
            <button onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        >
          <option value="az">เรียง A → Z</option>
          <option value="za">เรียง Z → A</option>
        </select>

        <button
          className={showFavoritesOnly ? 'btn-primary' : 'btn-outline'}
          onClick={() => setShowFavoritesOnly((value) => !value)}
        >
          ❤️ {showFavoritesOnly ? 'ดูทั้งหมด' : 'รายการโปรด'}
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-cat">🐈</div>
          <p>กำลังโหลดข้อมูลน้องแมว...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <span>😿</span>
          <h3>โหลดข้อมูลไม่สำเร็จ</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={loadBreeds}>
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {!loading && !error && filteredBreeds.length === 0 && (
        <div className="empty-state">
          <span>🐱</span>
          <h3>ไม่พบสายพันธุ์แมว</h3>
          <p>ลองค้นหาด้วยคำอื่น หรือเปลี่ยนตัวกรองค่ะ</p>
          <button
            className="btn-outline"
            onClick={() => {
              setSearch('')
              setShowFavoritesOnly(false)
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      )}

      {!loading && !error && filteredBreeds.length > 0 && (
        <>
          <div className="results-info">
            พบ {filteredBreeds.length} สายพันธุ์
          </div>

          <div className="breed-grid">
            {filteredBreeds.map((breed) => (
              <article className="breed-card" key={breed.id}>
                <div
                  className="breed-card-image"
                  onClick={() => openBreed(breed)}
                >
                  <img
                    src={getBreedImageUrl(breed)}
                    alt={breed.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = fallbackImage
                    }}
                  />

                  <button
                    className={`favorite-button ${
                      favorites.includes(breed.id) ? 'favorited' : ''
                    }`}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleFavorite(breed.id)
                    }}
                    aria-label="เพิ่มรายการโปรด"
                  >
                    {favorites.includes(breed.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                <div className="breed-card-content">
                  <span className="breed-origin">
                    {breed.origin || 'ไม่ระบุประเทศ'}
                  </span>

                  <h3>{breed.name}</h3>

                  <p className="breed-temperament">
                    {breed.temperament || 'น้องแมวแสนน่ารัก'}
                  </p>

                  <div className="breed-card-footer">
                    <span>
                      อายุขัย {breed.life_span || '-'} ปี
                    </span>

                    <button
                      className="text-button"
                      onClick={() => openBreed(breed)}
                    >
                      ดูรายละเอียด →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default BreedSection
