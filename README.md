# BiteBlitz Food Delivery Application 🍔🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Support](https://img.shields.io/badge/docker-containerized-028bb8)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![NodeJS](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**BiteBlitz** is a full-stack, real-time food delivery platform featuring an enterprise-grade architecture. Built using the **MERN** stack (MongoDB, Express.js, React.js, Node.js), this platform offers seamless operations for Customers, Administrators, and Kitchen Staff. 

This project goes far beyond a standard student portfolio application by integrating robust security measures, real-time WebSockets, automated email notifications, and an advanced payment architecture using Stripe Native Webhooks.

---

## 🌟 Key Features

### 1. Enterprise-Grade Security & Authentication
- **JWT & Refresh Token Rotation:** Highly secure session management ensuring users stay logged in without exposing long-lived access tokens.
- **XSS & NoSQL Injection Protection:** Hardened backend using `express-mongo-sanitize` and `xss-filters` to physically block malicious database injections and sanitize payloads.
- **Cryptographic Password Resets:** Secure 1-hour expiry tokens that automatically email users password-reset links using **Nodemailer**.

### 2. Real-Time Order Tracking (WebSockets)
- Integrated **Socket.io** to provide users with split-second, real-time UI updates on their order statuses (e.g., transitioning from "Processing" to "Out for Delivery").
- Implemented a live **Delivery ETA Countdown Timer** synced precisely with timestamps generated on the Node.js server.

### 3. Advanced Payment & Cart Architecture
- **Stripe Webhooks:** Replaced easily exploitable return URLs with true, cryptographically verified Stripe Webhooks. This guarantees users actually completed payments before marking orders as verified in the DB.
- **Cash on Delivery (COD) Flow:** Built an alternative checkout logic routing around Stripe, gracefully flagging the order for Admins to Collect Cash.
- **Dynamic Coupon & Promo System:** Fully functional code logic that securely calculates percentages and flat-rate discounts on the backend, mitigating frontend price-tampering exploits.

### 4. Application Performance & UX Polish
- **Skeleton Loaders:** Elegant CSS-animated pulsing placeholders that seamlessly display while waiting for database queries, eliminating jarring layout-shifts on slow network connections.
- **Infinite MongoDB Pagination:** Optimized Order History fetching algorithms using Mongoose `.skip()` and `.limit()` variables to query subsets of items sequentially (Load More).
- **Rapid Reorder Engine:** A lightning-fast "Order Again" button that overrides the global Context and bulk-injects historical Mongo arrays straight back into the live checkout cart.
- **Offline Error Boundaries:** Custom Window Event Listeners that actively detect lost Wi-Fi connections, warning the user gracefully with a Toast UI overlay.

### 5. Backend Tooling & Data Handling
- **Automated PDF Invoice Generation:** Node.js seamlessly writes, formats, and attaches PDF receipts onto Stripe Confirmations during the checkout pipeline using `pdfkit`.
- **Image Optimization Engine:** Built-in `sharp` bindings intercept and shrink every Administrator Food Image upload natively down to high-efficiency WebP files before executing the disk writes.
- **Omnichannel Support:** Support for Twilio SMS notifications and Google Places API autocomplete bindings for flawless coordinate routing during checkout.

---

## 🛠️ Technology Stack

- **Frontend Application (Customer View):** React LTS, Vite, Axios, React-Router-DOM, React Context API, WebSockets.
- **Administrator Panel:** React LTS, Vite, Axios, WebSockets.
- **Backend API & Server:** Node.js, Express.js, MongoDB (Mongoose), Socket.io.
- **In-Memory Cache (Optional):** Redis for blazing-fast menu load times.
- **Payment Gateway:** Stripe API (w/ HMAC Signature Webhooks).
- **Security Protocols:** JSON Web Tokens (JWT), bcrypt-password hashes, Express-Rate-Limit.

---

## 🚀 Getting Started & Installation

You can run this project locally via `NPM` or entirely virtually via `Docker`.

### Option A: Local Installation (Manual)

**1. Clone the repository**
```bash
git clone https://github.com/your-username/BiteBlitz.git
cd BiteBlitz
```

**2. Setup Environment Variables**
Navigate inside the `/backend` folder. Create a `.env` file and configure it using the provided `.env.example` file.
```env
JWT_SECRET=your_super_secret_jwt_string
JWT_REFRESH_SECRET=your_refresh_secret
STRIPE_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb+srv://...

# Nodemailer setup for password resets
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password
```

**3. Install Dependencies & Start the Backend**
```bash
cd backend
npm install
npm run server  # Starts Express on port 4000
```

**4. Start the Frontend Application**
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev     # Starts Vite on port 5173
```

**5. Start the Admin Dashboard**
Open a third terminal window:
```bash
cd admin
npm install
npm run dev     # Starts Vite on port 5174
```

### Option B: Docker Containerization
If you prefer Docker, you can instantly spin up all three layers (MongoDB, Backend, Frontends) with a single command. Update your `/backend/.env` file with the keys, then run:

```bash
docker-compose up --build -d
```

- **Frontend App:** `http://localhost:5173`
- **Admin App:** `http://localhost:5174`
- **Backend API:** `http://localhost:4000`

---

## 📖 API Documentation & Endpoints

BiteBlitz features an extensive REST API. The core routing modules include:

| Route Prefix | Purpose | Security |
| :--- | :--- | :--- |
| `/api/user/` | Registration, Login, Resets, 2FA, Refresh Tokens | Public / JWT Protected |
| `/api/food/` | Viewing the Menu, Admin CRUD operations | Public / Admin Only |
| `/api/cart/` | Cart state synchronization, Infinite Loading | JWT Protected |
| `/api/order/` | Stripe Webhooks, Order Placing, Order Tracking | JWT Protected |
| `/api/coupon/` | Validating Promos | Public |

*(Note: Ensure you include your JWT in the `token` header for all protected endpoints!)*

---

## 🤝 Contributing

This application is structurally mature, but Pull Requests are always welcome! Whether it's adding a new Payment Gateway or creating an advanced Recommendation Engine in Python—feel free to fork and open a PR.

## 📝 License

This software is supplied under the MIT License.
