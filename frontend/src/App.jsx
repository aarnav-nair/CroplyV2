import { useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./components/HomePage.jsx";
import ScanPage from "./components/ScanPage.jsx";
import ResultsPage from "./components/ResultsPage.jsx";
import CartPage from "./components/CartPage.jsx";
import AlertMapPage from "./components/AlertMapPage.jsx";
import HistoryPage from "./components/HistoryPage.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import LandingPage from "./components/LandingPage.jsx";
import AuthPage from "./components/AuthPage.jsx";
import NavBot from "./components/NavBot.jsx";
import WeatherBar from "./components/WeatherBar.jsx";
import { loadToken, loadUser, authLogout } from "./services/api.js";
import toast from "react-hot-toast";

function useLocalState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

export default function App() {
  const [view, setView] = useState("home");
  const [scanResult, setScanResult] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  // Auth state — initialise from localStorage so returning users skip login
  const [user, setUser] = useState(() => {
    const token = loadToken();
    const u = loadUser();
    return token && u ? u : null;
  });

  const [lang, setLang] = useLocalState("croply-lang", "en");
  const [theme, setTheme] = useLocalState("croply-theme", "light");
  const [cart, setCart] = useLocalState("croply-cart", []);
  const [scanHistory, setScanHistory] = useLocalState("croply-history", []);
  const [orders, setOrders] = useLocalState("croply-orders", []);
  const [profileData, setProfileData] = useLocalState("croply-profile", {
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    primaryCrops: "",
    farmSize: ""
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }
  function navigate(to) {
    setView(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleAuth({ token, user: u }) {
    setUser(u);
  }

  function handleLogout() {
    authLogout();
    setUser(null);
    setCart([]);
    setScanHistory([]);
    toast.success("Signed out");
  }

  function handleResult(result, preview) {
    setScanResult(result);
    setImgPreview(preview);
    setScanHistory((prev) => [
      {
        id: result.scan_id,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        crop: result.crop,
        crop_hi: result.crop_hi,
        disease: result.disease_name,
        disease_hi: result.disease_name_hi,
        severity: result.severity,
        confidence: result.confidence,
        resolved: false,
        products: [],
      },
      ...prev,
    ]);
    navigate("results");
  }

  function addToCart(product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) {
        toast.success("Quantity updated");
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      toast.success("Added to cart");
      setScanHistory((h) =>
        h.length
          ? h.map((s, i) =>
              i === 0
                ? {
                    ...s,
                    products: [...new Set([...s.products, product.name])],
                  }
                : s,
            )
          : h,
      );
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function handleOrderPlaced(order) {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // 1. Landing animation
  if (showLanding) {
    return <LandingPage onComplete={() => setShowLanding(false)} />;
  }

  // 2. Auth gate — show AuthPage if not signed in
  if (!user) {
    return <AuthPage onAuth={handleAuth} lang={lang} />;
  }

  // 3. Main app
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        transition: "background 0.25s",
      }}
    >
      <Navbar
        cartCount={cartCount}
        onNavigate={navigate}
        currentView={view}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
      />
      <WeatherBar lang={lang} />
      <main>
        {view === "home" && <HomePage onNavigate={navigate} lang={lang} />}
        {view === "scan" && <ScanPage onResult={handleResult} lang={lang} />}
        {view === "results" && scanResult && (
          <ResultsPage
            result={scanResult}
            imagePreview={imgPreview}
            onAddToCart={addToCart}
            onNavigate={navigate}
            lang={lang}
          />
        )}
        {view === "results" && !scanResult && (
          <div className="container py-20 text-center">
            <p
              className="font-body text-sm mb-4"
              style={{ color: "var(--muted)" }}
            >
              Please scan a crop first.
            </p>
            <button
              onClick={() => navigate("scan")}
              className="btn-primary btn-md"
            >
              Go to Scan
            </button>
          </div>
        )}
        {view === "cart" && (
          <CartPage
            cart={cart}
            onUpdateCart={setCart}
            onNavigate={navigate}
            lang={lang}
            onOrderPlaced={handleOrderPlaced}
            profileData={profileData}
          />
        )}
        {view === "map" && <AlertMapPage lang={lang} />}
        {view === "history" && (
          <HistoryPage
            onNavigate={navigate}
            lang={lang}
            scanHistory={scanHistory}
            orders={orders}
            onClearHistory={() => {
              setScanHistory([]);
              toast.success("History cleared");
            }}
          />
        )}
        {view === "profile" && (
          <ProfilePage
            profileData={profileData}
            setProfileData={setProfileData}
            lang={lang}
            onLogout={handleLogout}
          />
        )}
      </main>
      <NavBot onNavigate={navigate} lang={lang} />
    </div>
  );
}
