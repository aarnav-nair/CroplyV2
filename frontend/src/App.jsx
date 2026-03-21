import { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import HomePage from './components/HomePage.jsx'
import ScanPage from './components/ScanPage.jsx'
import ResultsPage from './components/ResultsPage.jsx'
import CartPage from './components/CartPage.jsx'
import AlertMapPage from './components/AlertMapPage.jsx'
import HistoryPage from './components/HistoryPage.jsx'
import toast from 'react-hot-toast'

export default function App() {
  const [view, setView]             = useState('home')
  const [lang, setLang]             = useState('en')
  const [cart, setCart]             = useState([])
  const [scanResult, setScanResult] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [scanHistory, setScanHistory] = useState([])
  const [theme, setTheme]           = useState(() => localStorage.getItem('croply-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('croply-theme', theme)
  }, [theme])

  function toggleTheme() { setTheme(t => t === 'light' ? 'dark' : 'light') }
  function navigate(to) { setView(to); window.scrollTo({top:0,behavior:'smooth'}) }

  function handleResult(result, preview) {
    setScanResult(result)
    setImgPreview(preview)
    // Add to history
    setScanHistory(prev => [{
      id: result.scan_id,
      date: new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'}),
      crop: result.crop,
      crop_hi: result.crop_hi,
      disease: result.disease_name,
      disease_hi: result.disease_name_hi,
      severity: result.severity,
      confidence: result.confidence,
      resolved: false,
      products: [],
    }, ...prev])
    navigate('results')
  }

  function addToCart(product) {
    setCart(prev => {
      const ex = prev.find(i => i.id===product.id)
      if (ex) { toast.success('Quantity updated'); return prev.map(i => i.id===product.id ? {...i,quantity:i.quantity+1} : i) }
      toast.success('Added to cart')
      // Record product in last scan history entry
      setScanHistory(h => h.length ? h.map((s,i) => i===0 ? {...s, products:[...new Set([...s.products, product.name])]} : s) : h)
      return [...prev, {...product, quantity:1}]
    })
  }

  const cartCount = cart.reduce((s,i) => s+i.quantity, 0)

  return (
    <div style={{minHeight:'100vh', background:'var(--bg)', transition:'background 0.2s'}}>
      <Navbar
        cartCount={cartCount} onNavigate={navigate} currentView={view}
        lang={lang} setLang={setLang}
        theme={theme} toggleTheme={toggleTheme}
      />
      <main>
        {view==='home'    && <HomePage onNavigate={navigate} lang={lang}/>}
        {view==='scan'    && <ScanPage onResult={handleResult} lang={lang}/>}
        {view==='results' && scanResult && <ResultsPage result={scanResult} imagePreview={imgPreview} onAddToCart={addToCart} onNavigate={navigate} lang={lang}/>}
        {view==='results' && !scanResult && (
          <div className="container py-20 text-center">
            <p className="font-body text-sm mb-4" style={{color:'var(--muted)'}}>Please scan a crop first.</p>
            <button onClick={() => navigate('scan')} className="btn-primary btn-md">Go to Scan</button>
          </div>
        )}
        {view==='cart'    && <CartPage cart={cart} onUpdateCart={setCart} onNavigate={navigate} lang={lang}/>}
        {view==='map'     && <AlertMapPage lang={lang}/>}
        {view==='history' && <HistoryPage onNavigate={navigate} lang={lang} scanHistory={scanHistory}/>}
      </main>
    </div>
  )
}
