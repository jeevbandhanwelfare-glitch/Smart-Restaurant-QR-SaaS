import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";

type MenuItem = {
  id: string; name: string; description: string; price: number;
  isVeg: boolean; isAvailable: boolean; emoji: string;
};
type MenuCategory = { id: string; name: string; items: MenuItem[] };
type OrderItem = { id: string; name: string; price: number; quantity: number; instructions: string; isVeg: boolean };
type Order = { id: string; tableNumber: number; status: string; items: OrderItem[]; total: number; createdAt: string; estimatedMinutes: number };
type WaiterCall = { id: string; tableNumber: number; type: string; status: string; createdAt: string };

const menu: MenuCategory[] = [
  { id: "begin", name: "To begin", items: [
    { id: "corn", name: "Charred corn ribs", description: "Smoky lime butter, toasted cumin", price: 9.5, isVeg: true, isAvailable: true, emoji: "✦" },
    { id: "paneer", name: "Paneer tikka", description: "Tandoor-charred paneer, mint chutney", price: 12, isVeg: true, isAvailable: true, emoji: "◆" },
    { id: "wings", name: "Tandoori wings", description: "Kashmiri chilli, cooling raita", price: 13, isVeg: false, isAvailable: true, emoji: "●" },
  ] },
  { id: "tandoor", name: "From the tandoor", items: [
    { id: "fish", name: "Tandoori salmon", description: "Ajwain, pickled cucumber, dill", price: 21, isVeg: false, isAvailable: true, emoji: "◌" },
    { id: "mushroom", name: "Tandoori mushrooms", description: "Garlic, kasuri methi, sesame", price: 15, isVeg: true, isAvailable: true, emoji: "◇" },
  ] },
  { id: "mains", name: "Mains", items: [
    { id: "butter", name: "Butter chicken", description: "Tomato, fenugreek, cultured cream", price: 18, isVeg: false, isAvailable: true, emoji: "●" },
    { id: "dal", name: "Dal makhani", description: "Slow-cooked black lentils, smoked butter", price: 14, isVeg: true, isAvailable: true, emoji: "◈" },
    { id: "kofta", name: "Malai kofta", description: "Cashew curry, cardamom, soft herbs", price: 16, isVeg: true, isAvailable: true, emoji: "◆" },
  ] },
  { id: "bread", name: "Breads & rice", items: [
    { id: "naan", name: "Garlic naan", description: "Clay oven, garlic, coriander", price: 5, isVeg: true, isAvailable: true, emoji: "≈" },
    { id: "rice", name: "Saffron basmati", description: "Steamed rice, toasted cashews", price: 6, isVeg: true, isAvailable: true, emoji: "✦" },
  ] },
  { id: "sweet", name: "Sweet finish", items: [
    { id: "kulfi", name: "Mango kulfi", description: "Saffron, pistachio, rose", price: 7, isVeg: true, isAvailable: true, emoji: "◇" },
    { id: "gulab", name: "Gulab jamun", description: "Warm cardamom dumplings, vanilla cream", price: 7, isVeg: true, isAvailable: true, emoji: "●" },
  ] },
];

const orders: Order[] = [];
const calls: WaiterCall[] = [];
const restaurantRouter: IRouter = Router();

restaurantRouter.get("/menu", (_req, res) => res.json(menu));
restaurantRouter.get("/orders", (_req, res) => res.json(orders.slice(-30).reverse()));
restaurantRouter.post("/orders", (req, res) => {
  const input = req.body as { tableNumber?: number; items?: OrderItem[] };
  if (!Number.isFinite(input.tableNumber) || !Array.isArray(input.items) || input.items.length === 0) {
    res.status(400).json({ error: "A table number and at least one item are required." }); return;
  }
  const order: Order = {
    id: `ORD-${String(orders.length + 104).padStart(3, "0")}`,
    tableNumber: Number(input.tableNumber),
    status: "placed",
    items: input.items,
    total: input.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    createdAt: new Date().toISOString(),
    estimatedMinutes: 20,
  };
  orders.push(order);
  res.status(201).json(order);
});
restaurantRouter.patch("/orders/:id/status", (req, res) => {
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) { res.status(404).json({ error: "Order not found." }); return; }
  order.status = String(req.body.status);
  if (req.body.estimatedMinutes) order.estimatedMinutes = Number(req.body.estimatedMinutes);
  res.json(order);
});
restaurantRouter.get("/calls", (_req, res) => res.json(calls.slice(-30).reverse()));
restaurantRouter.post("/calls", (req, res) => {
  const call: WaiterCall = {
    id: randomUUID(), tableNumber: Number(req.body.tableNumber), type: String(req.body.type),
    status: "pending", createdAt: new Date().toISOString(),
  };
  calls.push(call); res.status(201).json(call);
});
restaurantRouter.patch("/calls/:id/status", (req, res) => {
  const call = calls.find((item) => item.id === req.params.id);
  if (!call) { res.status(404).json({ error: "Call not found." }); return; }
  call.status = String(req.body.status); res.json(call);
});
restaurantRouter.get("/dashboard/summary", (_req, res) => res.json({
  activeOrders: orders.filter((order) => ["placed", "preparing", "ready"].includes(order.status)).length,
  pendingCalls: calls.filter((call) => call.status === "pending").length,
  freeWaiters: 2, busyWaiters: 1,
}));

export default restaurantRouter;