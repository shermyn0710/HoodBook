import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Users, Clock, MapPin, Plus, X, CreditCard, CheckCircle2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// -----------------------------
// Utility helpers
// -----------------------------
const fmtMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
const today = new Date();

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday-based week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function yyyymmdd(date) {
  return date.toISOString().slice(0, 10);
}

// -----------------------------
// Demo seed data
// -----------------------------
const INSTRUCTORS = [
  { id: "eric", name: "ERIC", styles: ["Street Foundation", "Hip Hop"], bio: "18 years experience • The Hood Fam / KOB Nation / Exodus.", avatar: "🧢" },
  { id: "jiaxin", name: "Jiaxin", styles: ["Choreography"], bio: "Clean textures, musicality, K-pop choreo focus.", avatar: "✨" },
  { id: "henston", name: "Henston", styles: ["Girlstyle"], bio: "Lines, confidence, heels foundations.", avatar: "👠" },
];

const ROOMS = [
  { id: "A", name: "Studio A" },
  { id: "B", name: "Studio B" },
];

const CLASSES = [
  {
    id: "hiphop101",
    title: "HIP HOP 101 (Foundation)",
    level: "Beginner",
    style: "Hip Hop",
    instructorId: "eric",
    durationMin: 60,
    capacity: 18,
    price: 35,
    roomId: "B",
    color: "bg-yellow-100",
    slots: ["19:30"],
    weekdays: [3], // Wed
  },
  {
    id: "girlstyle101",
    title: "GIRLSTYLE 101 (Foundation)",
    level: "Beginner",
    style: "Girlstyle",
    instructorId: "henston",
    durationMin: 60,
    capacity: 16,
    price: 35,
    roomId: "A",
    color: "bg-pink-100",
    slots: ["20:30"],
    weekdays: [5], // Fri
  },
  {
    id: "choreoDropIn",
    title: "Choreography – Drop-in",
    level: "Open",
    style: "Choreography",
    instructorId: "jiaxin",
    durationMin: 60,
    capacity: 20,
    price: 40,
    roomId: "A",
    color: "bg-blue-100",
    slots: ["21:00"],
    weekdays: [2, 6], // Tue & Sat
  },
];

// -----------------------------
// Local storage helpers
// -----------------------------
const LS_KEYS = {
  CART: "hoodbook_cart",
  BOOKINGS: "hoodbook_bookings",
};

function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

// -----------------------------
// Components
// -----------------------------
function WeekSelector({ baseDate, onChange }) {
  const start = useMemo(() => startOfWeek(baseDate), [baseDate]);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));
  const label = `${days[0].toLocaleDateString("en-MY", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-MY", { month: "short", day: "numeric" })}`;
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" onClick={() => onChange(addDays(baseDate, -7))}><ChevronLeft className="w-4 h-4" /></Button>
      <div className="text-sm font-medium flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {label}</div>
      <Button variant="ghost" onClick={() => onChange(addDays(baseDate, 7))}><ChevronRight className="w-4 h-4" /></Button>
    </div>
  );
}

function ClassCard({ klass, date, onBook }) {
  const instructor = INSTRUCTORS.find((i) => i.id === klass.instructorId);
  const room = ROOMS.find((r) => r.id === klass.roomId);
  return (
    <Card className={`border-0 ${klass.color} shadow-sm`}> 
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{klass.title}</span>
          <Badge variant="secondary">{klass.level}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">{klass.style} • {klass.durationMin} min</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {klass.slots.join(", ")}</div>
          <div className="flex items-center gap-1"><Users className="w-3 h-3" /> Cap {klass.capacity}</div>
          <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {room?.name}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{fmtMYR.format(klass.price)}</div>
          <Button className="mt-1" onClick={() => onBook(klass, date)}>Book</Button>
        </div>
      </CardContent>
      <div className="px-6 pb-4 text-xs text-muted-foreground">Instructor: {instructor?.avatar} {instructor?.name}</div>
    </Card>
  );
}

