import { useState } from 'react'
import { Leaf, Eye, EyeOff, Loader2, User, Mail, Phone, Lock, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react'
import { authRegister, authLogin, authGuest } from '../services/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// ── Input field ───────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false)
  const inputType = type === 'password' ? (show ? 'text' : 'password') : type
  return (
    <div className="space-y-2 relative z-10">
      <label className="block text-[11px] font-black uppercase tracking-widest text-dark ml-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          <Icon className="w-5 h-5 text-muted/50" />
        </div>
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface border-2 border-border rounded-2xl pl-14 pr-12 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
          style={{ borderColor: error ? '#ef4444' : '' }}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-muted hover:text-dark transition-colors">
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-[10px] font-black uppercase text-red-500 tracking-widest ml-1">{error}</p>}
    </div>
  )
}

// ── Submit button ─────────────────────────────────────────────────────────────
function SubmitBtn({ loading, label, onClick }) {
  return (
    <button onClick={onClick} disabled={loading}
            className="btn-primary w-full py-5 text-lg shadow-xl shadow-primary/20 disabled:opacity-50 mt-4 relative z-10 flex items-center justify-center">
      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <>{label} <ArrowRight className="w-5 h-5 ml-2" strokeWidth={3} /></>}
    </button>
  )
}

function LoginForm({ onAuth, lang }) {
  const hi = lang === 'hi'
  const [email, setEmail]     = useState('')
  const [pass,  setPass]      = useState('')
  const [err,   setErr]       = useState({})
  const [loading, setLoading] = useState(false)

  async function submit() {
    const e = {}
    if (!email.includes('@')) e.email = hi ? 'वैध ईमेल दर्ज करें' : 'Please enter a valid email'
    if (pass.length < 6)      e.pass  = hi ? 'पासवर्ड बहुत छोटा है' : 'Password must be 6+ characters'
    if (Object.keys(e).length) { setErr(e); return }
    setLoading(true); 
    try { 
       onAuth(await authLogin(email, pass));
    } catch (ex) { 
       toast.error(ex.message || (hi ? 'लॉगिन विफल रहा' : 'Failed to sign in. Check your details.'));
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <Field icon={Mail} label={hi ? 'ईमेल' : 'Email Address'} type="email"
             value={email} onChange={setEmail} placeholder="you@farmer.com" error={err.email} />
      <Field icon={Lock} label={hi ? 'पासवर्ड' : 'Password'} type="password"
             value={pass}  onChange={setPass}  placeholder="••••••••"        error={err.pass}  />
      <SubmitBtn loading={loading} label={hi ? 'साइन इन करें' : 'Sign In'} onClick={submit} />
    </div>
  )
}

function SignupForm({ onAuth, lang }) {
  const hi = lang === 'hi'
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pass,  setPass]  = useState('')
  const [err,   setErr]   = useState({})
  const [loading, setLoading] = useState(false)

  async function submit() {
    const e = {}
    if (!name.trim())         e.name  = hi ? 'नाम दर्ज करें' : 'Please enter your name'
    if (!email.includes('@')) e.email = hi ? 'वैध ईमेल' : 'Valid email required'
    if (pass.length < 6)      e.pass  = hi ? 'कम से कम 6 अक्षर' : 'Min 6 characters'
    if (Object.keys(e).length) { setErr(e); return }
    setLoading(true);
    try { 
       onAuth(await authRegister(name, email, phone, pass));
    } catch (ex) { 
       toast.error(ex.message || (hi ? 'विफलता' : 'Failed to create account.'));
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <Field icon={User}  label={hi ? 'पूरा नाम' : 'Full Name'} value={name}  onChange={setName}
             placeholder="Ram Kumar" error={err.name} />
      <Field icon={Mail}  label={hi ? 'ईमेल' : 'Email Address'} type="email" value={email} onChange={setEmail}
             placeholder="you@farmer.com" error={err.email} />
      <Field icon={Phone} label={hi ? 'मोबाइल नंबर' : 'Phone Number'} type="tel"
             value={phone} onChange={setPhone} placeholder="+91 XXXX XXXX" />
      <Field icon={Lock}  label={hi ? 'पासवर्ड' : 'Password'} type="password" value={pass} onChange={setPass}
             placeholder="Min 6 Characters" error={err.pass} />
      <SubmitBtn loading={loading} label={hi ? 'अकाउंट बनाएं' : 'Create Account'} onClick={submit} />
    </div>
  )
}

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
    <div className="space-y-8 py-4 px-2">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left z-10 relative">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-accent/20 border-4 border-white shadow-xl flex-shrink-0">
          <ShieldCheck className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h4 className="text-3xl font-bold text-dark mb-2">
            {hi ? 'अतिथि के रूप में जुड़ें' : 'Try it Out First'}
          </h4>
          <p className="text-muted font-medium text-lg leading-relaxed">
            {hi ? 'आप बिना अकाउंट बनाए भी अपनी फसलों को स्कैन कर सकते हैं। आपका डेटा आपके फ़ोन पर सुरक्षित है।' : 'You can scan your crops without making an account right now. Your data stays on your device.'}
          </p>
        </div>
      </div>
      <SubmitBtn loading={loading} label={hi ? 'आगे बढ़ें' : 'Continue as Guest'} onClick={go} />
    </div>
  )
}

