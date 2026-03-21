import { useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, CheckCircle2, Package, ArrowLeft, Truck, Lock } from 'lucide-react'
import { placeOrder } from '../services/api.js'
import toast from 'react-hot-toast'

function OrderConfirmation({ order, lang, onNavigate }) {
  return (
    <div className="container py-16 max-w-lg text-center">
      <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
           style={{background:'#DCFCE7',border:'4px solid #BBF7D0'}}>
        <CheckCircle2 className="w-10 h-10 text-green-600"/>
      </div>
      <h2 className="font-display text-3xl font-extrabold mb-2" style={{color:'var(--dark)'}}>
        {lang==='hi'?'ऑर्डर हो गया!':'Order Confirmed!'}
      </h2>
      <p className="font-body text-sm mb-8" style={{color:'var(--muted)'}}>
        Order <strong>#{order.order_id}</strong> placed successfully.
      </p>

      <div className="card text-left mb-4 p-5">
        <p className="font-body text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--muted)'}}>Order Summary</p>
        {order.items?.map((item,i) => (
          <div key={i} className="flex justify-between text-sm font-body py-1.5"
               style={{borderBottom:'1px solid var(--border)'}}>
            <span style={{color:'var(--dark)'}}>{item.name} × {item.quantity}</span>
            <span className="font-semibold" style={{color:'var(--green)'}}>₹{item.item_total||item.price*item.quantity}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold font-body mt-3">
          <span style={{color:'var(--dark)'}}>Total</span>
          <span className="font-display text-xl" style={{color:'var(--green)'}}>₹{order.total_amount}</span>
        </div>
      </div>

      <div className="card flex items-center gap-4 mb-8 p-4" style={{background:'#FEF3C7',border:'1px solid #FDE68A'}}>
        <Truck className="w-8 h-8 text-amber-600 flex-shrink-0"/>
        <div className="text-left">
          <p className="font-body text-sm font-bold text-amber-800">Estimated Delivery</p>
          <p className="font-display text-lg font-extrabold text-amber-900">{order.estimated_delivery}</p>
        </div>
      </div>

      <button onClick={() => onNavigate('scan')} className="btn-primary btn-lg w-full font-bold">
        Scan Another Crop <ArrowRight className="w-4 h-4"/>
      </button>
    </div>
  )
}

export default function CartPage({ cart, onUpdateCart, onNavigate, lang }) {
  const [step, setStep]       = useState('cart')
  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ name:'', phone:'', address:'', pincode:'' })

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
      toast.error('Please fill all fields'); return
    }
    setLoading(true)
    try {
      const items = cart.map(i => ({product_id:i.id,name:i.name,quantity:i.quantity,price:i.price_per_unit,item_total:i.price_per_unit*i.quantity}))
      const res = await placeOrder({items,farmer_name:form.name,phone:form.phone,address:form.address,pincode:form.pincode,total_amount:total})
      setOrder({...res,items,total_amount:total})
      setStep('confirmed')
      onUpdateCart([])
    } catch { toast.error('Order failed. Try again.') }
    finally { setLoading(false) }
  }

  if (step==='confirmed' && order) return <OrderConfirmation order={order} lang={lang} onNavigate={onNavigate}/>

  if (cart.length===0) return (
    <div className="container py-20 max-w-md text-center">
      <div className="text-6xl mb-5">🛒</div>
      <h2 className="font-display text-2xl font-bold mb-2" style={{color:'var(--dark)'}}>
        {lang==='hi'?'कार्ट खाली है':'Your cart is empty'}
      </h2>
      <p className="font-body text-sm mb-8" style={{color:'var(--muted)'}}>
        {lang==='hi'?'पहले फसल स्कैन करें':'Scan a crop to get treatment recommendations.'}
      </p>
      <button onClick={() => onNavigate('scan')} className="btn-primary btn-lg">
        {lang==='hi'?'फसल स्कैन करें':'Scan a Crop'} <ArrowRight className="w-4 h-4"/>
      </button>
    </div>
  )

  return (
    <div className="container py-10 max-w-2xl">
      <button onClick={() => step==='checkout'?setStep('cart'):onNavigate('home')}
              className="flex items-center gap-2 text-sm font-body mb-6 transition-colors"
              style={{color:'var(--muted)'}}>
        <ArrowLeft className="w-4 h-4"/>
        {step==='checkout'?'Back to cart':'Continue shopping'}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6" style={{color:'var(--green)'}}/>
        <h1 className="font-display text-3xl font-extrabold" style={{color:'var(--dark)'}}>
          {step==='cart'
            ? (lang==='hi'?'आपका कार्ट':'Your Cart')
            : (lang==='hi'?'डिलीवरी विवरण':'Delivery Details')}
        </h1>
      </div>

      {step==='cart' ? (
        <>
          <div className="space-y-3 mb-6">
            {cart.map(item => (
              <div key={item.id} className="card flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                     style={{background:'var(--bg)'}}>🌿</div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold truncate" style={{color:'var(--dark)'}}>{item.name}</p>
                  <p className="font-body text-xs" style={{color:'var(--muted)'}}>{item.unit}</p>
                  {item.organic_certified && <span className="badge-green text-[10px] mt-1">Organic</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id,-1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{background:'var(--bg)',border:'1px solid var(--border)'}}>
                    <Minus className="w-3.5 h-3.5" style={{color:'var(--dark)'}}/>
                  </button>
                  <span className="w-6 text-center text-sm font-bold font-body" style={{color:'var(--dark)'}}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id,1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{background:'var(--bg)',border:'1px solid var(--border)'}}>
                    <Plus className="w-3.5 h-3.5" style={{color:'var(--dark)'}}/>
                  </button>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold" style={{color:'var(--green)'}}>₹{item.price_per_unit*item.quantity}</p>
                  <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 mt-1 transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5" style={{border:'2px solid var(--border)'}}>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm font-body" style={{color:'var(--muted)'}}>
                <span>Subtotal</span><span>₹{total}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span style={{color:'var(--muted)'}}>Delivery</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold font-body pt-2"
                   style={{borderTop:'1px solid var(--border)',color:'var(--dark)'}}>
                <span className="text-base">Total</span>
                <span className="font-display text-2xl" style={{color:'var(--green)'}}>₹{total}</span>
              </div>
            </div>
            <button onClick={() => setStep('checkout')} className="btn-gold btn-lg w-full font-bold">
              Proceed to Checkout <ArrowRight className="w-4 h-4"/>
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display text-base font-bold mb-4" style={{color:'var(--dark)'}}>Delivery Address</h3>
            <div className="space-y-3">
              {[
                {k:'name',    l:'Full Name',     p:'e.g. Ramlal Sharma'},
                {k:'phone',   l:'Mobile Number', p:'10-digit mobile', t:'tel'},
                {k:'address', l:'Village / Town', p:'Village, Tehsil, District'},
                {k:'pincode', l:'PIN Code',       p:'6-digit PIN', t:'number'},
              ].map(f => (
                <div key={f.k}>
                  <label className="font-body text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'var(--muted)'}}>{f.l}</label>
                  <input type={f.t||'text'} placeholder={f.p} value={form[f.k]}
                         onChange={e => setForm({...form,[f.k]:e.target.value})}
                         className="input"/>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4" style={{background:'var(--bg)'}}>
            <p className="font-body text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--muted)'}}>Order Summary</p>
            {cart.map(i => (
              <div key={i.id} className="flex justify-between text-sm font-body mb-1.5">
                <span style={{color:'var(--dark)'}}>{i.name} × {i.quantity}</span>
                <span className="font-semibold" style={{color:'var(--green)'}}>₹{i.price_per_unit*i.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold font-body pt-2 mt-1" style={{borderTop:'1px solid var(--border)'}}>
              <span style={{color:'var(--dark)'}}>Total</span>
              <span className="font-display text-xl" style={{color:'var(--green)'}}>₹{total}</span>
            </div>
          </div>

          <button onClick={placeIt} disabled={loading} className="btn-gold btn-lg w-full font-bold disabled:opacity-50">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                Placing order…
              </span>
            ) : <>Place Order <ArrowRight className="w-4 h-4"/></>}
          </button>

          <div className="flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" style={{color:'var(--muted)'}}/>
            <p className="font-body text-xs text-center" style={{color:'var(--muted)'}}>
              Prototype only — no real payment charged
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
