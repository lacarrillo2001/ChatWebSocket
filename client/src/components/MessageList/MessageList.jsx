import { forwardRef } from 'react'
import MessageItem from '../MessageItem/MessageItem'

const MessageList = forwardRef(function MessageList({ messages, username }, ref) {
  return (
    <ul className="messages" ref={ref}>
      {messages.map((m, i) => (
        <MessageItem key={i} data={m} own={m.name === username} />
      ))}
    </ul>
  )
})
export default MessageList
