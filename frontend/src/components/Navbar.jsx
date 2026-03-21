import { useState } from "react";
import {
  ShoppingCart,
  Leaf,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
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
    { id: "home", label: "Home", label_hi: "होम" },
    { id: "scan", label: "Scan Crop", label_hi: "स्कैन करें" },
    { id: "map", label: "Alert Map", label_hi: "अलर्ट मैप" },
    { id: "history", label: "My History", label_hi: "इतिहास" },
  ];

  return (
    <nav
      style={{
        background: "rgba(20,26,16,0.97)",
        backdropFilter: "blur(12px)",
      }}
      className="sticky top-0 z-50 border-b border-white/10"
    >
      <div className="container h-[62px] flex items-center justify-between gap-6">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 group flex-shrink-0"
        >
          <div
            style={{ background: "linear-gradient(135deg,#52B788,#2D6A4F)" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
          >
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display text-[17px] font-bold text-white tracking-tight leading-none block">
              Croply
            </span>
            <span
              className="text-[10px] font-body leading-none block mt-0.5"
              style={{ color: "rgba(82,183,136,0.6)" }}
            >
              Click. Detect. Act.
            </span>
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-body font-medium transition-all
                      ${
                        currentView === item.id
                          ? "text-white bg-white/12"
                          : "text-white/50 hover:text-white/80 hover:bg-white/6"
                      }`}
            >
              {lang === "hi" ? item.label_hi : item.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center
                             bg-white/8 border border-white/10 text-white/70
                             hover:bg-white/14 hover:text-white transition-all"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="btn-ghost btn-sm text-xs tracking-wide"
          >
            {lang === "en" ? "अ हिंदी" : "A English"}
          </button>

          {/* Cart */}
          <button
            onClick={() => onNavigate("cart")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center
                             bg-white/8 border border-white/10 text-white/70
                             hover:bg-white/14 hover:text-white transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span
                style={{ background: "var(--gold)" }}
                className="absolute -top-1 -right-1 min-w-[18px] min-h-[18px]
                               text-[10px] font-bold rounded-full flex items-center justify-center
                               text-zinc-900 px-1 leading-none"
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* User avatar + logout */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: user.is_guest
                      ? "rgba(255,255,255,0.15)"
                      : "var(--green)",
                  }}
                >
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-white/70 max-w-[80px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all
                                 bg-white/6 border border-white/8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => onNavigate("scan")}
            style={{ background: "var(--gold)", color: "var(--dark)" }}
            className="hidden md:flex btn-md font-bold text-sm"
          >
            {lang === "hi" ? "स्कैन करें →" : "Scan Now →"}
          </button>

          {/* Mobile menu */}
          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{ background: "rgba(14,20,12,0.98)" }}
          className="md:hidden border-t border-white/8 px-4 py-3 space-y-1"
        >
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all
                      ${
                        currentView === item.id
                          ? "text-white bg-white/12"
                          : "text-white/50 hover:text-white/70 hover:bg-white/6"
                      }`}
            >
              {lang === "hi" ? item.label_hi : item.label}
            </button>
          ))}
          <button
            onClick={() => {
              onNavigate("scan");
              setOpen(false);
            }}
            style={{ background: "var(--gold)", color: "var(--dark)" }}
            className="btn-md w-full mt-2 font-bold"
          >
            {lang === "hi" ? "स्कैन करें" : "Scan Now →"}
          </button>
        </div>
      )}
    </nav>
  );
}
