import { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import HomePage from './components/HomePage.jsx'
import ScanPage from './components/ScanPage.jsx'
import ResultsPage from './components/ResultsPage.jsx'
import CartPage from './components/CartPage.jsx'
import AlertMapPage from './components/AlertMapPage.jsx'
import HistoryPage from './components/HistoryPage.jsx'
import toast from 'react-hot-toast'

// ── Persistent state helper ───────────────────────────────────────────────────
function useLocalState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch { return defaultValue }
  })

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) }
    catch {}
  }, [key, state])

  return [state, setState]
}

export default function App() {
  const [view, setView]             = useState('home')
  const [scanResult, setScanResult] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)

  // Persisted across reloads
  const [lang, setLang]           = useLocalState('croply-lang', 'en')
  const [theme, setTheme]         = useLocalState('croply-theme', 'light')
  const [cart, setCart]           = useLocalState('croply-cart', [])
  const [scanHistory, setScanHistory] = useLocalState('croply-history', [])
  const [orders, setOrders]       = useLocalState('croply-orders', [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() { setTheme(t => t === 'light' ? 'dark' : 'light') }
  function navigate(to) { setView(to); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  function handleResult(result, preview) {
    setScanResult(result)
    setImgPreview(preview)
    setScanHistory(prev => [{
      id: result.scan_id,
      date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }),
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
      const ex = prev.find(i => i.id === product.id)
      if (ex) {
        toast.success('Quantity updated')
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      toast.success('Added to cart')
      // Record product in most recent scan
      setScanHistory(h => h.length
        ? h.map((s, i) => i === 0 ? { ...s, products: [...new Set([...s.products, product.name])] } : s)
        : h)
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function handleOrderPlaced(order) {
    setOrders(prev => [order, ...prev])
    setCart([])
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background 0.25s' }}>
      <Navbar
        cartCount={cartCount} onNavigate={navigate} currentView={view}
        lang={lang} setLang={setLang}
        theme={theme} toggleTheme={toggleTheme}
      />
      <main>
        {view === 'home'    && <HomePage onNavigate={navigate} lang={lang} />}
        {view === 'scan'    && <ScanPage onResult={handleResult} lang={lang} />}
        {view === 'results' && scanResult && (
          <ResultsPage
            result={scanResult} imagePreview={imgPreview}
            onAddToCart={addToCart} onNavigate={navigate} lang={lang}
          />
        )}
        {view === 'results' && !scanResult && (
          <div className="container py-20 text-center">
            <p className="font-body text-sm mb-4" style={{ color: 'var(--muted)' }}>Please scan a crop first.</p>
            <button onClick={() => navigate('scan')} className="btn-primary btn-md">Go to Scan</button>
          </div>
        )}
        {view === 'cart' && (
          <CartPage
            cart={cart} onUpdateCart={setCart}
            onNavigate={navigate} lang={lang}
            onOrderPlaced={handleOrderPlaced}
          />
        )}
        {view === 'map'     && <AlertMapPage lang={lang} />}
        {view === 'history' && (
          <HistoryPage
            onNavigate={navigate} lang={lang}
            scanHistory={scanHistory}
            orders={orders}
            onClearHistory={() => { setScanHistory([]); toast.success('History cleared') }}
          />
        )}
      </main>
    </div>
  )
}
