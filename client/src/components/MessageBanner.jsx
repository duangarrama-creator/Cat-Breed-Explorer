function MessageBanner({ message, setMessage }) {
  if (!message) return null

  return (
    <div className="message-banner">
      <span>{message}</span>
      <button onClick={() => setMessage('')}>×</button>
    </div>
  )
}

export default MessageBanner