export default function AuthPage({ onAuth, lang }) {
  const hi = lang === 'hi'
  const [tab, setTab] = useState('login')

  return (
    <div className="min-h-screen flex bg-bg">
      {/* ── Left Visual Section ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative p-16 md:p-24 overflow-hidden bg-hero-bg text-white">
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary rounded-full blur-[120px] -mr-[400px] -mt-[400px] opacity-50 pointer-events-none" />
         
         <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center shadow-2xl">
               <Leaf className="w-8 h-8" strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Croply</h1>
         </div>

         <div className="relative z-10">
            <h2 className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8">
               {hi ? 'आपका स्मार्ट खेती साथी।' : 'Your Smart Farming Partner.'}
            </h2>
            <p className="text-xl text-primary-lt font-medium leading-relaxed max-w-md">
               {hi ? 'आसानी से बीमारियों की पहचान करें और अपनी फसल बचाएं।' : 'Identify diseases instantly, get easy treatments, and protect your farm with the help of AI.'}
            </p>
         </div>
      </div>

      {/* ── Right Form Section ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 overflow-y-auto relative">
        <div className="w-full max-w-md relative">
          
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
             <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-xl">
                <Leaf className="w-6 h-6" strokeWidth={3} />
             </div>
             <h1 className="text-3xl font-bold tracking-tight text-dark">Croply</h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card bg-white p-8 md:p-10 shadow-2xl shadow-primary/5 rounded-[40px] border-none relative overflow-hidden">
             
             {/* Decorative blob inside card */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

             {/* Header */}
             <div className="mb-10 text-center relative z-10">
               <h3 className="text-4xl font-bold text-dark tracking-tight mb-3">
                  {tab === 'login' ? (hi ? 'वापसी पर स्वागत है' : 'Welcome Back') : 
                   tab === 'signup' ? (hi ? 'शुरुआत करें' : 'Get Started') : 
                   (hi ? 'गेस्ट मोड' : 'Guest Mode')}
               </h3>
               <p className="text-muted font-medium text-lg">
                  {tab === 'login' ? (hi ? 'अपने फार्म तक पहुंचने के लिए' : 'Sign in to access your farm.') : 
                   tab === 'signup' ? (hi ? 'आसानी से अकाउंट बनाएं' : 'Create an account easily.') : 
                   (hi ? 'बिना लॉगिन किए ऐप आज़माएं' : 'Try out the app without logging in.')}
               </p>
             </div>

             {/* Toggle */}
             <div className="flex bg-surface p-2 rounded-2xl border border-border mb-10 relative z-10">
                <div className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-primary rounded-xl transition-all duration-500 ease-out shadow-sm ${tab === 'signup' ? 'left-[calc(50%+4px)]' : 'left-2'}`} />
                <button onClick={() => setTab('login')} className={`flex-1 py-3 text-sm font-bold tracking-wide relative z-10 transition-colors ${tab === 'login' ? 'text-white' : 'text-muted hover:text-dark'}`}>{hi ? 'लॉगिन' : 'Login'}</button>
                <button onClick={() => setTab('signup')} className={`flex-1 py-3 text-sm font-bold tracking-wide relative z-10 transition-colors ${tab === 'signup' ? 'text-white' : 'text-muted hover:text-dark'}`}>{hi ? 'साइन अप' : 'Sign Up'}</button>
             </div>

             {/* Form */}
             <div className="mb-8 relative z-10">
               <AnimatePresence mode="wait">
                 <motion.div key={tab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                   {tab === 'login'  && <LoginForm  onAuth={onAuth} lang={lang} />}
                   {tab === 'signup' && <SignupForm onAuth={onAuth} lang={lang} />}
                   {tab === 'guest'  && <GuestPanel onAuth={onAuth} lang={lang} />}
                 </motion.div>
               </AnimatePresence>
             </div>

             {/* Footer Actions */}
             <div className="relative z-10 pt-6 border-t border-border">
               {tab !== 'guest' ? (
                 <button onClick={() => setTab('guest')} className="w-full py-4 font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 rounded-2xl">
                    <UserCheck className="w-5 h-5" /> {hi ? 'अतिथि के रूप में जारी रखें' : 'Continue as Guest Instead'}
                 </button>
               ) : (
                 <button onClick={() => setTab('login')} className="w-full py-4 font-bold text-muted hover:text-dark transition-colors flex justify-center">
                    ← {hi ? 'लॉगिन पर वापस जाएं' : 'Return to Login'}
                 </button>
               )}
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}