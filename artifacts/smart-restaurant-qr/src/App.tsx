import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  ClipboardList,
  Clock3,
  Coffee,
  ConciergeBell,
  LayoutDashboard,
  LogIn,
  Menu as MenuIcon,
  Minus,
  PackageCheck,
  PanelLeft,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShoppingBag,
  Sparkles,
  Utensils,
  Users,
  X,
} from 'lucide-react';
import {
  CallInputType,
  getGetDashboardSummaryQueryKey,
  getListCallsQueryKey,
  getListOrdersQueryKey,
  OrderStatus,
  type CallStatusUpdateStatus,
  type MenuCategory,
  type MenuItem,
  type Order,
  type OrderItem,
  type OrderStatusUpdateStatus,
  type WaiterCall,
  useCreateCall,
  useCreateOrder,
  useGetDashboardSummary,
  useGetMenu,
  useListCalls,
  useListOrders,
  useUpdateCallStatus,
  useUpdateOrderStatus,
} from '@workspace/api-client-react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useRoute } from 'wouter';

const queryClient = new QueryClient();

const money = (amount: number) => `$${amount.toFixed(2)}`;
const ago = (date: string) => {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
};

function StatusPill({ status }: { status: string }) {
  const label = status.replace('_', ' ');
  const style = status === 'ready' || status === 'resolved' || status === 'completed'
    ? 'bg-[#e2efe8] text-[#27604d]'
    : status === 'preparing' || status === 'claimed'
      ? 'bg-[#fff0cc] text-[#8a5b16]'
      : status === 'cancelled'
        ? 'bg-[#f7dfdc] text-[#963b35]'
        : 'bg-[#eee7f0] text-[#614761]';
  return <span data-testid={`status-${status}`} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em] ${style}`}>{label}</span>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" data-testid="link-brand" className={`flex items-center gap-2.5 ${compact ? '' : 'w-fit'}`}>
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-secondary text-primary shadow-[3px_3px_0_hsl(var(--accent))]">
        <Utensils size={18} strokeWidth={2.6} />
      </span>
      <span className="leading-none">
        <span className="font-display block text-[18px] font-bold tracking-tight">Mise.</span>
        {!compact && <span className="mt-0.5 block font-mono-custom text-[9px] uppercase tracking-[.18em] text-muted-foreground">table companion</span>}
      </span>
    </Link>
  );
}

function LoadingRows({ count = 3 }: { count?: number }) {
  return <div className="space-y-3" data-testid="state-loading">
    {Array.from({ length: count }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/70" />)}
  </div>;
}

function ErrorState({ onRetry, label = 'Could not load this view.' }: { onRetry?: () => void; label?: string }) {
  return <div data-testid="state-error" className="rounded-2xl border border-[#e8bbb3] bg-[#fff2ef] p-6 text-center">
    <CircleAlert className="mx-auto mb-2 text-accent" size={24} />
    <p className="font-semibold">{label}</p>
    {onRetry && <button data-testid="button-retry" onClick={onRetry} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><RefreshCw size={14} /> Try again</button>}
  </div>;
}

function StaffShell({ children, title, eyebrow, role }: { children: ReactNode; title: string; eyebrow: string; role: 'kitchen' | 'waiter' | 'admin' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/kitchen', label: 'Kitchen display', icon: ChefHat, key: 'kitchen' },
    { href: '/waiter', label: 'Floor calls', icon: ConciergeBell, key: 'waiter' },
    { href: '/admin', label: 'Control room', icon: LayoutDashboard, key: 'admin' },
  ];
  return <div className="min-h-[100dvh] bg-background md:flex">
    <aside className={`fixed inset-y-0 left-0 z-40 w-[270px] -translate-x-full bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 md:relative md:translate-x-0 ${mobileOpen ? 'translate-x-0' : ''}`}>
      <div className="flex items-center justify-between">
        <Brand />
        <button data-testid="button-close-nav" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-sidebar-foreground/60 md:hidden"><X size={18} /></button>
      </div>
      <div className="mt-10 border-b border-sidebar-border pb-5">
        <p className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/50">Good evening, Asha</p>
        <p className="mt-2 text-sm font-semibold">The Juniper Room</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-sidebar-foreground/60"><span className="animate-pulse-dot h-2 w-2 rounded-full bg-[#82c9a9]" /> Live service · 7:42 PM</div>
      </div>
      <nav className="mt-7 space-y-1.5" aria-label="Staff navigation">
        {nav.map(({ href, label, icon: Icon, key }) => <Link key={href} href={href} data-testid={`link-${key}`} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-colors ${role === key ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><Icon size={18} /><span className="font-semibold">{label}</span>{role === key && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" />}</Link>)}
      </nav>
      <div className="absolute inset-x-5 bottom-6">
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold"><Sparkles size={14} className="text-secondary" /> Service note</div>
          <p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/60">Keep the room warm. Table 14 is celebrating tonight.</p>
        </div>
        <Link href="/login" data-testid="link-switch-workspace" className="mt-4 flex items-center gap-2 px-1 text-xs font-bold text-sidebar-foreground/60 hover:text-sidebar-foreground"><LogIn size={14} /> Switch workspace</Link>
      </div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" data-testid="button-overlay-nav" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-primary/40 md:hidden" />}
    <main className="min-w-0 flex-1">
      <header className="flex items-center justify-between border-b border-border bg-card/75 px-5 py-4 backdrop-blur md:px-9">
        <div className="flex items-center gap-3">
          <button data-testid="button-open-nav" onClick={() => setMobileOpen(true)} className="rounded-xl border border-border p-2 md:hidden"><PanelLeft size={18} /></button>
          <div><p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-muted-foreground">{eyebrow}</p><h1 className="font-display text-2xl font-bold tracking-tight md:text-[28px]">{title}</h1></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-[#52a77d]" /> Service live</div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">AS</div>
        </div>
      </header>
      <div className="shell-texture min-h-[calc(100dvh-78px)] px-5 py-6 md:px-9 md:py-8">{children}</div>
    </main>
  </div>;
}

function MenuPage() {
  const tableParam = new URLSearchParams(window.location.search).get('table');
  const demoMode = !tableParam;
  const table = tableParam || '1';
  const menuQuery = useGetMenu();
  const createOrder = useCreateOrder();
  const createCall = useCreateCall();
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordered, setOrdered] = useState<Order | null>(null);
  const [notice, setNotice] = useState('');

  const categories = menuQuery.data ?? [];
  const selected = activeCategory || categories[0]?.id || '';
  const filteredCategories = useMemo(() => categories.map((category) => ({
    ...category,
    items: category.items.filter((item) => !search.trim() || `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())),
  })).filter((category) => !selected || category.id === selected), [categories, search, selected]);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const addItem = (item: MenuItem) => {
    setCart((current) => {
      const found = current.find((entry) => entry.id === item.id);
      if (found) return current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry);
      return [...current, { id: item.id, name: item.name, price: item.price, quantity: 1, instructions: '', isVeg: item.isVeg }];
    });
    setNotice(`${item.name} added`);
    window.setTimeout(() => setNotice(''), 1800);
  };
  const changeQty = (id: string, amount: number) => setCart((current) => current.flatMap((item) => item.id === id ? (item.quantity + amount > 0 ? [{ ...item, quantity: item.quantity + amount }] : []) : [item]));
  const placeOrder = () => {
    if (!table || !cart.length) return;
    createOrder.mutate({ data: { tableNumber: Number(table), items: cart } }, {
      onSuccess: (order) => { setOrdered(order); setCart([]); setCartOpen(false); },
    });
  };
  const request = (type: 'waiter' | 'water' | 'bill') => {
    if (!table) { setNotice('Scan a table QR to request service'); return; }
    createCall.mutate({ data: { tableNumber: Number(table), type } }, { onSuccess: () => setNotice('Your request is with the floor team') });
  };

  return <div className="min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <span data-testid="text-table-number" className="hidden rounded-full bg-muted px-3 py-2 font-mono-custom text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:block">Table {table}</span>
          <Link href="/login" data-testid="link-sign-in" className="hidden rounded-full px-2 py-2 text-xs font-bold text-muted-foreground hover:bg-muted sm:block">Sign in</Link>
          <button data-testid="button-open-cart" onClick={() => setCartOpen(true)} className="focus-ring relative flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"><ShoppingBag size={16} /> <span className="hidden sm:inline">Your order</span>{itemCount > 0 && <span data-testid="text-cart-count" className="grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[11px] text-primary">{itemCount}</span>}</button>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
      <section className="relative overflow-hidden pb-10 pt-12 md:pb-14 md:pt-20">
        <div className="relative z-10 max-w-2xl animate-rise-in">
          <p className="font-mono-custom text-[10px] font-bold uppercase tracking-[.22em] text-accent">The Juniper Room · Since 2018</p>
          <h1 className="mt-5 font-display text-[clamp(3.2rem,9vw,7.3rem)] leading-[.88] tracking-[-.06em] text-primary">A little<br /><span className="text-accent">something</span><br />beautiful.</h1>
          <p className="mt-7 max-w-md text-[15px] leading-7 text-muted-foreground">Seasonal plates, slow mornings, and the kind of dinner you talk about on the walk home.</p>
        </div>
        <div className="pointer-events-none absolute -right-8 top-10 hidden h-72 w-72 rotate-12 rounded-[42%_58%_63%_37%/42%_44%_56%_58%] border-[26px] border-secondary/80 md:block" />
        <div className="pointer-events-none absolute right-28 top-28 hidden h-40 w-40 rounded-full bg-accent/15 blur-2xl md:block" />
      </section>
      <div className="menu-rule" />
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#d7c0d8] bg-[#f5edf5] px-4 py-3 text-sm text-[#614761]"><span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={14} /></span><span>{demoMode ? <>Demo Mode · ordering for <strong>Table 1</strong>. Scan a table QR to switch tables.</> : <>You're ordering for <strong>Table {table}</strong>. Everything will come straight to your table.</>}</span></div>
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => <button key={category.id} data-testid={`button-category-${category.id}`} onClick={() => setActiveCategory(category.id)} className={`focus-ring whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${selected === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary/50'}`}>{category.name}</button>)}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground md:w-64"><Search size={16} /><input data-testid="input-menu-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a dish" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70" /></label>
      </div>
      <section className="mt-8">
        {menuQuery.isLoading ? <LoadingRows count={4} /> : menuQuery.isError ? <ErrorState onRetry={() => menuQuery.refetch()} label="The menu is taking a moment." /> : categories.length === 0 ? <div data-testid="state-menu-empty" className="rounded-3xl border border-dashed border-border bg-card p-12 text-center"><Coffee className="mx-auto mb-3 text-accent" size={30} /><h2 className="font-display text-2xl">The kitchen is resetting.</h2><p className="mt-2 text-sm text-muted-foreground">Please check back in a few minutes.</p></div> : filteredCategories.map((category) => <div key={category.id} className="mb-12 animate-rise-in">
          <div className="mb-5 flex items-end justify-between"><div><p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-accent">From the kitchen</p><h2 data-testid={`heading-category-${category.id}`} className="mt-1 font-display text-3xl font-bold">{category.name}</h2></div><span className="font-mono-custom text-[11px] text-muted-foreground">{category.items.length} plates</span></div>
          {category.items.length === 0 ? <p data-testid={`state-category-empty-${category.id}`} className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground">No dishes match that search.</p> : <div className="grid gap-x-10 md:grid-cols-2">{category.items.map((item) => <article key={item.id} data-testid={`card-menu-item-${item.id}`} className={`group flex gap-4 border-b border-border/80 py-5 ${!item.isAvailable ? 'opacity-45' : ''}`}>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eee5dc] text-primary transition-transform group-hover:rotate-3"><Utensils size={20} /></div>
            <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-[19px] font-bold leading-tight">{item.name}</h3><p className="mt-1 text-[13px] leading-5 text-muted-foreground">{item.description}</p></div><span data-testid={`text-price-${item.id}`} className="shrink-0 font-mono-custom text-[13px] font-bold">{money(item.price)}</span></div><div className="mt-3 flex items-center justify-between"><span className={`text-[10px] font-bold uppercase tracking-[.15em] ${item.isVeg ? 'text-[#388268]' : 'text-muted-foreground'}`}>{item.isVeg ? 'Vegetarian' : 'Chef selection'}</span>{item.isAvailable ? <button data-testid={`button-add-item-${item.id}`} onClick={() => addItem(item)} className="focus-ring flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"><Plus size={14} /> Add</button> : <span className="text-xs font-semibold text-muted-foreground">Sold out</span>}</div></div>
          </article>)}</div>}
        </div>)}
      </section>
      <section className="mt-16 border-t border-border pt-8">
        <p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-accent">Need a hand?</p>
        <div className="mt-4 flex flex-wrap gap-2">{[['waiter', 'Call the floor team', ConciergeBell], ['water', 'More water', Coffee], ['bill', 'Bring the bill', Receipt]].map(([type, label, Icon]) => <button key={type as string} data-testid={`button-call-${type}`} onClick={() => request(type as 'waiter' | 'water' | 'bill')} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold transition-colors hover:border-accent hover:bg-[#fff3e7]"><Icon size={15} />{label as string}</button>)}</div>
      </section>
      <footer className="mt-14 flex items-center justify-between border-t border-border py-7 text-xs text-muted-foreground">
        <span>Made for slow dinners and good company.</span>
        <Link href="/login" data-testid="link-staff-login" className="font-semibold hover:text-primary">Staff Login</Link>
      </footer>
    </div>
    {notice && <div data-testid="status-menu-notice" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg">{notice}</div>}
    {cartOpen && <div className="fixed inset-0 z-40 bg-primary/35" onClick={() => setCartOpen(false)}>
      <aside onClick={(event) => event.stopPropagation()} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card p-5 shadow-2xl animate-rise-in sm:p-7">
        <div className="flex items-center justify-between"><div><p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-accent">At your table</p><h2 className="mt-1 font-display text-3xl font-bold">Your order</h2></div><button data-testid="button-close-cart" onClick={() => setCartOpen(false)} className="rounded-full bg-muted p-2"><X size={18} /></button></div>
        {ordered ? <div data-testid="state-order-success" className="flex flex-1 flex-col items-center justify-center text-center"><div className="grid h-16 w-16 place-items-center rounded-full bg-[#e2efe8] text-[#27604d]"><Check size={30} /></div><h3 className="mt-5 font-display text-3xl">Sent to the kitchen.</h3><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Order <span className="font-mono-custom font-bold">#{ordered.id.slice(-5)}</span> is in. We'll bring it over in about {ordered.estimatedMinutes || 20} minutes.</p><button data-testid="button-new-order" onClick={() => setOrdered(null)} className="mt-7 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Keep browsing</button></div> : <>{cart.length === 0 ? <div data-testid="state-cart-empty" className="flex flex-1 flex-col items-center justify-center text-center"><ShoppingBag className="text-muted-foreground/40" size={40} /><h3 className="mt-4 font-display text-2xl">Nothing on the table yet.</h3><p className="mt-2 text-sm text-muted-foreground">Add a plate or two from the menu and we'll take it from here.</p></div> : <><div className="mt-7 flex-1 space-y-4 overflow-y-auto">{cart.map((item) => <div key={item.id} data-testid={`row-cart-item-${item.id}`} className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="font-display text-lg font-bold">{item.name}</p><p className="font-mono-custom text-xs text-muted-foreground">{money(item.price)} each</p></div><div className="flex items-center gap-2 rounded-full bg-muted p-1"><button data-testid={`button-decrease-${item.id}`} onClick={() => changeQty(item.id, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-card"><Minus size={13} /></button><span className="w-4 text-center text-sm font-bold">{item.quantity}</span><button data-testid={`button-increase-${item.id}`} onClick={() => changeQty(item.id, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-card"><Plus size={13} /></button></div><span className="w-16 text-right font-mono-custom text-sm font-bold">{money(item.price * item.quantity)}</span></div>)}</div><div className="border-t border-border pt-5"><div className="flex justify-between text-sm text-muted-foreground"><span>{itemCount} items</span><span>Subtotal</span></div><div className="mt-2 flex items-center justify-between"><span className="font-display text-2xl font-bold">Total</span><span data-testid="text-cart-total" className="font-mono-custom text-xl font-bold">{money(total)}</span></div>{!table && <p className="mt-4 rounded-xl bg-[#fff3e7] p-3 text-xs leading-5 text-[#8a5b16]">This menu is in browse mode. Scan your table's QR code to place an order.</p>}<button data-testid="button-place-order" disabled={!table || createOrder.isPending} onClick={placeOrder} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">{createOrder.isPending ? 'Sending to kitchen…' : <>Place order <Send size={15} /></>}</button></div></>}</>}
      </aside>
    </div>}
  </div>;
}

function AuthPage() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<'kitchen' | 'waiter' | 'admin'>('waiter');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const enter = () => {
    if (!email.includes('@')) { setMessage('Enter a work email to continue.'); return; }
    setLocation(`/${role}`);
  };
  return <div className="min-h-[100dvh] bg-background md:grid md:grid-cols-[.9fr_1.1fr]">
    <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground md:flex md:flex-col md:justify-between"><Brand compact /><div className="relative z-10 max-w-md"><p className="font-mono-custom text-[10px] uppercase tracking-[.22em] text-secondary">The Juniper Room · staff access</p><h1 className="mt-6 font-display text-6xl font-bold leading-[.9] tracking-[-.05em]">A calm room<br /><span className="text-secondary">behind</span> the scenes.</h1><p className="mt-7 max-w-sm text-sm leading-6 text-primary-foreground/65">One clear view for every hand that keeps dinner moving.</p></div><div className="font-mono-custom text-[10px] uppercase tracking-[.18em] text-primary-foreground/40">Mise. operations / 07:42 PM</div><div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full border-[30px] border-secondary/50" /></div>
    <div className="flex items-center justify-center p-6 md:p-12"><div className="w-full max-w-md"><div className="md:hidden"><Brand /></div><div className="mt-12 md:mt-0"><p className="font-mono-custom text-[10px] uppercase tracking-[.22em] text-accent">Welcome back</p><h2 className="mt-3 font-display text-4xl font-bold">Choose your station.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in to see the part of service that belongs to you.</p></div><div className="mt-8 grid gap-3">{[['waiter', 'Floor team', 'Calls, tables, and the room', ConciergeBell], ['kitchen', 'Kitchen display', 'Orders, timing, and pass', ChefHat], ['admin', 'Control room', 'Menu, people, and pulse', Settings2]].map(([key, label, desc, Icon]) => <button key={key as string} data-testid={`button-role-${key}`} onClick={() => setRole(key as 'kitchen' | 'waiter' | 'admin')} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${role === key ? 'border-accent bg-[#fff3e7] shadow-[4px_4px_0_hsl(var(--accent))]' : 'border-border bg-card hover:border-accent/60'}`}><span className={`grid h-11 w-11 place-items-center rounded-xl ${role === key ? 'bg-primary text-secondary' : 'bg-muted text-muted-foreground'}`}><Icon size={20} /></span><span className="flex-1"><span className="block font-semibold">{label as string}</span><span className="mt-0.5 block text-xs text-muted-foreground">{desc as string}</span></span>{role === key && <Check size={17} className="text-accent" />}</button>)}</div><label className="mt-7 block text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Work email<input data-testid="input-work-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="asha@juniperroom.com" className="focus-ring mt-2 w-full rounded-xl border border-input bg-card px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground/50" /></label>{message && <p data-testid="status-auth-error" className="mt-3 text-sm font-semibold text-destructive">{message}</p>}<button data-testid="button-enter-workspace" onClick={enter} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">Enter workspace <ArrowRight size={16} /></button><Link href="/" data-testid="link-guest-menu" className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ChevronLeft size={15} /> Back to guest menu</Link></div></div>
  </div>;
}

function OrderCard({ order, onStatus }: { order: Order; onStatus: (order: Order, status: OrderStatusUpdateStatus) => void }) {
  const next: Record<string, OrderStatusUpdateStatus | undefined> = { placed: OrderStatus.preparing, preparing: OrderStatus.ready, ready: OrderStatus.served };
  const nextStatus = next[order.status];
  return <article data-testid={`card-order-${order.id}`} className="rounded-2xl border border-card-border bg-card p-4 shadow-[var(--shadow-card)]"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-mono-custom text-xs font-bold text-accent">#{order.id.slice(-5)}</span><span className="text-xs text-muted-foreground">{ago(order.createdAt)}</span></div><h3 className="mt-1 font-display text-2xl font-bold">Table {order.tableNumber}</h3></div><StatusPill status={order.status} /></div><div className="mt-4 space-y-2 border-t border-border pt-3">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span><strong>{item.quantity}×</strong> {item.name}</span>{item.instructions && <span className="truncate text-xs italic text-muted-foreground">{item.instructions}</span>}</div>)}</div><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="font-mono-custom text-sm font-bold">{money(order.total)}</span>{nextStatus && <button data-testid={`button-advance-order-${order.id}`} onClick={() => onStatus(order, nextStatus)} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><Check size={13} /> Mark {nextStatus}</button>}</div></article>;
}

function KitchenPage() {
  const ordersQuery = useListOrders();
  const updateStatus = useUpdateOrderStatus();
  const qc = useQueryClient();
  const orders = ordersQuery.data ?? [];
  const active = orders.filter((order) => ['placed', 'preparing', 'ready'].includes(order.status));
  const advance = (order: Order, status: OrderStatusUpdateStatus) => updateStatus.mutate({ id: order.id, data: { status } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }) });
  return <StaffShell role="kitchen" eyebrow="Kitchen / live queue" title="The pass">
    <div className="mx-auto max-w-[1400px]"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Orders move through here, one clear handoff at a time.</p></div><button data-testid="button-refresh-kitchen" onClick={() => ordersQuery.refetch()} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold"><RefreshCw size={14} /> Refresh queue</button></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-2xl bg-primary p-4 text-primary-foreground"><p className="font-mono-custom text-[10px] uppercase tracking-wider text-primary-foreground/60">Live orders</p><p data-testid="text-kitchen-active" className="mt-2 font-display text-4xl">{active.length}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="font-mono-custom text-[10px] uppercase tracking-wider text-muted-foreground">Placed</p><p className="mt-2 font-display text-4xl">{active.filter((o) => o.status === 'placed').length}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="font-mono-custom text-[10px] uppercase tracking-wider text-muted-foreground">On the line</p><p className="mt-2 font-display text-4xl">{active.filter((o) => o.status === 'preparing').length}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="font-mono-custom text-[10px] uppercase tracking-wider text-muted-foreground">Ready</p><p className="mt-2 font-display text-4xl">{active.filter((o) => o.status === 'ready').length}</p></div></div>
      <div className="mt-8">{ordersQuery.isLoading ? <LoadingRows count={4} /> : ordersQuery.isError ? <ErrorState onRetry={() => ordersQuery.refetch()} /> : active.length === 0 ? <div data-testid="state-kitchen-empty" className="rounded-3xl border border-dashed border-border bg-card p-14 text-center"><PackageCheck className="mx-auto text-[#388268]" size={34} /><h2 className="mt-4 font-display text-3xl">The pass is clear.</h2><p className="mt-2 text-sm text-muted-foreground">New orders will land here as soon as they come in.</p></div> : <div className="grid gap-5 lg:grid-cols-3">{[['placed', 'New tickets', 'bg-[#f5edf5]'], ['preparing', 'On the line', 'bg-[#fff3e7]'], ['ready', 'Ready to run', 'bg-[#e6f1eb]']].map(([status, label, color]) => <section key={status} className={`rounded-3xl ${color} p-4 md:p-5`}><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">{label}</h2><span className="font-mono-custom text-xs text-muted-foreground">{active.filter((o) => o.status === status).length.toString().padStart(2, '0')}</span></div><div className="space-y-3">{active.filter((o) => o.status === status).map((order) => <OrderCard key={order.id} order={order} onStatus={advance} />)}</div></section>)}</div>}</div>
    </div>
  </StaffShell>;
}

function WaiterPage() {
  const callsQuery = useListCalls();
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const updateCall = useUpdateCallStatus();
  const qc = useQueryClient();
  const calls = callsQuery.data ?? [];
  const pending = calls.filter((call) => call.status !== 'resolved');
  const update = (call: WaiterCall, status: CallStatusUpdateStatus) => updateCall.mutate({ id: call.id, data: { status } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListCallsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } });
  const callLabel = (type: string) => type === 'water' ? 'More water' : type === 'bill' ? 'Bring the bill' : 'Waiter needed';
  return <StaffShell role="waiter" eyebrow="Floor / live calls" title="Keep the room moving">
    <div className="mx-auto max-w-[1200px]"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Open calls" value={summaryQuery.data?.pendingCalls ?? pending.length} icon={Bell} tone="accent" /><Metric label="Active orders" value={summaryQuery.data?.activeOrders ?? '—'} icon={ClipboardList} /><Metric label="Free waiters" value={summaryQuery.data?.freeWaiters ?? '—'} icon={Users} /><Metric label="On the floor" value={summaryQuery.data?.busyWaiters ?? '—'} icon={Clock3} /></div><div className="mt-9 flex items-center justify-between"><div><p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-accent">Right now</p><h2 className="mt-1 font-display text-3xl font-bold">Calls from the room</h2></div><button data-testid="button-refresh-calls" onClick={() => callsQuery.refetch()} className="rounded-full border border-border bg-card p-2.5"><RefreshCw size={16} /></button></div><div className="mt-5">{callsQuery.isLoading ? <LoadingRows /> : callsQuery.isError ? <ErrorState onRetry={() => callsQuery.refetch()} /> : pending.length === 0 ? <div data-testid="state-calls-empty" className="rounded-3xl border border-dashed border-border bg-card p-14 text-center"><ConciergeBell className="mx-auto text-accent" size={32} /><h2 className="mt-4 font-display text-3xl">A quiet room.</h2><p className="mt-2 text-sm text-muted-foreground">No open requests. Enjoy the rhythm.</p></div> : <div className="grid gap-3 md:grid-cols-2">{pending.map((call) => <article data-testid={`card-call-${call.id}`} key={call.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${call.type === 'bill' ? 'bg-[#f5edf5] text-primary' : 'bg-[#fff3e7] text-accent'}`}>{call.type === 'bill' ? <Receipt size={20} /> : <Bell size={20} />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-mono-custom text-xs text-accent">{ago(call.createdAt)}</span><StatusPill status={call.status} /></div><h3 className="mt-1 font-display text-2xl font-bold">Table {call.tableNumber}</h3><p className="text-sm text-muted-foreground">{callLabel(call.type)}</p></div><div className="flex gap-2">{call.status === 'pending' && <button data-testid={`button-claim-call-${call.id}`} onClick={() => update(call, 'claimed')} className="rounded-full border border-border px-3 py-2 text-xs font-bold">Claim</button>}{call.status === 'claimed' && <button data-testid={`button-resolve-call-${call.id}`} onClick={() => update(call, 'resolved')} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={15} /></button>}</div></article>)}</div>}</div></div>
  </StaffShell>;
}

function Metric({ label, value, icon: Icon, tone = 'default' }: { label: string; value: number | string; icon: typeof Bell; tone?: 'default' | 'accent' }) {
  return <div className={`rounded-2xl border p-4 ${tone === 'accent' ? 'border-accent/30 bg-[#fff3e7]' : 'border-border bg-card'}`}><div className="flex items-center justify-between"><p className="font-mono-custom text-[10px] uppercase tracking-[.14em] text-muted-foreground">{label}</p><Icon size={16} className={tone === 'accent' ? 'text-accent' : 'text-muted-foreground'} /></div><p data-testid={`metric-${label.toLowerCase().replace(' ', '-')}`} className="mt-3 font-display text-4xl font-bold">{value}</p></div>;
}

function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'menu' | 'tables' | 'staff'>('overview');
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const menuQuery = useGetMenu();
  const ordersQuery = useListOrders();
  const callsQuery = useListCalls();
  const updateStatus = useUpdateOrderStatus();
  const qc = useQueryClient();
  const orders = ordersQuery.data ?? [];
  const tabs = [['overview', 'Overview', LayoutDashboard], ['menu', 'Menu', MenuIcon], ['tables', 'Tables', Utensils], ['staff', 'Staff', Users]] as const;
  const advance = (order: Order, status: OrderStatusUpdateStatus) => updateStatus.mutate({ id: order.id, data: { status } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }) });
  const orderNext: Record<string, OrderStatusUpdateStatus> = { placed: 'preparing', preparing: 'ready', ready: 'served' };
  return <StaffShell role="admin" eyebrow="Control room / today" title="The pulse of service">
    <div className="mx-auto max-w-[1400px]">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
        {tabs.map(([key, label, Icon]) => <button key={key} data-testid={`button-admin-tab-${key}`} onClick={() => setTab(key)} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold ${tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}><Icon size={15} />{label}</button>)}
      </div>
      {tab === 'overview' && <div className="mt-7">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Active orders" value={summaryQuery.data?.activeOrders ?? '—'} icon={ClipboardList} />
          <Metric label="Pending calls" value={summaryQuery.data?.pendingCalls ?? '—'} icon={Bell} tone="accent" />
          <Metric label="Free waiters" value={summaryQuery.data?.freeWaiters ?? '—'} icon={Users} />
          <Metric label="Busy waiters" value={summaryQuery.data?.busyWaiters ?? '—'} icon={Clock3} />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center justify-between"><div><p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-accent">Live ledger</p><h2 className="mt-1 font-display text-2xl font-bold">Recent orders</h2></div><button data-testid="button-refresh-admin" onClick={() => { ordersQuery.refetch(); callsQuery.refetch(); summaryQuery.refetch(); }} className="rounded-full border border-border p-2"><RefreshCw size={15} /></button></div>
            <div className="mt-4 space-y-2">
              {ordersQuery.isLoading ? <LoadingRows count={3} /> : orders.length === 0 ? <p data-testid="state-admin-orders-empty" className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Orders will appear here during service.</p> : orders.slice(0, 6).map((order) => <div key={order.id} data-testid={`row-admin-order-${order.id}`} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"><span className="font-mono-custom text-xs text-accent">#{order.id.slice(-5)}</span><span className="flex-1 text-sm font-semibold">Table {order.tableNumber} <span className="font-normal text-muted-foreground">· {order.items.length} items</span></span><StatusPill status={order.status} /><button data-testid={`button-admin-advance-${order.id}`} disabled={!orderNext[order.status]} onClick={() => orderNext[order.status] && advance(order, orderNext[order.status])} className="rounded-full p-1.5 text-muted-foreground hover:bg-card disabled:opacity-30"><ChevronDown size={15} /></button></div>)}
            </div>
          </section>
          <section className="rounded-3xl bg-primary p-6 text-primary-foreground"><p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-secondary">Room snapshot</p><h2 className="mt-2 font-display text-3xl font-bold">A good night<br />has a rhythm.</h2><div className="mt-8 space-y-4 border-t border-primary-foreground/15 pt-5"><div className="flex justify-between text-sm"><span className="text-primary-foreground/60">Open calls</span><strong>{callsQuery.data?.filter((c) => c.status !== 'resolved').length ?? 0}</strong></div><div className="flex justify-between text-sm"><span className="text-primary-foreground/60">Plates in motion</span><strong>{orders.filter((o) => ['placed', 'preparing'].includes(o.status)).length}</strong></div><div className="flex justify-between text-sm"><span className="text-primary-foreground/60">Menu categories</span><strong>{menuQuery.data?.length ?? 0}</strong></div></div></section>
        </div>
      </div>}
      {tab === 'menu' && <AdminMenu menuQuery={menuQuery} />}
      {tab === 'tables' && <UnavailablePanel icon={Utensils} title="Tables are ready for service." text="Table layout and QR assignments will appear here when the floor map is connected." action="Table management" />}
      {tab === 'staff' && <UnavailablePanel icon={Users} title="Your people, in one place." text="Staff roles and shift assignments are ready for the roster connection." action="Staff management" />}
    </div>
  </StaffShell>;
}

function AdminMenu({ menuQuery }: { menuQuery: { data?: MenuCategory[]; isLoading: boolean; isError: boolean; refetch: () => unknown } }) {
  const categories = menuQuery.data ?? [];
  return <div className="mt-7"><div className="flex items-end justify-between"><div><p className="font-mono-custom text-[10px] uppercase tracking-[.2em] text-accent">Published menu</p><h2 className="mt-1 font-display text-3xl font-bold">What guests see</h2></div><Link href="/" data-testid="link-menu-preview" className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold">Preview <ArrowRight size={14} /></Link></div>{menuQuery.isLoading ? <div className="mt-6"><LoadingRows count={4} /></div> : menuQuery.isError ? <div className="mt-6"><ErrorState onRetry={() => menuQuery.refetch()} /></div> : <div className="mt-6 grid gap-5 md:grid-cols-2">{categories.map((category) => <section key={category.id} data-testid={`card-admin-category-${category.id}`} className="rounded-3xl border border-border bg-card p-5"><div className="flex items-center justify-between"><h3 className="font-display text-2xl font-bold">{category.name}</h3><span className="font-mono-custom text-xs text-muted-foreground">{category.items.length} items</span></div><div className="mt-4 space-y-2">{category.items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-card text-accent"><Utensils size={14} /></span><span className="flex-1 text-sm font-semibold">{item.name}</span><span className="font-mono-custom text-xs">{money(item.price)}</span><span className={`h-2 w-2 rounded-full ${item.isAvailable ? 'bg-[#52a77d]' : 'bg-destructive'}`} /></div>)}</div></section>)}</div>}</div>;
}

function UnavailablePanel({ icon: Icon, title, text, action }: { icon: typeof Users; title: string; text: string; action: string }) {
  return <div data-testid="state-feature-empty" className="mt-7 rounded-3xl border border-dashed border-border bg-card p-14 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-accent"><Icon size={26} /></span><h2 className="mt-5 font-display text-3xl font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{text}</p><button data-testid={`button-${action.toLowerCase().replace(' ', '-')}`} disabled className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground opacity-45">{action} · soon</button></div>;
}

function Router() {
  return <ErrorBoundary><Switch><Route path="/" component={MenuPage} /><Route path="/login" component={AuthPage} /><Route path="/kitchen" component={KitchenPage} /><Route path="/waiter" component={WaiterPage} /><Route path="/admin" component={AdminPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;