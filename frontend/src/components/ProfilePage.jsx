import { User, MapPin, Sprout, ShoppingBag, LogOut, Save, ShieldCheck, Leaf } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion"

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const staggerContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }

export default function ProfilePage({ profileData, setProfileData, lang, onLogout }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast.success(lang === "hi" ? "प्रोफ़ाइल अपडेट हो गई" : "Profile Updated Successfully");
  };

  const t = {
    title: lang === "hi" ? "मेरा प्रोफ़ाइल" : "My Profile",
    subtitle: lang === "hi" ? "अपनी कृषि जानकारी प्रबंधित करें" : "Your Farm Information",
    personal: lang === "hi" ? "व्यक्तिगत विवरण" : "Personal Information",
    agri: lang === "hi" ? "कृषि विवरण" : "Farm Details",
    fullName: lang === "hi" ? "पूरा नाम" : "Full Name",
    email: lang === "hi" ? "ईमेल" : "Email",
    phone: lang === "hi" ? "फ़ोन नंबर" : "Phone Number",
    address: lang === "hi" ? "फार्म का पता" : "Farm Address",
    crops: lang === "hi" ? "प्राथमिक फसलें" : "Primary Crops",
    farmSize: lang === "hi" ? "फार्म का आकार (एकड़)" : "Farm Size (Acres)",
    save: lang === "hi" ? "परिवर्तन सहेजें" : "Save Profile",
    logout: lang === "hi" ? "लॉग आउट" : "Logout"
  };

  return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)]">
      <div className="container max-w-5xl pt-6">
        <motion.header initial="hidden" animate="show" variants={fadeUp} className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-white shadow-sm mb-6">
               <ShieldCheck className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Secure Account</span>
            </div>
            <h1 className="text-5xl md:text-6xl mb-3 font-bold text-dark tracking-tight">{t.title}</h1>
            <p className="text-muted font-medium text-lg tracking-wide">{t.subtitle}</p>
          </div>
          <button onClick={onLogout} className="btn text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-200 rounded-full px-6 py-3 transition-all shadow-sm">
            <LogOut className="w-5 h-5 mr-3" />
            {t.logout}
          </button>
        </motion.header>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-10 xl:gap-14 items-start pb-20">
          
          {/* Personal Details */}
          <motion.section variants={fadeUp} className="card p-8 md:p-10 shadow-xl shadow-primary/5 border-none rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-10 border-b border-border pb-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold text-dark">{t.personal}</h3>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-dark ml-1">{t.fullName}</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-dark ml-1">{t.email}</label>
                <input 
                  type="email" 
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-dark ml-1">{t.phone}</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  placeholder="+91 XXXX XXXX"
                />
              </div>
            </div>
          </motion.section>

          {/* Agricultural Context */}
          <motion.section variants={fadeUp} className="card p-8 md:p-10 shadow-xl shadow-primary/5 border-none rounded-[40px] relative overflow-hidden">
            <Leaf className="absolute -bottom-10 -right-10 w-64 h-64 text-accent/5 -rotate-12 pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-10 border-b border-border pb-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 text-accent flex items-center justify-center shadow-sm">
                <Sprout className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold text-dark">{t.agri}</h3>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-dark ml-1">{t.address}</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/50" />
                  <input 
                    type="text" 
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border rounded-2xl pl-14 pr-6 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                    placeholder="Enter farm address"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-dark ml-1">{t.crops}</label>
                <input 
                  type="text" 
                  name="primaryCrops"
                  value={profileData.primaryCrops}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  placeholder="Wheat, Tomato, Rice..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-dark ml-1">{t.farmSize}</label>
                <input 
                  type="number" 
                  name="farmSize"
                  value={profileData.farmSize}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  placeholder="Enter acres"
                />
              </div>
            </div>
          </motion.section>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-8 flex justify-center pb-20">
          <button onClick={handleSave} className="btn-primary px-16 py-5 text-xl shadow-xl shadow-primary/20">
            <Save className="w-6 h-6 mr-3" />
            {t.save}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
