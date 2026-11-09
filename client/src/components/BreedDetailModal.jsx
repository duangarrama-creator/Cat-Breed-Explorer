function BreedDetailModal({
  selectedBreed,
  setSelectedBreed,
  getBreedImageUrl,
  fallbackImage,
  favorites,
  toggleFavorite,
}) {
  if (!selectedBreed) return null

  return (
    <div
      className="modal-overlay"
      onClick={() => setSelectedBreed(null)}
    >
      <div
        className="breed-detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={() => setSelectedBreed(null)}
        >
          ×
        </button>

        <div className="detail-image">
          <img
            src={getBreedImageUrl(selectedBreed)}
            alt={selectedBreed.name}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = fallbackImage
            }}
          />
        </div>

        <div className="detail-content">
          <span className="section-label">CAT BREED DETAILS</span>
          <h2>{selectedBreed.name}</h2>

          <p className="detail-origin">
            🌍 ประเทศต้นกำเนิด: {selectedBreed.origin || 'ไม่ระบุ'}
          </p>

          <p>
            <strong>อายุขัย:</strong> {selectedBreed.life_span || '-'} ปี
          </p>

          <p>
            <strong>นิสัย:</strong>{' '}
            {selectedBreed.temperament || 'ไม่ระบุ'}
          </p>

          <p>
            <strong>คำอธิบาย:</strong>
          </p>

          <p className="detail-description">
            {selectedBreed.description || 'ยังไม่มีคำอธิบายเพิ่มเติม'}
          </p>

          <button
            className={`btn-primary ${
              favorites.includes(selectedBreed.id) ? 'is-favorite' : ''
            }`}
            onClick={() => toggleFavorite(selectedBreed.id)}
          >
            {favorites.includes(selectedBreed.id)
              ? '❤️ นำออกจากรายการโปรด'
              : '🤍 เพิ่มในรายการโปรด'}
          </button>

          <a
            className="wiki-link"
            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(
              selectedBreed.name
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            อ่านข้อมูลเพิ่มเติม ↗
          </a>
        </div>
      </div>
    </div>
  )
}

export default BreedDetailModal
