import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Mic, MicOff, Send, Bot, Loader2, Sparkles, ShieldCheck, CloudRain, AlertTriangle, Zap, CheckCircle } from "lucide-react";
import { askNavBot } from "../services/api.js";
import { motion, AnimatePresence } from "framer-motion";

const INTENTS = [
  { keys: ["scan", "स्कैन", "photo", "disease", "leaf", "detect"], view: "scan", reply: "Checking your crop now...", reply_hi: "फसल जाँच शुरू..." },
  { keys: ["map", "मैप", "alert", "outbreak", "district", "state"], view: "map", reply: "Opening the alert map...", reply_hi: "अलर्ट मैप खोल रहा हूं..." },
  { keys: ["history", "इतिहास", "past", "order", "scan history"], view: "history", reply: "Opening your history...", reply_hi: "आपका इतिहास खोल रहा हूं..." },
  { keys: ["cart", "कार्ट", "buy", "purchase", "basket", "checkout"], view: "cart", reply: "Opening your cart...", reply_hi: "आपका कार्ट खोल रहा हूं..." },
  { keys: ["home", "होम", "start", "main", "back"], view: "home", reply: "Going back home...", reply_hi: "होम पेज पर जा रहा हूं..." },
];

const GREETINGS = ["hello", "hi", "hey", "नमस्ते", "हेलो", "हाय", "namaste"];
const HELP_KEYS = ["help", "मदद", "what can you do", "options"];

async function fetchDistrict(lat, lon) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { 'Accept-Language': 'en' } })
  const addr = (await res.json()).address || {}
  return addr.county || addr.state_district || addr.city || addr.town || addr.village || 'Your Farm'
}

function detectIntent(text) {
  const lower = text.toLowerCase();
  for (const intent of INTENTS) { if (intent.keys.some((k) => lower.includes(k))) return intent; }
  return null;
}
function isGreeting(text) { return GREETINGS.some((g) => text.toLowerCase().includes(g)); }
function isHelp(text) { return HELP_KEYS.some((h) => text.toLowerCase().includes(h)); }

const QUICK_ACTIONS = [
  { label: "Check Crop", label_hi: "फसल चेक करें", view: "scan", icon: Sparkles },
  { label: "Alert Map", label_hi: "अलर्ट मैप", view: "map", icon: ShieldCheck },
];

function isRaining(code) { return code >= 200 && code < 700 && code !== 600 && code !== 601 && code !== 602; }

function getWeatherAdvice(weather, hi = false) {
  if (!weather) return null;
  const { code, wind, humidity: hum, rain } = weather;

  if (isRaining(code) || rain > 0.3) {
    return { level: 'danger', color: '#ef4444', icon: CloudRain, text: hi ? `बारिश हो रही है — अभी छिड़काव न करें।` : `It's raining — don't spray now.` }
  }
  if (hum >= 82 || (hum >= 75 && wind < 8)) {
    return { level: 'warning', color: '#fbbf24', icon: AlertTriangle, text: hi ? `उच्च आर्द्रता (${hum}%) — बीमारी का खतरा।` : `High humidity (${hum}%) — watch for diseases.` }
  }
  if (wind >= 20) {
    return { level: 'warning', color: '#fbbf24', icon: Zap, text: hi ? `तेज़ हवा (${wind} km/h) — छिड़काव प्रवहण।` : `Strong wind (${wind} km/h) — spraying may drift.` }
  }
  return { level: 'good', color: '#16a34a', icon: CheckCircle, text: hi ? `अच्छा मौसम — छिड़काव के लिए सुरक्षित।` : `Good weather — safe to work / spray.` }
}

