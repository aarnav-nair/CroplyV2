import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, CheckCircle2, Package, ArrowLeft, Truck, Lock, MapPin, CreditCard } from 'lucide-react'
import { placeOrder } from '../services/api.js'
import toast from 'react-hot-toast'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

function OrderConfirmation({ order, lang, onNavigate }) {
  return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)] flex items-center justify-center">
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="container max-w-2xl text-center py-10">
        
        <div className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center bg-green-50 border-4 border-white shadow-xl relative">
          <div className="absolute inset-0 rounded-full border border-green-200 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <CheckCircle2 className="w-12 h-12 text-primary relative z-10"/>
        </div>
        
        <h1 className="text-5xl md:text-6xl mb-4 font-bold text-dark tracking-tight">
          {lang==='hi'?'ऑर्डर सफल!':'Order Placed!'}
        </h1>
        <p className="text-primary font-bold uppercase tracking-widest text-[11px] mb-12 bg-primary/10 inline-block px-4 py-1.5 rounded-full">
          Order Number: #{order.order_id}
        </p>

        <div className="card p-8 md:p-10 text-left mb-10 bg-surface shadow-2xl shadow-primary/5 border-none rounded-[40px]">
          <h3 className="text-2xl mb-8 font-bold flex items-center gap-3 text-dark">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            Order Summary
          </h3>
          
          <div className="space-y-6 mb-8">
            {order.items?.map((item,i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-border last:border-0 last:pb-0">
                <div>
                   <span className="font-bold text-lg text-dark block mb-1">{item.name}</span>
                   <span className="text-[10px] text-muted font-bold uppercase tracking-widest bg-surface px-2 py-0.5 rounded-md">Qty: {item.quantity}</span>
                </div>
                <span className="text-2xl font-bold text-primary">₹{item.item_total||item.price*item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-end pt-6 border-t border-border">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Amount Paid</span>
            <span className="text-5xl font-black text-primary tracking-tight">₹{order.total_amount}</span>
          </div>
        </div>

        <div className="card border border-primary/20 bg-primary/5 flex items-center gap-6 p-6 md:p-8 mb-12 shadow-sm rounded-[32px]">
          <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center shadow-sm flex-shrink-0">
             <Truck className="w-6 h-6 text-primary"/>
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">In Transit</p>
            <p className="text-2xl font-bold text-dark">Arrives in {order.estimated_delivery}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
           <button onClick={() => onNavigate('scan')} className="btn-primary flex-1 max-w-xs shadow-xl shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              {lang==='hi'?'नया स्कैन':'Scan Another Crop'}
           </button>
           <button onClick={() => onNavigate('history')} className="btn-outline flex-1 max-w-xs bg-surface">
              {lang==='hi'?'ऑर्डर इतिहास':'View My History'}
           </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function CartPage({ cart, onUpdateCart, onNavigate, lang, onOrderPlaced, profileData }) {
  const [step, setStep]       = useState('cart')
  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ 
    name: profileData?.fullName || '', 
    phone: profileData?.phone || '', 
    address: profileData?.address || '', 
    pincode: '' 
  })

  const total = cart.reduce((s,i) => s + i.price_per_unit*i.quantity, 0)

  function updateQty(id, delta) {
    onUpdateCart(cart.map(i => i.id===id ? {...i, quantity:Math.max(0,i.quantity+delta)} : i).filter(i => i.quantity>0))
  }

  function remove(id) {
    onUpdateCart(cart.filter(i => i.id!==id))
    toast.success('Removed from cart')
  }

  async function placeIt() {
    if (!form.name||!form.phone||!form.address||!form.pincode) {
      toast.error('All logistics data required'); return
    }
    setLoading(true)
    try {
      const items = cart.map(i => ({product_id:i.id,name:i.name,quantity:i.quantity,price:i.price_per_unit,item_total:i.price_per_unit*i.quantity}))
      const res = await placeOrder({items,farmer_name:form.name,phone:form.phone,address:form.address,pincode:form.pincode,total_amount:total})
      const finalOrder = {...res,items,total_amount:total}
      setOrder(finalOrder)
      setStep('confirmed')
      if (onOrderPlaced) onOrderPlaced(finalOrder)
    } catch { toast.error('Check your internet connection') }
    finally { setLoading(false) }
  }

  if (step==='confirmed' && order) return <OrderConfirmation order={order} lang={lang} onNavigate={onNavigate}/>

  if (cart.length===0) return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="container max-w-2xl text-center py-20">
        <div className="w-32 h-32 rounded-full mx-auto mb-10 bg-surface border border-border shadow-sm flex items-center justify-center relative">
           <ShoppingCart className="w-12 h-12 text-primary/40" />
           <div className="absolute -top-4 -right-4 w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-inner">
             <span className="text-xl">🌿</span>
           </div>
        </div>
        <h2 className="text-4xl md:text-5xl mb-6 font-bold text-dark tracking-tight">
          {lang==='hi'?'कार्ट खाली है':'Your Helper Cart is Empty'}
        </h2>
        <p className="text-muted font-medium mb-12 max-w-sm mx-auto text-lg leading-relaxed">
          {lang==='hi'?'पहले फसल स्कैन करें':'You haven\'t added any solutions yet. Scan your crop to get recommendations.'}
        </p>
        <button onClick={() => onNavigate('scan')} className="btn-primary px-12 py-5 text-lg shadow-xl shadow-primary/20">
          {lang==='hi'?'फसल स्कैन करें':'Scan Crop Now'}
          <ArrowRight className="w-6 h-6 ml-3"/>
        </button>
      </motion.div>
    </div>
  )

  return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)]">
      <div className="container max-w-6xl pt-6">
        <motion.header initial="hidden" animate="show" variants={fadeUp} className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div>
              <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted mb-4">
                 <span className={step==='cart'?'text-primary':''}>01 Review Items</span>
                 <span className="w-12 h-0.5 bg-border rounded-full" />
                 <span className={step==='checkout'?'text-primary':''}>02 Delivery Info</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-dark tracking-tight">
                 {step==='cart' ? (lang==='hi'?'आपका कार्ट':'My Helper Cart') : (lang==='hi'?'डिलीवरी':'Delivery Details')}
              </h1>
           </div>
           
           <button onClick={() => step==='checkout'?setStep('cart'):onNavigate('home')}
                   className="btn text-muted hover:text-dark hover:bg-surface border border-transparent hover:border-border rounded-full px-6 py-3 transition-all">
              <ArrowLeft className="w-5 h-5 mr-3"/>
              {step === 'checkout' ? 'Back to Cart' : 'Scan More'}
           </button>
        </motion.header>

        <div className="grid lg:grid-cols-[1fr_400px] gap-10 xl:gap-16 items-start pb-20">
           
           <div className="space-y-6">
              {step === 'cart' ? (
                 <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
                    <AnimatePresence>
                    {cart.map(item => (
                       <motion.div variants={fadeUp} exit={{ opacity: 0, scale: 0.9 }} key={item.id} className="card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-8 bg-surface shadow-xl shadow-primary/5 border-none rounded-[32px] relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                          
                          <div className="w-24 h-24 rounded-2xl bg-surface border border-border flex items-center justify-center text-4xl flex-shrink-0 shadow-sm relative z-10">
                             🌿
                          </div>
                          
                          <div className="flex-1 text-center sm:text-left relative z-10">
                             <h4 className="text-3xl font-bold mb-2 text-dark">{item.name}</h4>
                             <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">{item.unit}</p>
                             {item.organic_certified && (
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">Organic Safe</span>
                             )}
                          </div>

                          <div className="flex items-center gap-3 p-2 bg-surface border border-border rounded-2xl relative z-10 shadow-sm">
                             <button onClick={() => updateQty(item.id,-1)} className="w-10 h-10 rounded-xl bg-surface border border-border hover:border-primary hover:text-primary transition-colors flex items-center justify-center shadow-sm">
                                <Minus className="w-4 h-4"/>
                             </button>
                             <span className="text-2xl font-black w-8 text-center text-dark">{item.quantity}</span>
                             <button onClick={() => updateQty(item.id,1)} className="w-10 h-10 rounded-xl bg-surface border border-border hover:border-primary hover:text-primary transition-colors flex items-center justify-center shadow-sm">
                                <Plus className="w-4 h-4"/>
                             </button>
                          </div>

                          <div className="text-center sm:text-right min-w-[120px] relative z-10">
                             <p className="text-3xl font-black text-primary mb-3">₹{item.price_per_unit*item.quantity}</p>
                             <button onClick={() => remove(item.id)} className="text-muted hover:text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center sm:justify-end gap-1.5 transition-colors w-full">
                                <Trash2 className="w-4 h-4"/> Remove
                             </button>
                          </div>
                       </motion.div>
                    ))}
                    </AnimatePresence>
                 </motion.div>
              ) : (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-8 md:p-10 bg-surface shadow-xl shadow-primary/5 border-none rounded-[40px]">
                     <h3 className="text-3xl font-bold mb-10 flex items-center gap-4 text-dark">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        Delivery Information
                     </h3>
                     <div className="grid md:grid-cols-2 gap-8">
                        {[
                          {k:'name',    l:'Full Name',     p:'Your full name'},
                          {k:'phone',   l:'Phone Number',  p:'10-digit mobile number', t:'tel'},
                          {k:'address', l:'Farm Address',  p:'Village, Tehsil, District'},
                          {k:'pincode', l:'PIN Code',      p:'6-digit code', t:'number'},
                        ].map(f => (
                          <div key={f.k} className={f.k === 'address' ? 'md:col-span-2' : ''}>
                            <label className="text-[11px] font-black text-dark uppercase tracking-widest mb-3 block ml-1">{f.l}</label>
                            <input type={f.t||'text'} placeholder={f.p} value={form[f.k]}
                                   onChange={e => setForm({...form,[f.k]:e.target.value})}
                                   className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-lg font-medium text-dark focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"/>
                          </div>
                        ))}
                     </div>
                  </motion.div>
              )}
           </div>

            <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="sticky top-28">
               <div className="card p-8 md:p-10 bg-dark text-white shadow-2xl overflow-hidden relative border-0 rounded-[40px]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[50px] -mr-20 -mt-20 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-[40px] -ml-16 -mb-16 pointer-events-none" />
                  
                  <h3 className="text-2xl font-bold mb-10 flex items-center gap-3 relative z-10">
                     <CreditCard className="w-6 h-6 text-primary" />
                     Order Summary
                  </h3>
                  
                  <div className="space-y-5 mb-12 relative z-10">
                     <div className="flex justify-between text-white/60 text-[11px] font-bold uppercase tracking-widest">
                        <span>Item Total</span><span className="text-white">₹{total}</span>
                     </div>
                     <div className="flex justify-between text-white/60 text-[11px] font-bold uppercase tracking-widest">
                        <span>Delivery Fee</span><span className="text-primary font-black italic">FREE</span>
                     </div>
                     <div className="h-px bg-white/10 my-8" />
                     <div className="flex justify-between items-end">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Total Amount</span>
                        <span className="text-5xl font-black text-white">₹{total}</span>
                     </div>
                  </div>

                  <div className="relative z-10">
                    {step==='cart' ? (
                      <button onClick={() => setStep('checkout')} className="btn-primary w-full py-5 text-base shadow-xl shadow-primary/20">
                         Continue to Checkout
                         <ArrowRight className="w-5 h-5 ml-2"/>
                      </button>
                    ) : (
                      <button onClick={placeIt} disabled={loading} className="btn-primary w-full py-5 text-base shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none">
                         {loading ? 'Processing...' : (lang==='hi'?'ऑर्डर दें':'Place Order')}
                         {!loading && <CheckCircle2 className="w-5 h-5 ml-2"/>}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 mt-8 opacity-60 relative z-10">
                    <Lock className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                       100% Secure Checkout
                    </p>
                  </div>
              </div>
           </motion.aside>

        </div>
      </div>
    </div>
  )
}
