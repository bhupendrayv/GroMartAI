# GroMartAI (Smart Grocery List Manager) 🛒⚡

[![GitHub Repository](https://img.shields.io/badge/GitHub-bhupendrayv%2FGroMartAI-blue?style=for-the-badge&logo=github)](https://github.com/bhupendrayv/GroMartAI)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

🔗 **Official Repository:** [https://github.com/bhupendrayv/GroMartAI](https://github.com/bhupendrayv/GroMartAI)

An AI-driven, full-stack collaborative grocery and shopping list management system designed to make grocery tracking, budget management, voice-based additions, barcode scanning, receipt generation, and billing seamless and real-time.

---

## 📌 Table of Contents
- [About the Project](#-about-the-project)
- [System Architecture](#-system-architecture)
- [Key Modules & Features](#-key-modules--features)
- [Component Responsibilities](#-component-responsibilities)
- [Tech Stack](#-tech-stack)
- [Local Development Setup](#-local-development-setup)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Folder Structure](#-folder-structure)
- [License](#-license)

---

## 📖 About the Project

**GroMartAI** is an intelligent web application built to streamline everyday grocery shopping and pantry management. It solves the friction of manual list-keeping by offering:
- **Natural Language & Voice Input:** Add multiple items via speech or freeform text with automatic quantity, unit, and category parsing.
- **Barcode & QR Scanner:** Instant barcode lookup using web cameras to quickly add items or verify billing receipts.
- **Real-Time Collaboration:** Real-time updates across multiple devices/tabs powered by Server-Sent Events (SSE).
- **Receipt & Invoice Generation:** Export visual digital bills and downloadable PDF receipts with QR verification codes.
- **Secure Stripe Checkout:** Integrated payment processing for instant digital grocery settlement.

---

## 🏗️ System Architecture

GroMartAI follows a modern decoupled client-server architecture with reactive event streaming:

```mermaid
graph TD
    subgraph Client ["Frontend (React 19 + Vite)"]
        UI[UI Components & Dashboard]
        Voice[Speech Recognition / Voice Input]
        Scanner[Barcode Scanner & QR Code]
        Receipt[PDF / Canvas Invoice Generator]
        Router[React Router & State]
    end

    subgraph Server ["Backend (Node.js + Express 5)"]
        AuthMid[JWT Auth Middleware]
        AuthCtrl[Auth Controller]
        ItemCtrl[Item Controller]
        ListCtrl[List Controller]
        ReceiptCtrl[Receipt Controller]
        SSE[SSE Live Event Stream]
        StripeRoute[Stripe Payment Gateway]
    end

    subgraph Database ["Persistence Layer"]
        MongoDB[(MongoDB Database)]
    end

    subgraph External ["External Services"]
        StripeAPI[Stripe Checkout API]
    end

    UI -->|REST API / JWT| AuthMid
    AuthMid --> AuthCtrl
    AuthMid --> ItemCtrl
    AuthMid --> ListCtrl
    AuthMid --> ReceiptCtrl
    AuthMid --> StripeRoute

    UI <---|Server-Sent Events (SSE)| SSE
    ItemCtrl -->|Broadcast Events| SSE

    AuthCtrl --> MongoDB
    ItemCtrl --> MongoDB
    ListCtrl --> MongoDB
    ReceiptCtrl --> MongoDB

    StripeRoute --> StripeAPI
```

### Architectural Highlights:
1. **Frontend Presentation Tier:** Built on React 19 with Vite, featuring responsive styling, Framer Motion micro-interactions, HTML5 Canvas, and Web Speech API.
2. **Backend Application Tier:** RESTful Express.js service securing endpoints with JSON Web Tokens (JWT) and emitting real-time list updates through a persistent SSE connection.
3. **Data Layer:** MongoDB via Mongoose object modeling supporting collections for Users, Lists, Items, Groups, and Digital Receipts.

---

## 📦 Key Modules & Features

| Module | Description |
|---|---|
| **Smart Voice & Text Parsing** | Accepts spoken voice or raw text (e.g. *"2kg rice, 1 liter milk and 3 packets biscuits"*) and breaks it down into structured items with smart category auto-detection. |
| **Barcode Scanner** | Utilizes device camera via `html5-qrcode` to scan product barcodes and instantly add them to your active grocery list. |
| **Multi-List Management** | Create, switch, and manage custom shopping lists (e.g., *Home Pantry*, *Weekly Essentials*, *Party Shopping*). |
| **Real-Time Sync (SSE)** | Live data propagation via Server-Sent Events so shared family/group lists reflect updates without manual refresh. |
| **Receipt & Bill Generation** | Generates itemized visual bills, barcode/QR receipts, downloadable PDFs (`jspdf` + `html2canvas`), and allows receipt retrieval via Bill Code. |
| **Payment Integration** | Native Stripe Checkout session integration for seamless online payments. |
| **Categorization & Budget Tracker** | Real-time calculation of total expenditures, item counts, completed vs. pending items, and category tags (Produce, Dairy, Snacks, etc.). |

---

## 👥 Component Responsibilities

### 🖥️ Frontend (Client)
- [`client/src/App.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/App.jsx): Root router managing auth session state and routing between `/login` and `/`.
- [`client/src/components/AuthForm.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/AuthForm.jsx): Handles user registration and authentication workflows with token persistence.
- [`client/src/components/GroceryList.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/GroceryList.jsx): Main dashboard orchestrating lists, items, totals, SSE event listeners, and modal toggles.
- [`client/src/components/AddItemForm.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/AddItemForm.jsx): Item entry form featuring NLP text parsing, category selectors, unit selections, and price inputs.
- [`client/src/components/ItemCard.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/ItemCard.jsx): Item visual card supporting completion toggling, editing, and deletion.
- [`client/src/components/VoiceInput.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/VoiceInput.jsx): Manages browser Web Speech API interactions and voice dictation.
- [`client/src/components/BarcodeScanner.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/BarcodeScanner.jsx): Camera-based barcode scanner integration using HTML5 QR/Barcode APIs.
- [`client/src/components/ReceiptModal.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/ReceiptModal.jsx): Itemized receipt viewer, QR bill verification, and PDF invoice downloader.
- [`client/src/components/ReceiptHistoryModal.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/ReceiptHistoryModal.jsx): View previous billing records and past checkout transactions.
- [`client/src/components/VerifyBillModal.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/VerifyBillModal.jsx): Verify and look up authenticity of generated bill numbers.
- [`client/src/components/ListNavigator.jsx`](file:///d:/Grocery%20List%20Manager%20Project/client/src/components/ListNavigator.jsx): Navigation drawer and tab switcher for multiple shopping lists.

### ⚙️ Backend (Server)
- [`server/server.js`](file:///d:/Grocery%20List%20Manager%20Project/server/server.js): Express server bootstrap, middleware configuration, MongoDB connection, SSE event pipeline, and Stripe routes.
- [`server/controllers/authController.js`](file:///d:/Grocery%20List%20Manager%20Project/server/controllers/authController.js): Secure password hashing (bcrypt) and JWT user token generation.
- [`server/controllers/itemController.js`](file:///d:/Grocery%20List%20Manager%20Project/server/controllers/itemController.js): CRUD operations for grocery items, bulk insertion, and SSE broadcast management.
- [`server/controllers/listController.js`](file:///d:/Grocery%20List%20Manager%20Project/server/controllers/listController.js): Creation, retrieval, and updating of customized user shopping lists.
- [`server/controllers/receiptController.js`](file:///d:/Grocery%20List%20Manager%20Project/server/controllers/receiptController.js): Storage, history, and verification lookup for generated transaction receipts.
- [`server/middleware/auth.js`](file:///d:/Grocery%20List%20Manager%20Project/server/middleware/auth.js): JWT verification guard protecting all private API routes.
- [`server/models/`](file:///d:/Grocery%20List%20Manager%20Project/server/models): Mongoose schemas (`User.js`, `Item.js`, `ShoppingList.js`, `Receipt.js`, `Group.js`, `GroupMember.js`).

---

## 🛠️ Tech Stack

- **Client:** React 19, Vite, React Router v7, Lucide Icons, Framer Motion, HTML5 QR Code, jsPDF, html2canvas, Axios
- **Server:** Node.js, Express.js (v5), MongoDB, Mongoose, JWT (jsonwebtoken), bcryptjs, Stripe API
- **Tooling & Orchestration:** Concurrently, ESLint, Dotenv

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18.0 or later recommended)
- **npm** (v9.0 or later)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

---

### 2. Clone the Repository
```bash
git clone https://github.com/bhupendrayv/GroMartAI.git
cd GroMartAI
```

---

### 3. Environment Configuration
Navigate to the `server/` directory and create a `.env` file based on `.env.example`:

```bash
cd server
cp .env.example .env
```

Fill in your variables inside `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/grocerio
JWT_SECRET=your_jwt_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

*(Optional)* If testing Stripe checkout, provide test API keys from the Stripe Dashboard.

---

### 4. Install Dependencies

You can install all dependencies for the root, server, and client with a single command from the root directory:

```bash
npm run install-all
```

*Or install them manually:*
```bash
# Root dependencies
npm install

# Backend dependencies
cd server && npm install

# Frontend dependencies
cd ../client && npm install
```

---

### 5. Running the Application

From the root project directory:

```bash
npm start
```
This runs both the backend server and frontend client concurrently using `concurrently`:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

#### Alternatively, run independently:

```bash
# Terminal 1 - Backend Server
cd server
npm start

# Terminal 2 - Frontend Client
cd client
npm run dev
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account | ❌ |
| `POST` | `/api/auth/login` | Login user & issue JWT | ❌ |
| `GET` | `/api/lists` | Fetch all user lists | ✅ |
| `POST` | `/api/lists` | Create a new shopping list | ✅ |
| `PUT` | `/api/lists/:id` | Update shopping list name/settings | ✅ |
| `GET` | `/api/items` | Fetch items for active list | ✅ |
| `POST` | `/api/items` | Add a single item | ✅ |
| `POST` | `/api/items/bulk` | Bulk add parsed items | ✅ |
| `PUT` | `/api/items/:id` | Update item (name, qty, bought status) | ✅ |
| `DELETE` | `/api/items/:id` | Remove item from list | ✅ |
| `GET` | `/api/events` | Server-Sent Events (SSE) live updates stream | ✅ |
| `GET` | `/api/receipts` | Fetch receipt history | ✅ |
| `POST` | `/api/receipts` | Save a new receipt | ✅ |
| `GET` | `/api/receipts/:billNumber` | Verify/retrieve receipt by bill code | ✅ |
| `POST` | `/api/payment/create-checkout-session` | Initialize Stripe checkout session | ✅ |
| `GET` | `/api/health` | Health check endpoint | ❌ |
| `GET` | `/api/status` | DB & server operational status check | ❌ |

---

## 📂 Folder Structure

```text
Grocery List Manager Project/
├── client/                     # Frontend Vite + React application
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── components/         # Reusable UI & modal components
│   │   │   ├── AddItemForm.jsx
│   │   │   ├── AuthForm.jsx
│   │   │   ├── BarcodeScanner.jsx
│   │   │   ├── GroceryList.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   ├── ListNavigator.jsx
│   │   │   ├── ReceiptHistoryModal.jsx
│   │   │   ├── ReceiptModal.jsx
│   │   │   ├── VerifyBillModal.jsx
│   │   │   └── VoiceInput.jsx
│   │   ├── App.jsx             # App root & route switch
│   │   ├── index.css           # Design tokens & styling
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend Express.js REST API
│   ├── controllers/            # Request handlers (auth, item, list, receipt)
│   ├── middleware/             # JWT auth guard
│   ├── models/                 # Mongoose schemas & data models
│   ├── server.js               # Express entrypoint & SSE stream
│   ├── .env.example            # Sample environment variables
│   └── package.json
├── package.json                # Root orchestration scripts
└── README.md                   # Comprehensive documentation
```

---

## 📄 License
This project is licensed under the [ISC License](file:///d:/Grocery%20List%20Manager%20Project/server/package.json#L12).
