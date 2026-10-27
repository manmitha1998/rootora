import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-to-a-long-random-secret";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "products.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const starterProducts = [
  { id: "p1", name: "Farm Fresh Tomatoes", category: "Vegetables", price: 35, unit: "per kg", description: "Juicy seasonal tomatoes sourced from nearby growers.", emoji: "🍅", color: "peach", available: true },
  { id: "p2", name: "Leafy Greens", category: "Vegetables", price: 25, unit: "per bunch", description: "Fresh greens for everyday home cooking.", emoji: "🥬", color: "green", available: true },
  { id: "p3", name: "Seasonal Mangoes", category: "Fruits", price: 120, unit: "per kg", description: "Seasonal fruit, available while the harvest lasts.", emoji: "🥭", color: "yellow", available: true },
  { id: "p4", name: "Farm Eggs", category: "Farm Staples", price: 90, unit: "per 6", description: "A handy farm staple for your kitchen.", emoji: "🥚", color: "cream", available: true },
  { id: "p5", name: "Country Groundnuts", category: "Grains & Pulses", price: 85, unit: "per kg", description: "Locally sourced groundnuts for snacks and cooking.", emoji: "🥜", color: "peach", available: true },
  { id: "p6", name: "Fresh Coriander", category: "Herbs", price: 15, unit: "per bunch", description: "A fragrant finishing touch for your meals.", emoji: "🌿", color: "green", available: true }
];

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(starterProducts, null, 2), "utf8");
  }
}
function readProducts() {
  ensureDataFile();
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return starterProducts; }
}
function writeProducts(products) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf8");
}
function requireAdmin(req, res, next) {
  const provided = req.get("x-admin-key") || "";
  if (ADMIN_KEY === "change-this-to-a-long-random-secret") {
    return res.status(503).json({ error: "Set a private ADMIN_KEY in your .env file before using product management." });
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(ADMIN_KEY);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Admin key is incorrect." });
  }
  next();
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", storage: "local-json", message: "Rootora API is running." }));
app.get("/api/products", (_req, res) => {
  const products = readProducts().filter(p => p.available);
  res.json(products);
});
app.get("/api/admin/products", requireAdmin, (_req, res) => res.json(readProducts()));
app.post("/api/admin/products", requireAdmin, (req, res) => {
  const { name, category, price, unit, description, emoji, color, available } = req.body || {};
  if (!String(name || "").trim() || !String(category || "").trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: "Name, category and a valid non-negative price are required." });
  }
  const products = readProducts();
  const product = {
    id: crypto.randomUUID(),
    name: String(name).trim().slice(0, 90),
    category: String(category).trim().slice(0, 50),
    price: Number(price),
    unit: String(unit || "per item").trim().slice(0, 30),
    description: String(description || "").trim().slice(0, 240),
    emoji: String(emoji || "🌱").slice(0, 8),
    color: ["green", "yellow", "peach", "cream"].includes(color) ? color : "green",
    available: available !== false
  };
  products.unshift(product);
  writeProducts(products);
  res.status(201).json(product);
});
app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "Product not found." });
  const current = products[index];
  const next = { ...current, ...req.body, id: current.id };
  next.name = String(next.name || "").trim().slice(0, 90);
  next.category = String(next.category || "").trim().slice(0, 50);
  next.price = Number(next.price);
  if (!next.name || !next.category || !Number.isFinite(next.price) || next.price < 0) {
    return res.status(400).json({ error: "Name, category and a valid non-negative price are required." });
  }
  if (!["green", "yellow", "peach", "cream"].includes(next.color)) next.color = "green";
  next.available = next.available !== false;
  products[index] = next;
  writeProducts(products);
  res.json(next);
});
app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const products = readProducts();
  const next = products.filter(p => p.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ error: "Product not found." });
  writeProducts(next);
  res.status(204).end();
});

const clientDist = path.join(__dirname, "..", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
  app.get("/", (_req, res) => res.send("Rootora API is running. Start the Vite client with `npm run client` for the website."));
}

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`Rootora API listening on http://localhost:${PORT}`);
});