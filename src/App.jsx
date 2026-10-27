import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Leaf, Menu, MessageCircle, Minus, Plus, Search, ShoppingBag, Sprout, X } from "lucide-react";

const WA_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "918790471819";
const categories = ["All products", "Vegetables", "Fruits", "Grains & Pulses", "Farm Staples", "Herbs"];
const money = value => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function whatsappLink(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function ProductVisual({ product }) {
  return <div className={`product-visual visual-${product.color || "green"}`}>
    <span className="visual-spark">✳</span>
    <span className="product-emoji" aria-hidden="true">{product.emoji || "🌱"}</span>
    <span className="visual-leaf"><Leaf size={28} /></span>
  </div>;
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All products");
  const [cart, setCart] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminError, setAdminError] = useState("");
  const [form, setForm] = useState({ name: "", category: "Vegetables", price: "", unit: "per kg", description: "", emoji: "🌱", color: "green", available: true });
  const [editingId, setEditingId] = useState(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Could not load products.");
      setProducts(await response.json());
    } catch {
      setNotice("Can't connect to the product server. Start it with the setup steps in README.md.");
    } finally { setLoading(false); }
  }
  useEffect(() => { loadProducts(); }, []);

  const visibleProducts = useMemo(() => products.filter(p => {
    const matchesCategory = category === "All products" || p.category === category;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  }), [products, category, search]);

  const cartItems = useMemo(() => products.filter(p => cart[p.id]).map(p => ({ ...p, quantity: cart[p.id] })), [products, cart]);
  const totalItems = cartItems.reduce((sum, p) => sum + p.quantity, 0);
  const subtotal = cartItems.reduce((sum, p) => sum + p.price * p.quantity, 0);

  function changeQty(id, delta) {
    setCart(current => {
      const next = { ...current };
      const value = (next[id] || 0) + delta;
      if (value <= 0) delete next[id]; else next[id] = value;
      return next;
    });
  }
  function sendCartOrder() {
    if (!cartItems.length) { setNotice("Add a product to your basket first."); return; }
    const lines = cartItems.map(p => `• ${p.name} × ${p.quantity} (${money(p.price * p.quantity)})`);
    const message = `Hello Rootora! I'd like to place an order:\n\n${lines.join("\n")}\n\nEstimated subtotal: ${money(subtotal)}\n\nPlease confirm availability, delivery charges and payment options for my area.`;
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  }
  function enquire(product) {
    const message = `Hello Rootora! I'd like to order ${product.name} (${money(product.price)} ${product.unit}). Please confirm today's availability and delivery.`;
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
  }
  async function adminRequest(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", "x-admin-key": adminKey, ...(options.headers || {}) } });
    if (!response.ok) {
      let message = "Request failed.";
      try { message = (await response.json()).error || message; } catch {}
      throw new Error(message);
    }
    if (response.status === 204) return null;
    return response.json();
  }
  async function loginAdmin(event) {
    event.preventDefault(); setAdminError("");
    try {
      const data = await adminRequest("/api/admin/products");
      setAdminProducts(data); setAdminAuthed(true);
    } catch (error) { setAdminError(error.message); }
  }
  function resetForm() {
    setForm({ name: "", category: "Vegetables", price: "", unit: "per kg", description: "", emoji: "🌱", color: "green", available: true });
    setEditingId(null);
  }
  function editProduct(product) {
    setForm({ ...product, price: String(product.price) }); setEditingId(product.id);
    document.getElementById("admin-product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function saveProduct(event) {
    event.preventDefault(); setAdminError("");
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingId) await adminRequest(`/api/admin/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      else await adminRequest("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
      const data = await adminRequest("/api/admin/products");
      setAdminProducts(data); await loadProducts(); resetForm(); setNotice("Product saved successfully.");
    } catch (error) { setAdminError(error.message); }
  }
  async function removeProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await adminRequest(`/api/admin/products/${id}`, { method: "DELETE" });
      setAdminProducts(await adminRequest("/api/admin/products")); await loadProducts();
    } catch (error) { setAdminError(error.message); }
  }
  async function toggleAvailability(product) {
    try {
      await adminRequest(`/api/admin/products/${product.id}`, { method: "PUT", body: JSON.stringify({ ...product, available: !product.available }) });
      setAdminProducts(await adminRequest("/api/admin/products")); await loadProducts();
    } catch (error) { setAdminError(error.message); }
  }

  return <div className="app-shell">
    <div className="announcement"><Sprout size={14} /> Good food, grown with care <span>✳</span> Locally sourced, thoughtfully brought home</div>
    <header className="header">
       <a
  href="#home"
  className="brand"
  onClick={() => setMenuOpen(false)}
>
  <img
    src="/Rootora.png"
    alt="Rootora - Farm to Home"
    className="brand-logo-image"
  />
</a>
      <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <a href="#home" onClick={() => setMenuOpen(false)}>Home</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><a href="#products" onClick={() => setMenuOpen(false)}>Products</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        <button className="nav-order" onClick={sendCartOrder}><ShoppingBag size={16} /> Basket <span>{totalItems}</span></button>
      </nav>
    </header>

    <main>
      <section className="hero wrap" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-star">✳</span> A LITTLE CLOSER TO NATURE</div>
          <h1>Good things<br />grow <em>closer.</em></h1>
          <p>Discover locally sourced farm products, selected with care and made for the everyday moments that make a home.</p>
          <div className="hero-buttons"><a className="button primary" href="#products">Explore products <ArrowRight size={17} /></a><a className="quiet-link" href="#story">Our Rootora story <ArrowDownRight size={16} /></a></div>
          <div className="hero-trust"><span className="trust-icon"><Check size={17} /></span><span><strong>Farm goodness, made simple</strong><small>Local picks. Friendly service. Easy ordering.</small></span></div>
        </div>
        <div className="hero-art">
          <div className="hero-photo" role="img" aria-label="Fresh vegetables and farm produce"></div>
          <div className="hero-sticker"><span>from the farm</span><strong>with ♥</strong></div>
          <div className="sun-doodle">✳</div>
          <div className="fresh-card"><span className="fresh-leaf"><Leaf size={22} /></span><span><strong>Freshly picked</strong><small>Rooted in care</small></span></div>
        </div>
      </section>

      <section className="promise"><div><span>✳</span> Locally sourced</div><div><span>♡</span> Selected with care</div><div><span>⌂</span> Local delivery</div></section>

      <section className="story wrap" id="story">
        <div className="story-image"><div className="story-photo"></div><div className="story-note"><small>THE ROOTORA WAY</small><strong>Goodness from<br />root to home.</strong></div></div>
        <div className="story-copy"><div className="eyebrow">OUR STORY</div><h2>Rooted in nature.<br /><em>Made for home.</em></h2><p>Rootora is built around a simple idea: make it easier to discover locally sourced farm products for everyday life.</p><p>We believe in thoughtful choices, seasonal goodness and keeping the connection between local growers and homes feeling personal.</p><a href="#products" className="text-link">Discover our picks <ArrowUpRight size={16} /></a></div>
      </section>

      <section className="catalog-section" id="products">
        <div className="wrap">
          <div className="catalog-heading"><div><div className="eyebrow">FROM LOCAL FARMS</div><h2>Good things for<br className="mobile-break" /> your basket.</h2></div><p>Our product selection changes with availability.<br /><span>Message us to confirm today's stock.</span></p></div>
          <div className="catalog-tools"><div className="search-box"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farm products..." aria-label="Search products" /></div><div className="category-scroll">{categories.map(c => <button key={c} className={category === c ? "category-pill active" : "category-pill"} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
          {loading ? <div className="state-message">Gathering farm-fresh picks…</div> : visibleProducts.length ? <div className="product-grid">{visibleProducts.map(product => <article className="product-card" key={product.id}>
            <ProductVisual product={product} />
            <div className="product-content"><div className="product-category">{product.category}</div><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><div className="price">{money(product.price)} <small>{product.unit}</small></div><button className="add-button" onClick={() => changeQty(product.id, 1)} aria-label={`Add ${product.name} to basket`}><Plus size={17} /></button></div>
              {cart[product.id] ? <div className="quantity-row"><span>In your basket</span><div className="quantity-controls"><button onClick={() => changeQty(product.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><strong>{cart[product.id]}</strong><button onClick={() => changeQty(product.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div> : <button className="enquire-link" onClick={() => enquire(product)}><MessageCircle size={14} /> Ask / order on WhatsApp</button>}
            </div>
          </article>)}</div> : <div className="state-message">No products match your search. Try another category.</div>}
          <div className="catalog-footer"><span>Need something specific? We may be able to source it.</span><a className="button outline" href={whatsappLink("Hello Rootora! I'd like to ask about locally sourced farm products.")} target="_blank" rel="noreferrer">Ask Rootora <ArrowUpRight size={16} /></a></div>
        </div>
      </section>

      <section className="values wrap"><div className="values-heading"><div className="eyebrow">WHY ROOTORA</div><h2>Small choices.<br /><em>Good living.</em></h2></div><div className="value"><span>🌱</span><h3>Close to the source</h3><p>We celebrate local growers and the goodness of farm-sourced products.</p></div><div className="value"><span>♡</span><h3>Chosen thoughtfully</h3><p>A considered selection for everyday meals and moments at home.</p></div><div className="value"><span>☀</span><h3>Easy to order</h3><p>Ask questions and place orders directly through WhatsApp.</p></div></section>

      <section className="contact" id="contact"><div className="contact-inner wrap"><div><div className="eyebrow light">LET'S TALK GOODNESS</div><h2>Your farm-to-home<br />journey starts <em>here.</em></h2><p>Ask about today's products, prices or delivery to your area. We're happy to help.</p></div><div className="contact-card"><div className="contact-icon"><MessageCircle size={25} /></div><h3>Let's chat on WhatsApp</h3><p>Product enquiries, availability and orders — all in one friendly chat.</p><a className="button orange" href={whatsappLink("Hello Rootora! I'd like to enquire about your products and local delivery.")} target="_blank" rel="noreferrer">Message Rootora <ArrowUpRight size={16} /></a><small>Farm to Home, with care.</small></div></div></section>
    </main>

    <footer className="footer"><div className="footer-main wrap"><a href="#home" className="brand">
  <img
    src="/Rootora.png"
    alt="Rootora - Farm to Home"
    className="brand-logo-image"
  />
</a><p>Goodness from local farms,<br />thoughtfully brought home.</p><div className="footer-links"><a href="#home">Home</a><a href="#story">Our story</a><a href="#products">Products</a><a href="#contact">Contact</a><button onClick={() => { setAdminOpen(true); setAdminError(""); }}>Product manager</button></div></div><div className="footer-bottom wrap"><span>© {new Date().getFullYear()} Rootora. All rights reserved.</span><span>Grown with care <b>♥</b></span></div></footer>

    {totalItems > 0 && <div className="basket-bar"><div><ShoppingBag size={19} /><span><strong>{totalItems} {totalItems === 1 ? "item" : "items"}</strong><small>Estimated subtotal {money(subtotal)}</small></span></div><button onClick={sendCartOrder}>Order on WhatsApp <ArrowUpRight size={16} /></button></div>}
    <a className="whatsapp-float" href={whatsappLink("Hello Rootora! I'd like to place an order.")} target="_blank" rel="noreferrer" aria-label="Chat with Rootora on WhatsApp"><MessageCircle size={25} /></a>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button></div>}

    {adminOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setAdminOpen(false); }}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-title">
        <div className="admin-top"><div><div className="eyebrow">ROOTORA TOOLS</div><h2 id="admin-title">Product manager</h2><p>Update your product catalogue.</p></div><button className="icon-button" onClick={() => setAdminOpen(false)} aria-label="Close product manager"><X /></button></div>
        {!adminAuthed ? <form className="admin-login" onSubmit={loginAdmin}><label>Admin key<input value={adminKey} onChange={e => setAdminKey(e.target.value)} type="password" required placeholder="Enter the ADMIN_KEY from .env" /></label><button className="button primary" type="submit">Unlock manager <ArrowRight size={16} /></button><p className="helper">Set a private ADMIN_KEY in your server's .env file first.</p></form> : <>
          <form id="admin-product-form" className="product-form" onSubmit={saveProduct}>
            <div className="form-heading"><h3>{editingId ? "Edit product" : "Add a product"}</h3>{editingId && <button type="button" className="plain-button" onClick={resetForm}>Cancel edit</button>}</div>
            <div className="form-grid"><label>Product name<input required maxLength="90" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fresh spinach" /></label><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.filter(c => c !== "All products").map(c => <option key={c}>{c}</option>)}</select></label><label>Price (₹)<input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="40" /></label><label>Unit<input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="per kg" /></label><label>Emoji<input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} maxLength="8" /></label><label>Card colour<select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}><option value="green">Green</option><option value="yellow">Yellow</option><option value="peach">Peach</option><option value="cream">Cream</option></select></label></div>
            <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2" maxLength="240" placeholder="Short product description" /></label>
            <label className="availability-check"><input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} /> Available for customers</label>
            <button className="button primary submit-product" type="submit">{editingId ? "Save changes" : "Add product"} <Check size={16} /></button>
          </form>
          <div className="admin-list"><h3>Current products ({adminProducts.length})</h3>{adminProducts.map(p => <div className="admin-product-row" key={p.id}><span className="admin-emoji">{p.emoji}</span><span className="admin-product-name"><strong>{p.name}</strong><small>{money(p.price)} · {p.available ? "Available" : "Hidden"}</small></span><button onClick={() => editProduct(p)} className="plain-button">Edit</button><button onClick={() => toggleAvailability(p)} className="plain-button">{p.available ? "Hide" : "Show"}</button><button onClick={() => removeProduct(p.id)} className="delete-button">Delete</button></div>)}</div>
        </>}
        {adminError && <div className="admin-error" role="alert">{adminError}</div>}
      </section>
    </div>}
  </div>;
}

export default App;