export default function NavBot({ onNavigate, lang, weather }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true);
      setMsgs([{ role: "bot", text: lang === "hi" ? "नमस्ते! मैं आपका एआई असिस्टेंट हूं। मैं आपकी क्या मदद कर सकता हूं?" : "Hello! I am your Croply assistant. How can I help you today?" }]);
    }
  }, [open, lang]);

  async function handleSend(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput(""); setMsgs(p => [...p, { role: "user", text: msg }]);

    if (isGreeting(msg)) { setTimeout(() => setMsgs(p => [...p, { role: "bot", text: lang === "hi" ? "नमस्ते! आप क्या जानना चाहते हैं?" : "Hello! What would you like to know about your crops?" }]), 400); return; }
    
    const intent = detectIntent(msg);
    if (intent) {
      setMsgs(p => [...p, { role: "bot", text: lang === "hi" ? intent.reply_hi : intent.reply }]);
      setTimeout(() => { onNavigate(intent.view); setOpen(false); }, 800);
      return;
    }

    setLoading(true);
    try {
      const reply = await askNavBot(msg, lang);
      setMsgs(p => [...p, { role: "bot", text: reply }]);
    } catch (e) {
      setMsgs(p => [...p, { role: "bot", text: "⚠️ Sorry, I could not connect. Please check your internet." }]);
    } finally { setLoading(false); }
  }

  function toggleVoice() {
    if (!("webkitSpeechRecognition" in window)) { alert("Voice only supported on Chrome."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new window.webkitSpeechRecognition();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setInput(t); handleSend(t); };
    recognitionRef.current = rec; rec.start();
  }

  const adv = getWeatherAdvice(weather, lang === 'hi');

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-6 z-50 flex flex-col rounded-[32px] overflow-hidden border-none shadow-2xl shadow-primary/10 bg-white w-[360px] h-[540px]"
          >
            <header className="bg-primary text-white p-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-lg backdrop-blur-md">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/90">Assistant</p>
                  {adv && (
                    <div className="flex items-center gap-2 mt-1">
                      <adv.icon className="w-3.5 h-3.5" style={{ color: adv.color }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">{adv.text}</span>
                    </div>
                  )}
                  {!adv && <p className="text-[10px] font-bold uppercase text-white/60 tracking-wider mt-0.5">Always here to help</p>}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all text-white relative z-10">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-bg custom-scrollbar relative">
              <div className="absolute inset-0 bg-primary/5 border border-primary/10 border-dashed rounded-b-[32px] pointer-events-none opacity-50" />
              
              {msgs.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} relative z-10`}
                >
                  <div className={`max-w-[85%] p-4 text-sm font-medium leading-relaxed shadow-sm ${
                    m.role === "user" 
                      ? "bg-primary text-white rounded-[24px] rounded-br-sm" 
                      : "bg-white text-dark border border-border rounded-[24px] rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-10">
                  <div className="bg-white px-5 py-4 border border-border shadow-sm rounded-[24px] rounded-bl-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} className="h-2" />
            </div>

            <div className="p-4 border-t border-border bg-white space-y-4 relative z-10 rounded-b-[32px]">
              <div className="flex gap-2">
                <button 
                  onClick={toggleVoice} 
                  className={`w-12 h-12 rounded-[16px] flex flex-shrink-0 items-center justify-center border transition-all ${listening ? 'bg-red-50 border-red-200 text-red-500 scale-105 shadow-md shadow-red-500/10' : 'bg-surface border-border text-muted hover:text-primary hover:border-primary/20'}`}
                >
                  {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input 
                  value={input} onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={lang === 'hi' ? "संदेश टाइप करें..." : "Ask your farm assistant..."}
                  className="flex-1 bg-surface border border-border rounded-[16px] px-4 py-3 text-sm font-medium text-dark focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted"
                />
                <button 
                  onClick={() => handleSend()} 
                  className="w-12 h-12 rounded-[16px] bg-primary text-white flex flex-shrink-0 items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                  disabled={!input.trim() && !listening}
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </div>
              <div className="flex gap-2">
                {QUICK_ACTIONS.map(a => (
                  <button key={a.view} onClick={() => { onNavigate(a.view); setOpen(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface border border-border rounded-[12px] text-[10px] font-black uppercase tracking-widest text-muted hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all">
                    <a.icon className="w-3.5 h-3.5" /> {lang === 'hi' ? a.label_hi : a.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-[24px] bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 hover:-translate-y-2 active:translate-y-0 transition-all duration-300 group"
      >
        {open ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />}
        {!open && (
           <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  );
}