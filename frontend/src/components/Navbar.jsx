import { useState } from "react";
import {
  ShoppingCart,
  Leaf,
  Menu,
  X,
  Sun,
  Moon,
  User,
  ShieldCheck,
  Compass,
  History,
  Map as MapIcon
} from "lucide-react";

export default function Navbar({
  cartCount,
  onNavigate,
  currentView,
  lang,
  setLang,
  theme,
  toggleTheme,
  user,
  onLogout,
}) {
  const [open, setOpen] = useState(false);

  const nav = [
    { id: "home", label: "Home", label_hi: "गृह" },
    { id: "scan", label: "Check Crop", label_hi: "जाँच" },
    { id: "map", label: "Alert Map", label_hi: "अलर्ट" },
    { id: "cart", label: "Marketplace", label_hi: "बाज़ार" },
    { id: "history", label: "My History", label_hi: "इतिहास" },
  ];

  return (
    <nav className="sticky top-4 z-50 w-[96%] md:w-full max-w-5xl mx-auto nav-blur rounded-full px-2 shadow-sm border border-primary/10 transition-all duration-300">
      <div className="container h-[80px] flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white shadow-lg transition-transform group-hover:scale-110">
            <Leaf className="w-6 h-6" strokeWidth={3} />
          </div>
          <div className="text-left hidden sm:block">
            <span className="font-display text-2xl font-bold tracking-tight leading-none block">
              Croply<span className="text-accent">AI</span>
            </span>
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 bg-surface p-1 rounded-full border border-border shadow-sm">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all
                      ${
                         currentView === item.id
                           ? "text-white bg-primary shadow-md"
                           : "text-primary hover:text-white hover:bg-primary-lt"
                       }`}
            >
              {lang === "hi" ? item.label_hi : item.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="hidden md:block text-[11px] font-bold tracking-widest text-primary/60 hover:text-primary px-3 py-2 border border-primary/10 rounded-xl transition-colors"
          >
            {lang === "en" ? "हिंदी" : "English"}
          </button>
          
          <button
            onClick={toggleTheme}
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 text-primary/60 hover:text-primary transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart */}
          <button
            onClick={() => onNavigate("cart")}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all border
                             ${currentView === 'cart' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10' : 'bg-primary/5 border-primary/5 text-primary/40 hover:bg-primary/10 hover:border-primary/20'}`}
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={3} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-accent text-dark text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile */}
          {user ? (
            <button
               onClick={() => onNavigate("profile")}
               className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full transition-all border
                           ${currentView === 'profile' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-border hover:border-primary text-primary'}`}
             >
               <User className="w-4 h-4" />
               <span className="text-xs font-semibold">
                 {user?.fullName?.split(' ')[0] || 'My Profile'}
               </span>
             </button>
          ) : (
             <button onClick={() => onNavigate('auth')} className="btn-primary hidden md:block rounded-full">
                Login
             </button>
           )}

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center text-white/40 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" strokeWidth={3} /> : <Menu className="w-6 h-6" strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="lg:hidden bg-surface border border-border mt-4 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 absolute top-full left-0 w-full">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setOpen(false); }}
                 className={`flex flex-col items-center justify-center p-4 rounded-2xl text-sm font-bold tracking-wide transition-all border
                        ${ currentView === item.id ? "bg-primary border-primary text-white shadow-md" : "bg-bg border-border text-primary hover:bg-primary-lt hover:text-white" }`}
              >
                {lang === "hi" ? item.label_hi : item.label}
              </button>
            ))}
          </div>
          
          <div className="space-y-3 pt-6 border-t-2 border-white/5">
              <button
                onClick={() => { onNavigate("profile"); setOpen(false); }}
                className={`w-full flex items-center justify-center gap-3 p-4 rounded-full font-bold text-sm tracking-wide border transition-all
                           ${currentView === 'profile' ? 'bg-primary text-white border-primary shadow-md' : 'bg-bg text-primary border-border hover:bg-primary/10'}`}
              >
                <User className="w-5 h-5" /> My Profile
              </button>
              <button
                onClick={() => { onNavigate("scan"); setOpen(false); }}
                className="btn-primary w-full p-5 rounded-2xl font-bold text-sm tracking-wide"
              >
                Check Crop Now
              </button>
          </div>
        </div>
      )}
    </nav>
  );
}
