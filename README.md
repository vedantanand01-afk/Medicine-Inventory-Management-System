# MediCore ERP — Medicine Inventory Management System

A full-stack web application designed for pharmacies, clinics, and healthcare distribution centers to manage medicine inventories, supplier relationships, stock movements, expiry safety, and sales transactions with atomic data consistency and role-based access control.

---

## 🌟 Key Highlights

* **Role-Based Access Control (RBAC)**: Secure JWT authentication with separated `Admin` and `Pharmacist / Staff` roles.
* **Live Dynamic Dashboard**: Real-time KPI counters, interactive Chart.js visualizations (therapeutic category breakdown, inventory health ratio, 7-day cashflow trend), and recent transaction ledgers computed directly from MongoDB.
* **Medicine Catalog**: Multi-criteria search (name, generic, ID, batch, category), multi-field filtering, pagination, and technical specifications modal.
* **Atomic Stock Management**: Safe Stock In (restock deliveries) and Stock Out (adjustments/disposals) with concurrency-safe atomic operations that strictly prevent negative inventory.
* **Expiry Safety & Alerts**: Automated expiry categorization (`Valid`, `Near Expiry <30d`, `Expired`) and safety protocols that strictly **block sales of expired medicines**.
* **Transactions & Invoices**: Fast sales counter with instant receipt generation, customer records, and printer-friendly PDF receipts.
* **Reports & Analytics**: Inventory valuation, dispensary sales, stock movement, and expiry risk reports with one-click **CSV export** and **print/PDF capabilities**.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router v6, Chart.js & react-chartjs-2, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js (REST APIs), JWT (JSON Web Tokens), bcryptjs, Morgan |
| **Database** | MongoDB, Mongoose ODM |
| **Design** | Clean Medical / Healthcare UI theme (Emerald, Slate, Teal, Indigo) |

---

## 📂 Project Structure

```text
ERP Project/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection handler
│   │   ├── models/
│   │   │   ├── User.js               # User schema with bcrypt hashing
│   │   │   ├── Supplier.js           # Pharmaceutical supplier schema
│   │   │   ├── Medicine.js           # Medicine catalog & specs schema
│   │   │   ├── Stock.js              # Stock inventory schema
│   │   │   ├── Transaction.js        # Sales, purchases, adjustments ledger
│   │   │   └── Setting.js            # Pharmacy store configuration
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification & role authorization
│   │   │   └── errorHandler.js       # Centralized JSON error formatting
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login, register, profile
│   │   │   ├── medicineController.js # Medicine CRUD, search, filters
│   │   │   ├── stockController.js    # Stock In/Out atomic operations
│   │   │   ├── supplierController.js # Supplier CRUD & dependency protection
│   │   │   ├── transactionController.js # Sales with expiry & stock enforcement
│   │   │   ├── alertController.js    # Low stock & expiry alerts
│   │   │   ├── dashboardController.js# Live KPI calculations & charts
│   │   │   ├── reportController.js   # Inventory, sales, movement reports
│   │   │   ├── userController.js     # Admin staff accounts management
│   │   │   └── settingController.js  # Pharmacy configuration
│   │   ├── routes/                   # Express route definitions
│   │   ├── seed/
│   │   │   └── seed.js               # Database seeding with demo data
│   │   └── tests/
│   │       └── test_api.js           # Comprehensive API integration test suite
│   ├── .env.example
│   ├── package.json
│   └── server.js                     # Express server entry point
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # Sidebar, Navbar, AppLayout
│   │   │   ├── common/               # DataTable, StatCard, StatusBadge, Modal, Toast, Loader
│   │   │   ├── charts/               # CategoryBarChart, StockStatusDoughnut, SalesTrendChart
│   │   │   └── modals/               # AddMedicine, StockIn, StockOut, CreateSale, AddSupplier, Invoice
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth state, token persistence & RBAC
│   │   │   └── NotificationContext.jsx # Toast alerts
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Authentication page with 1-click demo logins
│   │   │   ├── Dashboard.jsx         # Live dashboard & KPI cards
│   │   │   ├── Medicines.jsx         # Catalog table, search & filters
│   │   │   ├── Stock.jsx             # Stock inventory & storage
│   │   │   ├── Suppliers.jsx         # Vendor directory
│   │   │   ├── Transactions.jsx      # Audit ledger & invoice prints
│   │   │   ├── Alerts.jsx            # Expiry & low stock monitoring
│   │   │   ├── Reports.jsx           # Valuation, sales & movement analytics
│   │   │   ├── Users.jsx             # Admin user management
│   │   │   └── Settings.jsx          # Pharmacy metadata & thresholds
│   │   ├── services/
│   │   │   └── api.js                # Axios instance with auth interceptor
│   │   ├── utils/
│   │   │   ├── formatters.js         # Currency & date formatters
│   │   │   └── exportUtils.js        # CSV download & print helpers
│   │   ├── App.jsx                   # Route definition & route guards
│   │   ├── main.jsx                  # React DOM entry
│   │   └── index.css                 # Tailwind directives & print styles
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── package.json
│
├── package.json                      # Root orchestration script
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites

* **Node.js**: v18.0.0 or higher (`v22.x` recommended)
* **MongoDB**: Running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 1. Installation

Install all backend and frontend dependencies from the root directory:

```bash
# Install root, server, and client dependencies
npm run install:all
```

Or install them individually:

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Environment Setup

Create `.env` in the `server/` directory (an `.env.example` is provided):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/medicine_inventory
JWT_SECRET=super_secret_medicine_erp_jwt_key_2026
JWT_EXPIRE=7d
```

