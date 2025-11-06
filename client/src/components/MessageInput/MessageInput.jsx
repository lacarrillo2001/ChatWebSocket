import { useEffect, useState } from 'react'

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('')
  useEffect(()=>()=>onTyping(false),[])
  return (
    <div className="inputRow">
      <input className="input" placeholder="Escribe un mensaje…"
             value={text}
             onChange={(e)=>{ setText(e.target.value); onTyping(true) }}
             onBlur={()=> onTyping(false)}
             onKeyDown={(e)=>{ if(e.key==='Enter'){ onSend(text); setText(''); onTyping(false) } }} />
      <button className="button" onClick={()=>{ onSend(text); setText(''); onTyping(false) }}>
        Enviar
      </button>
    </div>
  )
}