function DayColumn({ date, classes, onBook }) {
  const isToday = yyyymmdd(date) === yyyymmdd(new Date());
  return (
    <div className={`flex flex-col gap-3 ${isToday ? "bg-muted/40 rounded-xl p-2" : ""}`}>
      <div className="text-sm font-semibold">
        {date.toLocaleDateString("en-MY", { weekday: "short" })}
        <span className="ml-1 text-muted-foreground">{date.getDate()}</span>
      </div>
      {classes.length === 0 && (
        <div className="text-xs text-muted-foreground">No classes</div>
      )}
      {classes.map((k) => (
        <ClassCard key={k.id} klass={k} date={date} onBook={onBook} />
      ))}
    </div>
  );
}

function WeekGrid({ baseDate, onBook }) {
  const start = useMemo(() => startOfWeek(baseDate), [baseDate]);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
      {days.map((d) => {
        const weekday = d.getDay();
        const classes = CLASSES.filter((k) => k.weekdays.includes(weekday));
        return <DayColumn key={d.toISOString()} date={d} classes={classes} onBook={onBook} />;
      })}
    </div>
  );
}

function CartDrawer({ cart, setCart, onCheckout }) {
  const total = cart.reduce((sum, i) => sum + i.price, 0);
  function removeItem(idx) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" className="gap-2"><CreditCard className="w-4 h-4"/> Cart ({cart.length})</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your booking cart</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {cart.length === 0 && <div className="text-sm text-muted-foreground">Cart is empty</div>}
          {cart.map((it, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 border rounded-xl p-3">
              <div className="text-sm">
                <div className="font-medium">{it.title}</div>
                <div className="text-xs text-muted-foreground">{it.date} • {it.time} • {it.roomName}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{fmtMYR.format(it.price)}</div>
                <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm">Total</div>
          <div className="text-lg font-semibold">{fmtMYR.format(total)}</div>
        </div>
        <Button className="mt-4 w-full" disabled={cart.length === 0} onClick={onCheckout}>Proceed to checkout</Button>
        <div className="mt-2 text-xs text-muted-foreground">Demo checkout – no real payment yet.</div>
      </SheetContent>
    </Sheet>
  );
}

export default function HoodBookMiniApp() {
  const [weekBase, setWeekBase] = useState(today);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useLocalStorage(LS_KEYS.CART, []);
  const [bookings, setBookings] = useLocalStorage(LS_KEYS.BOOKINGS, []);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", instructor: "", style: "" });
  const [tab, setTab] = useState("book");

  const filtered = useMemo(() => {
    if (!query) return CLASSES;
    const q = query.toLowerCase();
    return CLASSES.filter((c) => c.title.toLowerCase().includes(q) || c.style.toLowerCase().includes(q) || c.level.toLowerCase().includes(q));
  }, [query]);

  function handleBook(klass, date) {
    setPending({ klass, date });
    setForm((f) => ({ ...f, instructor: klass.instructorId, style: klass.style }));
    setOpen(true);
  }

  function addToCart(time) {
    if (!pending) return;
    const { klass, date } = pending;
    const instructor = INSTRUCTORS.find((i) => i.id === klass.instructorId);
    const room = ROOMS.find((r) => r.id === klass.roomId);
    const item = {
      id: `${klass.id}_${yyyymmdd(date)}_${time}`,
      classId: klass.id,
      title: klass.title,
      date: yyyymmdd(date),
      time,
      price: klass.price,
      instructorName: instructor?.name,
      roomName: room?.name,
      customer: form.name,
      phone: form.phone,
    };
    setCart((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev; // avoid duplicates
      return [...prev, item];
    });
    setOpen(false);
  }

  function checkout() {
    // Simulate payments + persist to bookings
    const newBookings = cart.map((c) => ({ ...c, status: "Paid", createdAt: new Date().toISOString() }));
    setBookings((prev) => [...newBookings, ...prev]);
    setCart([]);
    setTab("my");
  }

  const start = useMemo(() => startOfWeek(weekBase), [weekBase]);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-10 h-10 rounded-2xl bg-black text-white grid place-content-center font-bold">HB</motion.div>
            <div>
              <div className="font-semibold leading-tight">HoodBook Mini</div>
              <div className="text-xs text-muted-foreground -mt-0.5">Class bookings • THDA demo</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56 hidden md:block">
              <Input placeholder="Search style / class / level" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            </div>
            <CartDrawer cart={cart} setCart={setCart} onCheckout={checkout} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="book">Book</TabsTrigger>
            <TabsTrigger value="my">My Bookings</TabsTrigger>
            <TabsTrigger value="admin">Admin (Demo)</TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="mt-6 space-y-6">
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-3">
                  <WeekSelector baseDate={weekBase} onChange={setWeekBase} />
                  <Select value={form.style} onValueChange={(v) => setForm((f) => ({ ...f, style: v }))}>
                    <SelectTrigger><SelectValue placeholder="Filter by style" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All styles</SelectItem>
                      {[...new Set(CLASSES.map((c) => c.style))].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.instructor} onValueChange={(v) => setForm((f) => ({ ...f, instructor: v }))}>
                    <SelectTrigger><SelectValue placeholder="Filter by instructor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All instructors</SelectItem>
                      {INSTRUCTORS.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <WeekGrid baseDate={weekBase} onBook={handleBook} />
          </TabsContent>

          <TabsContent value="my" className="mt-6">
            <div className="grid gap-3">
              {bookings.length === 0 && (
                <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No bookings yet. Book a class to see it here.</CardContent></Card>
              )}
              {bookings.map((b, i) => (
                <Card key={`${b.id}_${i}`} className="border-0 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> {b.title}</CardTitle>
                    <CardDescription className="text-xs">Instructor: {b.instructorName} • {b.roomName}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm">
                    <div>{b.date} • {b.time}</div>
                    <div className="font-semibold">{fmtMYR.format(b.price)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview (Demo)</CardTitle>
                  <CardDescription>Simulated data from local bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-neutral-100">
                      <div className="text-xs text-muted-foreground">Total Bookings</div>
                      <div className="text-2xl font-semibold">{bookings.length}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-neutral-100">
                      <div className="text-xs text-muted-foreground">GMV</div>
                      <div className="text-2xl font-semibold">{fmtMYR.format(bookings.reduce((s, b) => s + b.price, 0))}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Classes (Seed)</CardTitle>
                  <CardDescription>Manage offerings (read-only in demo)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {CLASSES.map((c) => (
                    <div key={c.id} className="border rounded-2xl p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.style} • {c.level} • {c.slots.join(", ")} • Cap {c.capacity} • {ROOMS.find(r=>r.id===c.roomId)?.name}</div>
                      </div>
                      <Badge variant="secondary">{fmtMYR.format(c.price)}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book your spot</DialogTitle>
          </DialogHeader>
          {pending && (
            <div className="space-y-4">
              <div className="text-sm">
                <div className="font-medium">{pending.klass.title}</div>
                <div className="text-xs text-muted-foreground">{pending.date.toDateString()} • {ROOMS.find(r=>r.id===pending.klass.roomId)?.name}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Your full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone (WhatsApp)</Label>
                  <Input placeholder="e.g. 012-3456789" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Choose time</Label>
                <div className="flex flex-wrap gap-2">
                  {pending.klass.slots.map((t) => (
                    <Button key={t} variant="outline" onClick={() => addToCart(t)} className="rounded-xl">{t}</Button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">On confirm, the class is added to cart. Proceed to checkout to complete booking.</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <footer className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} HoodBook Demo • Built for THDA workflows. Extend with Stripe, WhatsApp API, and Google Sheets in production.</div>
      </footer>
    </div>
  );
}