### 3. Database Seeding

Populate the database with realistic demonstration pharmaceutical data (12+ medicines across various stock and expiry conditions, 5 suppliers, 19+ transactions, store settings, and demo accounts):

```bash
# Run seed script
npm run seed
```

---

## 🔑 Demo Login Credentials

The seed script creates the following pre-configured accounts (with 1-click fill buttons available on the login screen):

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@medinventory.com` | `Admin@123` | Full access to all modules, User Management & Store Settings |
| **Pharmacist / Staff** | `pharmacist@medinventory.com` | `Pharm@123` | Access to Medicines, Stock, Sales, Alerts, and Reports |

---

## 🚀 Running the Application

### Development Mode (Both Frontend and Backend Concurrently)

From the root directory:

```bash
npm run dev
```

* **Frontend Client**: `http://localhost:5173`
* **Backend API Server**: `http://localhost:5000`
* **API Health Check**: `http://localhost:5000/api/health`

---

## 🧪 Running Integration Tests

A comprehensive integration test suite verifies API authentication, CRUD operations, atomic stock deductions, blocking of expired medicine sales, and role-based permissions:

```bash
npm run test:api
```

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new staff account
* `POST /api/auth/login` — Login and obtain JWT bearer token
* `GET  /api/auth/me` — Fetch currently authenticated user profile
* `PUT  /api/auth/profile` — Update user profile and password

### Medicines (`/api/medicines`)
* `GET    /api/medicines` — List medicines (supports `search`, `category`, `supplier`, `stockStatus`, `expiryStatus`, `sort`, `page`, `limit`)
* `GET    /api/medicines/categories` — Get distinct medicine categories
* `GET    /api/medicines/:id` — Get single medicine details with recent transaction ledger
* `POST   /api/medicines` — Create medicine and initialize 1:1 stock record
* `PUT    /api/medicines/:id` — Update medicine details
* `DELETE /api/medicines/:id` — Delete medicine and associated stock (Admin only)

### Stock Management (`/api/stock`)
* `GET  /api/stock` — List all stock records with computed stock health statuses
* `POST /api/stock/in` — Restock shipment (atomically increments quantity and records purchase)
* `POST /api/stock/out` — Adjust/deduct stock (atomically decrements quantity with non-negative guard)
* `GET  /api/stock/low` — List medicines at or below reorder level

### Transactions & Sales (`/api/transactions`)
* `GET  /api/transactions` — Transaction history ledger with date, type, and medicine filters
* `POST /api/transactions` — Process counter sale (checks expiry, verifies available stock, decrements quantity atomically)
* `GET  /api/transactions/:id` — Get transaction details for receipt generation

### Alerts (`/api/alerts`)
* `GET /api/alerts/low-stock` — Items below reorder level with deficit calculations
* `GET /api/alerts/expiry` — Categorized expired and near-expiry (<30 days) batches
* `GET /api/alerts/summary` — Fast count summary for navbar notification bell

### Dashboard (`/api/dashboard`)
* `GET /api/dashboard/stats` — Live computed counts for medicines, stocks, alerts, sales, and revenue
* `GET /api/dashboard/stock-overview` — Category distribution and stock status health ratio
* `GET /api/dashboard/sales-trend` — Daily sales volume and purchase expenditure trends
* `GET /api/dashboard/recent-transactions` — 8 most recent ledger items

### Reports (`/api/reports`)
* `GET /api/reports/inventory` — Inventory valuation, cost valuation, and margin analysis
* `GET /api/reports/sales` — Dispensary sales figures, units sold, and top-selling products
* `GET /api/reports/movement` — Received inventory vs issued inventory comparison
* `GET /api/reports/expiry` — Value at risk across 30, 60, and 90-day expiry horizons

### User Management (`/api/users` — Admin Only)
* `GET    /api/users` — List system user accounts
* `POST   /api/users` — Create new staff account with assigned role
* `PUT    /api/users/:id` — Update user details or reset password
* `DELETE /api/users/:id` — Delete user account (with self-deletion guard)

### Settings (`/api/settings`)
* `GET /api/settings` — Get pharmacy profile and threshold parameters
* `PUT /api/settings` — Update pharmacy store settings (Admin only)

---

## 🛡️ Edge Cases & Safety Rules Handled

1. **Expired Medicine Sales Blocked**: The sales endpoint verifies `expiryDate >= today`; sales of expired medications are strictly blocked with `400 Bad Request`.
2. **Negative Stock Prevention**: Stock decrement operations use MongoDB atomic condition checks `{ medicine: id, quantity: { $gte: requestedQty } }` to eliminate race conditions and prevent negative stock.
3. **Supplier Deletion Protection**: A supplier cannot be deleted if active medicines are currently associated with it.
4. **Self-Deletion Guard**: Admin users cannot delete their own account from User Management.
5. **Role Restrictions**: Pharmacist accounts attempting to access `/api/users` or `/api/settings` receive `403 Forbidden`.
6. **Date Validation**: Expiry date must strictly follow manufacturing date.

---

## 🔮 Future Scope

* **Barcode / QR Scanning**: Hardware scanner integration for instant dispensing and stock audits.
* **SMS / Email Alerts**: Automated notifications to suppliers when stocks reach critical reorder levels.
* **Multi-Branch Synchronization**: Central warehouse management across multiple pharmacy branches.
* **Drug Interaction Checker**: Warnings when dispensing incompatible drug categories to the same patient.

---

## 📄 License

MIT License &bull; Designed & Built for Academic & Production Demonstration.
