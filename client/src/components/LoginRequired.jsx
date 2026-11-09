function LoginRequired({ onLogin }) {
  return (
    <section className="login-required">
      <div className="login-required-icon">🔐</div>
      <h2>เข้าสู่ระบบก่อนนะคะ</h2>
      <p>ฟีเจอร์นี้ต้องเข้าสู่ระบบเพื่อบันทึกข้อมูลส่วนตัวค่ะ</p>
      <button
        className="btn-primary"
        onClick={onLogin}
      >
        เข้าสู่ระบบ / สมัครสมาชิก
      </button>
    </section>
  )
}

export default LoginRequired
