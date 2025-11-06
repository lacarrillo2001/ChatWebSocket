import { useState } from 'react'
import Login from './components/login/Login'
import Chat from './components/Chat/Chat'
import './App.css'

export default function App() {
  const [username, setUsername] = useState('')
  return (
    <div className="container">
      {username ? (
        <Chat username={username} onLogout={()=>setUsername('')} />
      ) : (
        <Login onEnter={setUsername} />
      )}
    </div>
  )
}
