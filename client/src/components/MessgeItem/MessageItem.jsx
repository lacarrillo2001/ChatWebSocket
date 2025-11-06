
function fmt(dt){ try { return new Date(dt).toLocaleString() } catch { return String(dt) } }

export default function MessageItem({ data, own }) {
  const { name='anonymous', message='', dateTime } = data
  return (
    <li className={`item ${own ? 'right' : 'left'}`}>
      <div className="bubble">
        <div className="msg-name">{name}</div>
        <div className="msg-text">{message}</div>
        <div className="msg-meta">{fmt(dateTime)}</div>
      </div>
    </li>
  )
}
