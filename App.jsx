import React, { useMemo, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';

const fmtMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
const today = new Date();

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function yyyymmdd(date){ return date.toISOString().slice(0,10); }
function encodeWaText(s){ try { return encodeURIComponent(String(s ?? "")); } catch { return String(s ?? ""); } }

function qrPayloadFromBooking(b){ return JSON.stringify({ v:1, t:"HBK", id:b.id }); }
function parseQrPayload(text){ try{ const o = JSON.parse(text); if (o && o.t==="HBK" && o.id) return o.id; } catch{} return null; }

const INSTRUCTORS = [
  { id: "eric", name: "ERIC" },
  { id: "jiaxin", name: "Jia Xin" },
  { id: "darren", name: "Darren" },
  { id: "carmen", name: "Carmen" },
  { id: "karyn", name: "Karyn" },
  { id: "sam", name: "Sam" },
  { id: "leony", name: "Leony" },
  { id: "chenlynn", name: "Chen Lynn" },
  { id: "jay", name: "Jay" },
  { id: "nigel", name: "Nigel" },
  { id: "rueben", name: "Rueben" },
  { id: "lohjie", name: "Loh Jie" },
  { id: "poh", name: "Poh" },
];
const ROOMS = [ { id:"A", name:"Studio A" }, { id:"B", name:"Studio B" } ];

const CLASSES = [
  { id:"sdfc_wed_eric", title:"Street Dance Foundation Course", level:"Foundation", style:"Street Foundation", instructorId:"eric", durationMin:60, capacity:25, price:55, roomId:"A", slots:["19:30–20:30"], weekdays:[3] },
  { id:"hiphop_wed_eric", title:"Hip Hop (Drop-in)", level:"Open Level", style:"Hip Hop", instructorId:"eric", durationMin:60, capacity:25, price:70, roomId:"A", slots:["20:30–21:30"], weekdays:[3] },
  { id:"choreo_mon_leony", title:"Choreography", level:"Intermediate", style:"Choreography", instructorId:"leony", durationMin:60, capacity:20, price:70, roomId:"B", slots:["20:30–21:30"], weekdays:[1] },
  { id:"choreo_mon_jay", title:"Choreography", level:"Intermediate", style:"Choreography", instructorId:"jay", durationMin:60, capacity:20, price:70, roomId:"B", slots:["21:30–22:30"], weekdays:[1] },
  { id:"thda_course_mon_jiaxin", title:"THDA Dance Course (8W)", level:"Course", style:"Course", instructorId:"jiaxin", durationMin:120, capacity:25, price:600, roomId:"A", slots:["21:30–23:30"], weekdays:[1] },
  { id:"choreo_tue_darren", title:"Choreography", level:"Intermediate", style:"Choreography", instructorId:"darren", durationMin:60, capacity:20, price:70, roomId:"A", slots:["20:30–21:30"], weekdays:[2] },
  { id:"kpop_tue_karyn", title:"K-pop Cover", level:"Beginners", style:"K-pop Cover", instructorId:"karyn", durationMin:60, capacity:20, price:70, roomId:"A", slots:["21:30–22:30"], weekdays:[2] },
  { id:"waacking_tue_chenlynn", title:"Waacking", level:"Beginners", style:"Waacking", instructorId:"chenlynn", durationMin:60, capacity:20, price:70, roomId:"B", slots:["20:30–21:30"], weekdays:[2] },
  { id:"choreo_tue_nigel", title:"Choreography", level:"Intermediate", style:"Choreography", instructorId:"nigel", durationMin:60, capacity:20, price:70, roomId:"B", slots:["21:30–22:30"], weekdays:[2] },
  { id:"choreo_wed_jiaxin", title:"Choreography", level:"Beginners", style:"Choreography", instructorId:"jiaxin", durationMin:60, capacity:20, price:70, roomId:"B", slots:["20:30–21:30"], weekdays:[3] },
  { id:"popping_thu_carmen", title:"Popping", level:"Open Level", style:"Popping", instructorId:"carmen", durationMin:60, capacity:20, price:70, roomId:"A", slots:["20:30–21:30"], weekdays:[4] },
  { id:"groove_thu_rueben", title:"Groove & Exploration", level:"Introduction", style:"Groove", instructorId:"rueben", durationMin:60, capacity:20, price:70, roomId:"B", slots:["20:30–21:30"], weekdays:[4] },
  { id:"krump_fri_sam", title:"Krump", level:"Beginners", style:"Krump", instructorId:"sam", durationMin:60, capacity:20, price:70, roomId:"A", slots:["21:30–22:30"], weekdays:[5] },
  { id:"choreo_fri_rueben", title:"Choreography", level:"Intermediate", style:"Choreography", instructorId:"rueben", durationMin:60, capacity:20, price:70, roomId:"B", slots:["21:30–22:30"], weekdays:[5] },
  { id:"breaking_sat_lohjie", title:"Breaking", level:"Beginners", style:"Breaking", instructorId:"lohjie", durationMin:60, capacity:20, price:70, roomId:"A", slots:["12:00–13:00"], weekdays:[6] },
  { id:"streetjazz_sat_poh", title:"Street Jazz", level:"Open Level", style:"Street Jazz", instructorId:"poh", durationMin:60, capacity:20, price:70, roomId:"B", slots:["15:00–16:00"], weekdays:[6] },
];

const LS = { CART:'hoodbook_cart', BOOKINGS:'hoodbook_bookings', SETTINGS:'hoodbook_settings', USER:'hoodbook_user' };
function useLocalStorage(key, initial){
  const [state,setState] = useState(()=>{ try{ const v = localStorage.getItem(key); return v? JSON.parse(v): initial; }catch{return initial;} });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(state)); }catch{} }, [key,state]);
  return [state,setState];
}

