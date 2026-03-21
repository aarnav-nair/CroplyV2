import { useState, useEffect, useRef } from 'react'
import { Leaf, Eye, EyeOff, Loader2, User, Mail, Phone, Lock, ArrowRight, UserCheck } from 'lucide-react'
import { authRegister, authLogin, authGuest } from '../services/api.js'



// ── Input field ───────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false)
  const inputType = type === 'password' ? (show ? 'text' : 'password') : type
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold tracking-wide"
             style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium outline-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: error ? '1.5px solid #f87171' : '1.5px solid rgba(255,255,255,0.1)',
            color: '#fff',
            caretColor: '#52B788',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = '#52B788' }}
          onBlur={e  => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// ── Submit button ─────────────────────────────────────────────────────────────
function SubmitBtn({ loading, label, onClick }) {
  return (
    <button onClick={onClick} disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #52B788, #2D6A4F)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(82,183,136,0.3)',
              transition: 'transform 0.15s, opacity 0.15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e   => e.currentTarget.style.transform = 'scale(1)'}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{label} <ArrowRight className="w-4 h-4" /></>}
    </button>
  )
}

// ── Sign In form ──────────────────────────────────────────────────────────────
function LoginForm({ onAuth, lang }) {
  const hi = lang === 'hi'
  const [email, setEmail]     = useState('')
  const [pass,  setPass]      = useState('')
  const [err,   setErr]       = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')

  async function submit() {
    const e = {}
    if (!email.includes('@')) e.email = hi ? 'वैध ईमेल दर्ज करें' : 'Enter a valid email'
    if (pass.length < 6)      e.pass  = hi ? 'पासवर्ड कम से कम 6 अक्षर' : 'Min 6 characters'
    if (Object.keys(e).length) { setErr(e); return }
    setLoading(true); setServerErr('')
    try { onAuth(await authLogin(email, pass)) }
    catch (ex) { setServerErr(ex.message || (hi ? 'गलत ईमेल या पासवर्ड' : 'Incorrect email or password')) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Field icon={Mail} label={hi ? 'ईमेल' : 'Email'} type="email"
             value={email} onChange={setEmail} placeholder="you@example.com" error={err.email} />
      <Field icon={Lock} label={hi ? 'पासवर्ड' : 'Password'} type="password"
             value={pass}  onChange={setPass}  placeholder="••••••••"        error={err.pass}  />
      {serverErr && <p className="text-sm text-red-400 text-center">{serverErr}</p>}
      <SubmitBtn loading={loading} label={hi ? 'साइन इन करें' : 'Sign In'} onClick={submit} />
    </div>
  )
}

// ── Sign Up form ──────────────────────────────────────────────────────────────
function SignupForm({ onAuth, lang }) {
  const hi = lang === 'hi'
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')

  async function submit() {
    const e = {}
    if (!name.trim())         e.name  = hi ? 'नाम दर्ज करें' : 'Enter your name'
    if (!email.includes('@')) e.email = hi ? 'वैध ईमेल' : 'Valid email required'
    if (pass.length < 6)      e.pass  = hi ? 'कम से कम 6 अक्षर' : 'Min 6 characters'
    if (Object.keys(e).length) { setErr(e); return }
    setLoading(true); setServerErr('')
    try { onAuth(await authRegister(name, email, phone, pass)) }
    catch (ex) { setServerErr(ex.message || (hi ? 'पंजीकरण विफल' : 'Registration failed')) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Field icon={User}  label={hi ? 'पूरा नाम' : 'Full Name'} value={name}  onChange={setName}
             placeholder={hi ? 'जैसे: राम कुमार' : 'e.g. Ram Kumar'} error={err.name} />
      <Field icon={Mail}  label={hi ? 'ईमेल' : 'Email'} type="email" value={email} onChange={setEmail}
             placeholder="you@example.com" error={err.email} />
      <Field icon={Phone} label={hi ? 'मोबाइल (वैकल्पिक)' : 'Mobile (optional)'} type="tel"
             value={phone} onChange={setPhone} placeholder="10-digit number" />
      <Field icon={Lock}  label={hi ? 'पासवर्ड' : 'Password'} type="password" value={pass} onChange={setPass}
             placeholder="Min 6 characters" error={err.pass} />
      {serverErr && <p className="text-sm text-red-400 text-center">{serverErr}</p>}
      <SubmitBtn loading={loading} label={hi ? 'अकाउंट बनाएं' : 'Create Account'} onClick={submit} />
    </div>
  )
}

// ── Guest panel ───────────────────────────────────────────────────────────────
function GuestPanel({ onAuth, lang }) {
  const hi = lang === 'hi'
  const [loading, setLoading] = useState(false)

  async function go() {
    setLoading(true)
    try { onAuth(await authGuest()) }
    catch { onAuth({ token: 'guest', user: { id: 'guest', name: 'Guest', is_guest: true } }) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'rgba(82,183,136,0.12)', border: '1.5px solid rgba(82,183,136,0.25)' }}>
          <UserCheck className="w-7 h-7" style={{ color: '#52B788' }} />
        </div>
        <div>
          <p className="font-semibold text-white text-base">
            {hi ? 'बिना अकाउंट के' : 'No account needed'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {hi ? 'डेटा इस डिवाइस पर सेव होगा' : 'Data stays on this device only'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { ok: true,  en: 'AI crop scanning',       hi: 'AI फसल स्कैन' },
          { ok: true,  en: 'Disease detection',      hi: 'रोग पहचान' },
          { ok: false, en: 'Cross-device sync',      hi: 'डिवाइस सिंक' },
          { ok: false, en: 'Saved scan history',     hi: 'इतिहास सेव' },
        ].map(item => (
          <div key={item.en} className="flex items-center gap-2 px-3 py-2 rounded-xl"
               style={{ background: item.ok ? 'rgba(82,183,136,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${item.ok ? 'rgba(82,183,136,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
            <span style={{ color: item.ok ? '#52B788' : 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
              {item.ok ? '✓' : '✗'}
            </span>
            <span className="text-xs" style={{ color: item.ok ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)' }}>
              {lang === 'hi' ? item.hi : item.en}
            </span>
          </div>
        ))}
      </div>
      <SubmitBtn loading={loading} label={hi ? 'Guest के रूप में जारी रखें' : 'Continue as Guest'} onClick={go} />
    </div>
  )
}

// ── Main AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage({ onAuth, lang }) {
  const hi = lang === 'hi'
  const [tab, setTab] = useState('login')

  // Heading changes smoothly with the form
  const headings = {
    login:  { title: hi ? 'वापस स्वागत है!' : 'Welcome back!',         sub: hi ? 'अपने खाते में लॉगिन करें' : 'Sign in to your Croply account' },
    signup: { title: hi ? 'अकाउंट बनाएं'   : 'Create your account',   sub: hi ? 'मुफ़्त में शुरू करें'       : 'Start protecting your crops for free' },
    guest:  { title: hi ? 'बिना साइन अप के' : 'Skip the signup',       sub: hi ? 'डेटा इस डिवाइस पर रहेगा'  : 'Jump straight in, no account required' },
  }
  const h = headings[tab]

  return (
    <div className="fixed inset-0 flex" style={{ background: '#0A0F0A', zIndex: 100 }}>

      {/* ── Left panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
           style={{ background: 'linear-gradient(160deg, #0F1F13 0%, #1A3526 60%, #0D1A10 100%)' }}>



        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg,#52B788,#2D6A4F)' }}>
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display text-xl font-bold text-white block leading-none">Croply</span>
            <span className="text-[11px] block mt-0.5" style={{ color: 'rgba(82,183,136,0.7)' }}>Click. Detect. Act.</span>
          </div>
        </div>

        {/* Copy + stats */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display text-4xl font-extrabold text-white leading-tight mb-4"
                style={{ whiteSpace: 'pre-line' }}>
              {hi ? 'स्मार्ट किसान,\nस्वस्थ फसल' : 'Smart farming\nstarts here.'}
            </h1>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {hi
                ? 'AI से 3 सेकंड में पत्ती की बीमारी पहचानें और सही इलाज पाएं।'
                : 'AI-powered crop disease detection in under 3 seconds. Protect your harvest.'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: '38+', label: hi ? 'रोग पहचान' : 'Diseases' },
              { n: '93%', label: hi ? 'सटीकता'    : 'Accuracy' },
              { n: '3s',  label: hi ? 'में परिणाम': 'Results'  },
            ].map(s => (
              <div key={s.n} className="p-4 rounded-2xl text-center"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-display text-2xl font-extrabold" style={{ color: '#52B788' }}>{s.n}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 p-4 rounded-2xl"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {hi
              ? '"सही समय पर सही इलाज — यही स्मार्ट खेती है।"'
              : '"The right treatment at the right time — that\'s smart farming."'}
          </p>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">

        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#52B788,#2D6A4F)' }}>
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold text-white">Croply</span>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading — slides with the form */}
          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-white mb-1">{h.title}</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{h.sub}</p>
          </div>

          {/* Tab switcher pill */}
          <div className="relative flex rounded-xl p-1 mb-6"
               style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Sliding indicator */}
            <div className="absolute top-1 bottom-1 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                 style={{
                   background: '#52B788',
                   left:  tab === 'signup' ? 'calc(50% + 2px)' : '4px',
                   width: 'calc(50% - 6px)',
                 }} />
            {[
              { id: 'login',  label: hi ? 'साइन इन' : 'Sign In'  },
              { id: 'signup', label: hi ? 'साइन अप' : 'Sign Up' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold relative z-10 transition-colors duration-300"
                      style={{ color: tab === t.id ? '#0A0F0A' : 'rgba(255,255,255,0.45)' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Animated form area ── */}
          {/* ── Form area ── */}
          <div className="mb-5">
            {tab === 'login'  && <LoginForm  onAuth={onAuth} lang={lang} />}
            {tab === 'signup' && <SignupForm onAuth={onAuth} lang={lang} />}
            {tab === 'guest'  && <GuestPanel onAuth={onAuth} lang={lang} />}
          </div>

          {/* Divider + guest button (only when not already on guest) */}
          {tab !== 'guest' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{hi ? 'या' : 'or'}</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <button onClick={() => setTab('guest')}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)',
                        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(82,183,136,0.08)'; e.currentTarget.style.borderColor='rgba(82,183,136,0.3)'; e.currentTarget.style.color='#52B788' }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.5)' }}>
                <UserCheck className="w-4 h-4" />
                {hi ? 'Guest के रूप में जारी रखें' : 'Continue as Guest'}
              </button>
            </>
          )}

          {tab === 'guest' && (
            <button onClick={() => setTab('login')}
                    className="w-full py-2 text-xs font-semibold text-center mt-2"
                    style={{ color: 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color='rgba(82,183,136,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}>
              ← {hi ? 'साइन इन पर वापस जाएं' : 'Back to Sign In'}
            </button>
          )}

          {/* Footer */}
          <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.18)' }}>
            {hi ? 'जारी रखने पर आप हमारी ' : 'By continuing you agree to our '}
            <span style={{ color: 'rgba(82,183,136,0.5)' }}>{hi ? 'गोपनीयता नीति' : 'Privacy Policy'}</span>
            {hi ? ' से सहमत हैं।' : '.'}
          </p>
        </div>
      </div>
    </div>
  )
}