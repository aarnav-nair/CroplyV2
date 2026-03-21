import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="bottom-right" toastOptions={{
      style: { fontFamily:"'Outfit', sans-serif", background:'#141A10', color:'#F5F3EE', borderRadius:'12px', fontSize:'14px' },
      success: { iconTheme: { primary:'#52B788', secondary:'#141A10' } },
      error:   { iconTheme: { primary:'#EF4444', secondary:'#141A10' } },
    }}/>
  </React.StrictMode>,
)