function WeekSelector({baseDate,onChange}){
  const start = useMemo(()=> startOfWeek(baseDate),[baseDate]);
  const days = [0,1,2,3,4,5,6].map(i=> addDays(start,i));
  const label = `${days[0].toLocaleDateString("en-MY",{month:"short",day:"numeric"})} – ${days[6].toLocaleDateString("en-MY",{month:"short",day:"numeric"})}`;
  return (
    <div className="row-between">
      <button className="pill" onClick={()=> onChange(addDays(baseDate,-7))}>◀</button>
      <div className="title">{label}</div>
      <button className="pill" onClick={()=> onChange(addDays(baseDate,7))}>▶</button>
    </div>
  );
}

function App(){
  const [tab,setTab] = useState('book');
  const [weekBase,setWeekBase] = useState(today);
  const [query,setQuery] = useState('');
  const [filters,setFilters] = useState({style:'ALL_STYLES', instructor:'ALL_INSTRUCTORS'});
  const [cart,setCart] = useLocalStorage(LS.CART, []);
  const [bookings,setBookings] = useLocalStorage(LS.BOOKINGS, []);
  const [settings,setSettings] = useLocalStorage(LS.SETTINGS, { waNumber:'+601111086559', bankName:'HONG LEONG BANK', accountName:'THE HOOD FAM ACADEMY', accountNo:'06300122008', qrUrl:''});
  const [user,setUser] = useLocalStorage(LS.USER, null);
  const [pending,setPending] = useState(null);
  const [modalOpen,setModalOpen] = useState(false);
  const [payOpen,setPayOpen] = useState(false);
  const [cartSnapshot,setCartSnapshot] = useState([]);
  const [adminUnlocked,setAdminUnlocked] = useState(false);
  const [adminPin,setAdminPin] = useState('');

  function onBook(klass, date){
    setPending({ klass, date });
    setModalOpen(true);
  }
  function addToCart(time){
    if(!pending) return;
    const {klass, date} = pending;
    const room = ROOMS.find(r=> r.id===klass.roomId);
    const item = { id:`${klass.id}_${yyyymmdd(date)}_${time}`, classId:klass.id, title:klass.title, date:yyyymmdd(date), time, price:klass.price, roomName:room?.name, customer:user?.fullName || '', phone:user?.phone || '' };
    setCart(prev => prev.some(p=> p.id===item.id) ? prev : [...prev, item]);
    setModalOpen(false);
  }
  function proceed(){
    setCartSnapshot(cart);
    setPayOpen(true);
  }
  function markPaid(){
    const newBookings = cartSnapshot.map(c => ({...c, status:'Paid', checkedIn:false, createdAt:new Date().toISOString()}));
    setBookings(prev => [...newBookings, ...prev]);
    setCart([]); setCartSnapshot([]); setPayOpen(false); setTab('my');
  }

  const start = useMemo(()=> startOfWeek(weekBase), [weekBase]);
  const days = [0,1,2,3,4,5,6].map(i=> addDays(start,i));

  const total = cart.reduce((s,i)=> s+i.price, 0);
  const waMessage = (()=>{
    const lineItems = cartSnapshot.map(c=> `• ${c.title} — ${c.date} ${c.time} (${c.roomName}) ${fmtMYR.format(c.price)}`).join("\n");
    return `Hello THDA, I'd like to book:\n${lineItems}\n\nTotal: ${fmtMYR.format(cartSnapshot.reduce((s,i)=>s+i.price,0))}\nName: ${user?.fullName||''}\nPhone: ${user?.phone||''}\nStage name: ${user?.stageName||'-'}\nEmail: ${user?.email||'-'}\nIG: ${user?.instagram||'-'}\nEmergency: ${user?.emergencyContact||'-'}`;
  })();
  const waHref = `https://wa.me/${settings.waNumber}?text=${encodeWaText(waMessage)}`;

  return (
    <>
      <header>
        <div className="container">
          <div className="row">
            <div className="row" style={{gap:10}}>
              <div className="logo">HB</div>
              <div>
                <div className="title">HoodBook Mini</div>
                <div className="muted">Class bookings • THDA demo</div>
              </div>
            </div>
            <div className="row" style={{gap:8}}>
              <div className="search">
                <input placeholder="Search style / class / level" value={query} onChange={e=> setQuery(e.target.value)}/>
              </div>
              <button className="btn secondary" onClick={proceed}>Cart ({cart.length}) – {fmtMYR.format(total)}</button>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{paddingTop:24}}>
        <div className="tabs">
          {['book','my','admin','account'].map(t=> (
            <button key={t} className={t===tab? 'active': ''} onClick={()=> setTab(t)}>{t.toUpperCase()}</button>
          ))}
        </div>

        {tab==='book' && (
          <div className="grid" style={{marginTop:16,gap:16}}>
            <div className="card"><div className="content">
              <div className="grid grid-3">
                <WeekSelector baseDate={weekBase} onChange={setWeekBase}/>
                <select value={filters.style} onChange={e=> setFilters({...filters, style:e.target.value})}>
                  <option value="ALL_STYLES">All styles</option>
                  {[...new Set(CLASSES.map(c=> c.style))].map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filters.instructor} onChange={e=> setFilters({...filters, instructor:e.target.value})}>
                  <option value="ALL_INSTRUCTORS">All instructors</option>
                  {INSTRUCTORS.map(i=> <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            </div></div>

            <div className="grid grid-7">
              {days.map(d=>{
                const weekday = d.getDay();
                let list = CLASSES.filter(k=> k.weekdays.includes(weekday));
                if(filters.style!=='ALL_STYLES') list = list.filter(k=> k.style===filters.style);
                if(filters.instructor!=='ALL_INSTRUCTORS') list = list.filter(k=> k.instructorId===filters.instructor);
                if(query){ const q = query.toLowerCase(); list = list.filter(c=> (c.title+c.style+c.level).toLowerCase().includes(q)); }
                return (
                  <div key={d.toISOString()} className="col">
                    <div className="title">{d.toLocaleDateString('en-MY', { weekday:'short' })} <span className="muted">{d.getDate()}</span></div>
                    {list.length===0 && <div className="muted">No classes</div>}
                    {list.map(k=>{
                      const room = ROOMS.find(r=> r.id===k.roomId)?.name;
                      return (
                        <div key={k.id} className="card"><div className="content">
                          <div className="row-between"><div className="title">{k.title}</div><span className="badge">{k.level}</span></div>
                          <div className="muted">{k.style} • {k.durationMin} min</div>
                          <div className="row-between" style={{marginTop:8}}>
                            <div className="col">
                              <div className="muted">Time: {k.slots.join(', ')}</div>
                              <div className="muted">Cap {k.capacity} • {room}</div>
                            </div>
                            <div className="col" style={{alignItems:'end'}}>
                              <div className="title">{fmtMYR.format(k.price)}</div>
                              <button className="btn" onClick={()=> onBook(k, d)}>Book</button>
                            </div>
                          </div>
                        </div></div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==='my' && (
          <div className="grid" style={{marginTop:16}}>
            {bookings.length===0 && <div className="card"><div className="content muted">No bookings yet. Book a class to see it here.</div></div>}
            {bookings.map((b,i)=>(
              <div key={b.id+'_'+i} className="card"><div className="content row-between">
                <div>
                  <div className="title">{b.title}</div>
                  <div className="muted">{b.date} • {b.time} • {b.roomName} {b.checkedIn && <span style={{color:'#2563eb'}}> (Checked-in)</span>}</div>
                </div>
                <button className="pill" onClick={()=> alert('Show this QR at the door')}>
                  {fmtMYR.format(b.price)}
                </button>
              </div></div>
            ))}
          </div>
        )}

        {tab==='admin' && (
          <div className="grid grid-3" style={{marginTop:16}}>
            <div className="card"><div className="content">
              <div className="title">Sales Overview (Demo)</div>
              <div className="grid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:8}}>
                <div className="card"><div className="content"><div className="muted">Total Bookings</div><div className="title" style={{fontSize:24}}>{bookings.length}</div></div></div>
                <div className="card"><div className="content"><div className="muted">GMV</div><div className="title" style={{fontSize:24}}>{fmtMYR.format(bookings.reduce((s,b)=> s+b.price,0))}</div></div></div>
              </div>
            </div></div>

            <div className="card"><div className="content">
              <div className="title">Classes (Seed)</div>
              <div className="col" style={{marginTop:8}}>
                {CLASSES.map(c=> (
                  <div key={c.id} className="row-between" style={{border:'1px solid #eee', borderRadius:12, padding:10}}>
                    <div>
                      <div className="title">{c.title}</div>
                      <div className="muted">{c.style} • {c.level} • {c.slots.join(', ')} • Cap {c.capacity} • {ROOMS.find(r=>r.id===c.roomId)?.name}</div>
                    </div>
                    <div className="badge">{fmtMYR.format(c.price)}</div>
                  </div>
                ))}
              </div>
            </div></div>

            <div className="card"><div className="content">
              <div className="title">Attendance Scanner</div>
              {!adminUnlocked ? (
                <div className="row" style={{marginTop:8}}>
                  <input placeholder="Enter PIN (default 1234)" value={adminPin} onChange={e=> setAdminPin(e.target.value)} />
                  <button className="btn" onClick={()=> setAdminUnlocked(adminPin === '1234')}>Unlock</button>
                </div>
              ) : (
                <div className="col" style={{gap:8, marginTop:8}}>
                  <div className="muted">Point camera at student QR</div>
                  <div style={{overflow:'hidden', borderRadius:12, border:'1px solid #eee'}}>
                    <QrReader constraints={{ facingMode: "environment" }} onResult={(res)=>{
                      if(res){
                        const id = parseQrPayload(res.getText());
                        if(id){
                          setBookings(prev => prev.map(b=> b.id===id ? { ...b, checkedIn:true, checkinAt:new Date().toISOString() } : b));
                        }
                      }
                    }} style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div></div>
          </div>
        )}

        {tab==='account' && (
          <div className="card" style={{marginTop:16}}><div className="content col">
            <div className="title">{user ? "My Profile" : "Create your THDA account"}</div>
            <div className="grid grid-3">
              <input placeholder="Full name *" value={user?.fullName||''} onChange={e=> setUser({ ...(user||{}), fullName:e.target.value })} />
              <input placeholder="Stage name (optional)" value={user?.stageName||''} onChange={e=> setUser({ ...(user||{}), stageName:e.target.value })} />
              <input placeholder="WhatsApp number *" value={user?.phone||''} onChange={e=> setUser({ ...(user||{}), phone:e.target.value })} />
              <input placeholder="Email *" value={user?.email||''} onChange={e=> setUser({ ...(user||{}), email:e.target.value })} />
              <input placeholder="Instagram handle *" value={user?.instagram||''} onChange={e=> setUser({ ...(user||{}), instagram:e.target.value })} />
              <input placeholder="Emergency contact *" value={user?.emergencyContact||''} onChange={e=> setUser({ ...(user||{}), emergencyContact:e.target.value })} />
            </div>
            <div className="row" style={{gap:8}}>
              <button className="btn" onClick={()=> setUser({ ...(user||{}),
                fullName:(user?.fullName||'').trim(),
                phone:(user?.phone||'').trim(),
                email:(user?.email||'').trim(),
                instagram:(user?.instagram||'').trim(),
                emergencyContact:(user?.emergencyContact||'').trim(),
              })}>Save</button>
              {user && <button className="btn secondary" onClick={()=> setUser(null)}>Sign out</button>}
            </div>
            <div className="muted">Required: name, WhatsApp, email, Instagram, emergency contact.</div>
          </div></div>
        )}
      </main>

      {/* Booking modal */}
      <div className={'modal '+(modalOpen? 'open':'')} onClick={(e)=> { if(e.target.classList.contains('modal')) setModalOpen(false); }}>
        <div className="panel">
          <div className="content col">
            <div className="title">Book your spot</div>
            {pending && (
              <>
                <div className="muted">{pending.klass.title} • {pending.date.toDateString()} • {ROOMS.find(r=>r.id===pending.klass.roomId)?.name}</div>
                <div className="col">
                  <div className="muted">Choose time</div>
                  <div className="row" style={{flexWrap:'wrap', gap:8}}>
                    {pending.klass.slots.map(t=> <button key={t} className="pill" onClick={()=> addToCart(t)}>{t}</button>)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <div className={'modal '+(payOpen? 'open':'')} onClick={(e)=> { if(e.target.classList.contains('modal')) setPayOpen(false); }}>
        <div className="panel">
          <div className="content col">
            <div className="title">Complete your payment</div>
            <div className="card"><div className="content">
              <div className="title">Bank Transfer Details</div>
              <div className="grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:8}}>
                <div><div className="muted">Bank</div><div>{settings.bankName||'BANK'}</div></div>
                <div><div className="muted">Account Name</div><div>{settings.accountName||'ACCOUNT NAME'}</div></div>
                <div><div className="muted">Account No.</div><div>{settings.accountNo||'0000000000'}</div></div>
              </div>
            </div></div>

            {settings.qrUrl && <div className="card"><div className="content"><div className="title">Scan to pay (QR)</div><img src={settings.qrUrl} style={{maxHeight:260, width:'100%', objectFit:'contain'}}/></div></div>}

            <div className="card"><div className="content">
              <div className="title">Your Order</div>
              <div className="col">
                {cartSnapshot.map((c,i)=> <div key={i} className="row-between"><div>{c.title} — {c.date} {c.time} ({c.roomName})</div><div>{fmtMYR.format(c.price)}</div></div>)}
              </div>
              <div className="title" style={{marginTop:8}}>Total: {fmtMYR.format(cartSnapshot.reduce((s,i)=> s+i.price, 0))}</div>
            </div></div>

            <div className="row" style={{gap:8}}>
              <a className="btn" href={waHref} target="_blank">Open WhatsApp</a>
              <button className="btn secondary" onClick={markPaid}>Mark as Paid (manual)</button>
            </div>
            <div className="muted">After you bank-in and send the receipt via WhatsApp, we will confirm your booking.</div>
          </div>
        </div>
      </div>

      <footer className="container" style={{padding:'40px 16px'}}>
        <div className="muted">© {new Date().getFullYear()} HoodBook Demo • Built for THDA workflows. No online gateway required.</div>
      </footer>
    </>
  );
}

export default App;