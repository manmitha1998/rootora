# Rootora — Farm to Home (Dynamic Catalogue)

A responsive React + Vite website with an Express API, a product catalogue, search and category filters, a basket, WhatsApp order messages, and a simple admin product manager.

## Features
- Home, Our Story, Products, Contact sections
- Bright green, cream, white and orange palette
- Mobile-responsive layout
- Product list served from a backend API
- Search and category filters
- Basket with quantity controls and estimated subtotal
- WhatsApp order enquiry/checkout; customers confirm stock, delivery charge and payment directly
- Admin product manager: add, edit, hide/show, delete products
- Local JSON storage to make initial setup easy; no database account is required to run locally

## Requirements
- Node.js 20 or newer (LTS recommended)
- npm (included with Node.js)
- Internet connection for Google Fonts and remote photos

## Run locally on Windows
1. Extract the `rootora-dynamic-website.zip` file.
2. Open PowerShell in the extracted `rootora-dynamic` folder.
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Create your environment file by copying `.env.example` to `.env`.
   In PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Open `.env` and replace `ADMIN_KEY` with a long, private secret. Do not share this key or commit `.env` to a public repository.
6. Start frontend and backend together:
   ```powershell
   npm run dev
   ```
7. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.
   The API runs at `http://localhost:4000`.

The first server run creates `server/data/products.json` with sample products. You can edit the catalogue in the website footer using **Product manager**. Enter the same `ADMIN_KEY` value from `.env`.

## WhatsApp setup
The configured WhatsApp number is `918790471819` (country code + number, digits only). To change it, edit `VITE_WHATSAPP_NUMBER` in `.env` and restart Vite. The site creates WhatsApp links with pre-filled messages. WhatsApp opens outside the website; the customer sends the message manually.

## Production build
Build the React site:
```powershell
npm run build
```
Start the Express server to serve the built site and API:
```powershell
npm start
```
The production server listens on port 4000 by default. Configure your hosting platform to run `npm start` and set `ADMIN_KEY` as a private environment variable.

## Important deployment notes
- This project is not deployed by creating these files. You still need to choose hosting and deploy it.
- The initial product storage is a local JSON file. It is suitable for local development and a small demonstration, but many serverless hosts have ephemeral filesystems and this is not suitable for multi-admin or reliable production inventory. Use persistent hosting storage or migrate products to Supabase/Postgres before production.
- The admin manager uses a shared secret in an HTTP header. This is a lightweight starter for a trusted owner on a controlled deployment, not a full user-account system. For a public production store, implement proper authentication (for example Supabase Auth), server-side rate limiting, HTTPS and database policies. Never put a Supabase service-role key in frontend code.
- Prices and products are sample placeholders. Verify all prices, units, availability and delivery fees before accepting orders.
- No online payments are collected. Payment and delivery are confirmed directly with the customer over WhatsApp.

## Project structure
```text
rootora-dynamic/
  index.html
  package.json
  vite.config.js
  .env.example
  src/
    App.jsx
    main.jsx
    styles.css
  server/
    index.js
  README.md
```
