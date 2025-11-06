import { useEffect, useRef } from 'react'
import { useChatSocket } from '../../hooks/useChatSocket'
import MessageList from '../MessageList/MessageList'
import MessageInput from '../MessageInput/MessageInput'

export default function Chat({ username, onLogout }) {
  const { clients, messages, typing, sendMessage, sendTyping } = useChatSocket(username)
  const listRef = useRef(null)

  // autoscroll
  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, typing])

  return (
    <div className="grid card">
      <div className="topbar">
        <strong>iChat 💬</strong>
        <strong>{username}</strong>
        <span className="counter">Conectados: {clients}</span>
        <div style={{marginLeft:'auto'}}>
          <button className="button" style={{background:'#ef4444'}} onClick={onLogout}>Salir</button>
        </div>
      </div>

      <MessageList ref={listRef} messages={messages} username={username} />
      {typing ? <div className="typing">{typing}</div> : null}

      <MessageInput onSend={sendMessage} onTyping={(is)=>{
        sendTyping(is ? `✍️ ${username} está escribiendo…` : '')
      }} />
    </div>
  )
}
