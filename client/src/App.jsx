import { useEffect, useMemo, useState } from 'react'
import {
  getBreeds,
  getBreedImage,
  getServerStatus,
} from './services/api'
import AppHeader from './components/AppHeader'
import HeroSection from './components/HeroSection'
import MainTabs from './components/MainTabs'
import MessageBanner from './components/MessageBanner'
import LoginRequired from './components/LoginRequired'
import BreedSection from './components/BreedSection'
import PetsSection from './components/PetsSection'
import RemindersSection from './components/RemindersSection'
import HistorySection from './components/HistorySection'
import BreedDetailModal from './components/BreedDetailModal'
import ReminderAlertModal from './components/ReminderAlertModal'
import './App.css'

const API_BASE = '/api'
const FAVORITES_KEY = 'catBreedFavorites'
const FALLBACK_CAT_IMAGE =
  'https://placehold.co/600x400/f4eee5/806b59?text=No+Breed+Photo'

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function formatDate(date) {
  if (!date) return '-'

  return new Date(date).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getBreedImageUrl(breed) {
  return breed?.image?.url || FALLBACK_CAT_IMAGE
}

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || data.error || 'เกิดข้อผิดพลาด')
  }

  return data
}

function App() {
  const [breeds, setBreeds] = useState([])
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('az')
  const [favorites, setFavorites] = useState(readFavorites)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedBreed, setSelectedBreed] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [serverStatus, setServerStatus] = useState(null)

  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [showAuth, setShowAuth] = useState(false)
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
  })

  const [pets, setPets] = useState([])
  const [petForm, setPetForm] = useState({
    name: '',
    breed: '',
    birthday: '',
    notes: '',
  })

  const [history, setHistory] = useState([])
  const [reminders, setReminders] = useState([])
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    due_at: '',
    repeat_rule: 'none',
  })

  const [activeTab, setActiveTab] = useState('breeds')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeReminderAlert, setActiveReminderAlert] = useState(null)

  // Hash Table: ใช้ breed.id เป็น Key และข้อมูลสายพันธุ์เป็น Value
  const breedHashTable = useMemo(() => {
    return new Map(breeds.map((breed) => [breed.id, breed]))
  }, [breeds])

  // โหลดข้อมูลสายพันธุ์แมว
  async function loadBreeds() {
    try {
      setLoading(true)
      setError('')

            const data = await getBreeds()

      const breedList = Array.isArray(data) ? data : []

      // แสดงข้อมูลสายพันธุ์ก่อน
      setBreeds(breedList)

      // ค้นหารูปเพิ่มเติมเฉพาะสายพันธุ์ที่ยังไม่มีรูป
      const breedsWithoutImages = breedList.filter(
        (breed) => !breed.image?.url && breed.id
      )

      // จำกัดการค้นหาครั้งละ 5 สายพันธุ์
      for (let i = 0; i < breedsWithoutImages.length; i += 5) {
        const batch = breedsWithoutImages.slice(i, i + 5)

        const imageResults = await Promise.all(
          batch.map(async (breed) => ({
            id: breed.id,
            url: await getBreedImage(breed.id),
          }))
        )

        setBreeds((currentBreeds) =>
          currentBreeds.map((breed) => {
            const result = imageResults.find(
              (item) => item.id === breed.id
            )

            if (!result?.url) return breed

            return {
              ...breed,
              image: { url: result.url },
            }
          })
        )
      }
    } catch (err) {
      setError(err.message || 'โหลดข้อมูลแมวไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  async function checkServer() {
    try {
      const status = await getServerStatus()
      setServerStatus(status)
    } catch {
      setServerStatus(null)
    }
  }

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  async function checkLogin() {
    try {
      const data = await apiRequest('/auth/me')
      setUser(data.user || data)
    } catch {
      setUser(null)
    }
  }

  async function loadUserData() {
    if (!user) return

    try {
      const [petsData, historyData, remindersData] = await Promise.all([
        apiRequest('/pets'),
        apiRequest('/scan-history'),
        apiRequest('/reminders'),
      ])

      setPets(Array.isArray(petsData) ? petsData : petsData.pets || [])
      setHistory(
        Array.isArray(historyData)
          ? historyData
          : historyData.history || historyData.records || []
      )
      setReminders(
        Array.isArray(remindersData)
          ? remindersData
          : remindersData.reminders || []
      )
    } catch (err) {
      setMessage(err.message || 'โหลดข้อมูลส่วนตัวไม่สำเร็จ')
    }
  }

  useEffect(() => {
    loadBreeds()
    checkServer()
    checkLogin()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserData()
    } else {
      setPets([])
      setHistory([])
      setReminders([])
    }
  }, [user])

  // บันทึกรายการโปรด
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  // ตรวจสอบการแจ้งเตือนที่ถึงเวลา
  useEffect(() => {
    if (!user || reminders.length === 0) return

    const checkReminders = () => {
      const now = Date.now()

      const dueReminder = reminders.find((reminder) => {
        if (reminder.is_done) return false

        const dueTime = new Date(reminder.due_at).getTime()
        if (Number.isNaN(dueTime) || dueTime > now) return false

        const shownKey = `reminderShown_${reminder.id}_${reminder.due_at}`

        if (sessionStorage.getItem(shownKey)) return false

        sessionStorage.setItem(shownKey, 'true')
        return true
      })

      if (dueReminder) {
        setActiveReminderAlert(dueReminder)

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🐱 ถึงเวลาดูแลน้องแมวแล้ว', {
            body: dueReminder.title,
          })
        }
      }
    }

    checkReminders()
    const timer = setInterval(checkReminders, 15000)

    return () => clearInterval(timer)
  }, [user, reminders])

  // Insertion Sort
  function insertionSort(items, order) {
    const result = [...items]

    for (let i = 1; i < result.length; i++) {
      const current = result[i]
      let j = i - 1

      while (j >= 0) {
        const comparison = result[j].name.localeCompare(
          current.name,
          'en',
          { sensitivity: 'base' }
        )

        const shouldMove =
          order === 'az'
            ? comparison > 0
            : comparison < 0

        if (!shouldMove) break

        result[j + 1] = result[j]
        j--
      }

      result[j + 1] = current
    }

    return result
  }

  const filteredBreeds = useMemo(() => {
    let result = [...breeds]

    if (search.trim()) {
      const keyword = search.toLowerCase()

      result = result.filter((breed) => {
        return [
          breed.name,
          breed.origin,
          breed.temperament,
          breed.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })
    }

    if (showFavoritesOnly) {
      result = result.filter((breed) => favorites.includes(breed.id))
    }

    return insertionSort(result, sortOrder)
  }, [breeds, search, sortOrder, favorites, showFavoritesOnly])

  function toggleFavorite(breedId) {
    setFavorites((current) =>
      current.includes(breedId)
        ? current.filter((id) => id !== breedId)
        : [...current, breedId]
    )
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const endpoint =
        authMode === 'register'
          ? '/auth/register'
          : '/auth/login'

      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm),
      })

      setUser(data.user || data)
      setShowAuth(false)

      setAuthForm({
        username: '',
        email: '',
        password: '',
      })

      setMessage(
        authMode === 'register'
          ? 'สมัครสมาชิกสำเร็จค่ะ'
          : 'เข้าสู่ระบบสำเร็จค่ะ'
      )
    } catch (err) {
      setMessage(err.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      })

      setUser(null)
      setActiveTab('breeds')
      setMessage('ออกจากระบบแล้วค่ะ')
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function addPet(event) {
    event.preventDefault()

    if (!petForm.name.trim()) {
      setMessage('กรุณากรอกชื่อแมวค่ะ')
      return
    }

    try {
      await apiRequest('/pets', {
        method: 'POST',
        body: JSON.stringify(petForm),
      })

      setPetForm({
        name: '',
        breed: '',
        birthday: '',
        notes: '',
      })

      await loadUserData()
      setMessage('เพิ่มข้อมูลน้องแมวแล้วค่ะ')
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function deletePet(id) {
    if (!window.confirm('ต้องการลบข้อมูลแมวตัวนี้หรือไม่?')) return

    try {
      await apiRequest(`/pets/${id}`, {
        method: 'DELETE',
      })

      await loadUserData()
      setMessage('ลบข้อมูลแมวแล้วค่ะ')
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function addReminder(event) {
    event.preventDefault()

    if (!reminderForm.title.trim() || !reminderForm.due_at) {
      setMessage('กรุณากรอกชื่อและวันเวลาที่ต้องการแจ้งเตือนค่ะ')
      return
    }

    try {
      await apiRequest('/reminders', {
        method: 'POST',
        body: JSON.stringify({
          ...reminderForm,
          due_at: new Date(reminderForm.due_at).toISOString(),
        }),
      })

      setReminderForm({
        title: '',
        description: '',
        due_at: '',
        repeat_rule: 'none',
      })

      await loadUserData()
      setMessage('เพิ่มการแจ้งเตือนแล้วค่ะ')
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function completeReminder(reminder) {
    try {
      await apiRequest(`/reminders/${reminder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_done: !reminder.is_done,
        }),
      })

      setActiveReminderAlert(null)
      await loadUserData()
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function deleteReminder(id) {
    if (!window.confirm('ต้องการลบการแจ้งเตือนนี้หรือไม่?')) return

    try {
      await apiRequest(`/reminders/${id}`, {
        method: 'DELETE',
      })

      await loadUserData()
      setMessage('ลบการแจ้งเตือนแล้วค่ะ')
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setMessage('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนค่ะ')
      return
    }

    const permission = await Notification.requestPermission()

    setMessage(
      permission === 'granted'
        ? 'เปิดการแจ้งเตือนแล้วค่ะ'
        : 'ยังไม่ได้อนุญาตการแจ้งเตือนค่ะ'
    )
  }

  async function addScanHistory(breed) {
    if (!user) {
      setMessage('กรุณาเข้าสู่ระบบก่อนบันทึกประวัติค่ะ')
      return
    }

    try {
      await apiRequest('/scan-history', {
        method: 'POST',
        body: JSON.stringify({
          breed_id: breed.id,
          breed_name: breed.name,
        }),
      })

      await loadUserData()
    } catch (err) {
      setMessage(err.message)
    }
  }

  function openBreed(breed) {
    // ค้นหาข้อมูลสายพันธุ์ด้วย ID จาก Hash Table
    const breedFromHashTable = breedHashTable.get(breed.id)
    const selected = breedFromHashTable || breed

    setSelectedBreed(selected)
    addScanHistory(selected)
  }

  return (
    <div className="cat-app">
      <AppHeader
        user={user}
        handleLogout={handleLogout}
        setShowAuth={setShowAuth}
        setActiveTab={setActiveTab}
      />

      <main>
        <HeroSection
          setActiveTab={setActiveTab}
          setShowFavoritesOnly={setShowFavoritesOnly}
          favorites={favorites}
          breeds={breeds}
          pets={pets}
          fallbackImage={FALLBACK_CAT_IMAGE}
        />

        <MainTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <MessageBanner
          message={message}
          setMessage={setMessage}
        />

        {!user && activeTab !== 'breeds' && (
          <LoginRequired onLogin={() => setShowAuth(true)} />
        )}

        {activeTab === 'breeds' && (
          <BreedSection
            serverStatus={serverStatus}
            search={search}
            setSearch={setSearch}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            loading={loading}
            error={error}
            loadBreeds={loadBreeds}
            filteredBreeds={filteredBreeds}
            favorites={favorites}
            openBreed={openBreed}
            getBreedImageUrl={getBreedImageUrl}
            fallbackImage={FALLBACK_CAT_IMAGE}
            toggleFavorite={toggleFavorite}
          />
        )}

        {activeTab === 'pets' && user && (
          <PetsSection
            petForm={petForm}
            setPetForm={setPetForm}
            addPet={addPet}
            pets={pets}
            deletePet={deletePet}
          />
        )}

        {activeTab === 'reminders' && user && (
          <RemindersSection
            reminderForm={reminderForm}
            setReminderForm={setReminderForm}
            addReminder={addReminder}
            enableNotifications={enableNotifications}
            reminders={reminders}
            formatDate={formatDate}
            completeReminder={completeReminder}
            deleteReminder={deleteReminder}
          />
        )}

        {activeTab === 'history' && user && (
          <HistorySection
            history={history}
            formatDate={formatDate}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-cat">🐈</div>
        <h3>Cat Breed Explorer</h3>
        <p>พื้นที่เล็ก ๆ สำหรับคนรักแมว</p>
        <small>
          Cat breed information powered by TheCatAPI
        </small>
      </footer>

      {/* Login / Register Modal */}
      {showAuth && (
        <div className="modal-overlay" onClick={() => setShowAuth(false)}>
          <div
            className="auth-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>

            <div className="auth-icon">🐱</div>

            <h2>
              {authMode === 'login' ? 'ยินดีต้อนรับกลับค่ะ' : 'สมัครสมาชิก'}
            </h2>

            <p>
              {authMode === 'login'
                ? 'เข้าสู่ระบบเพื่อจัดการข้อมูลน้องแมว'
                : 'สร้างบัญชีสำหรับคนรักแมว'}
            </p>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  ชื่อผู้ใช้
                  <input
                    value={authForm.username}
                    onChange={(event) =>
                      setAuthForm({
                        ...authForm,
                        username: event.target.value,
                      })
                    }
                    placeholder="ชื่อผู้ใช้"
                    required
                  />
                </label>
              )}

              <label>
                อีเมล
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      email: event.target.value,
                    })
                  }
                  placeholder="example@email.com"
                  required
                />
              </label>

              <label>
                รหัสผ่าน
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm({
                      ...authForm,
                      password: event.target.value,
                    })
                  }
                  placeholder="รหัสผ่าน"
                  required
                />
              </label>

              <button className="btn-primary auth-submit" disabled={busy}>
                {busy
                  ? 'กำลังดำเนินการ...'
                  : authMode === 'login'
                    ? 'เข้าสู่ระบบ'
                    : 'สมัครสมาชิก'}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === 'login' ? (
                <>
                  ยังไม่มีบัญชี?{' '}
                  <button onClick={() => setAuthMode('register')}>
                    สมัครสมาชิก
                  </button>
                </>
              ) : (
                <>
                  มีบัญชีแล้ว?{' '}
                  <button onClick={() => setAuthMode('login')}>
                    เข้าสู่ระบบ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <BreedDetailModal
        selectedBreed={selectedBreed}
        setSelectedBreed={setSelectedBreed}
        getBreedImageUrl={getBreedImageUrl}
        fallbackImage={FALLBACK_CAT_IMAGE}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />

      <ReminderAlertModal
        activeReminderAlert={activeReminderAlert}
        setActiveReminderAlert={setActiveReminderAlert}
        completeReminder={completeReminder}
      />
    </div>
  )
}

export default App