# Shop Management Dashboard

A complete MERN Stack Shop Management System.

## Features
- Admin authentication (JWT)
- Product management with Cloudinary image upload
- Category management
- Order creation with automatic stock management
- Bill generation (printable + WhatsApp share)
- Sales analytics dashboard with charts
- Fully responsive mobile design

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Environment Variables (backend/.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/shop_dashboard
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

ADMIN_EMAIL=admin@shop.com
ADMIN_PASSWORD=admin123

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SHOP_NAME=My Shop
```

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, Cloudinary, JWT, Multer  
**Frontend:** React, Tailwind CSS, React Router, Axios, Recharts, React Hot Toast

## Project Structure

```
shop-dashboard/
├── backend/
│   ├── config/         # DB & Cloudinary config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # JWT auth middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   └── server.js
└── frontend/
    └── src/
        ├── components/ # Layout & common components
        ├── context/    # Auth context
        ├── pages/      # All pages
        └── services/   # API service
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Admin login |
| GET | /api/auth/me | Get current admin |
| GET/POST | /api/categories | List / Create |
| PUT/DELETE | /api/categories/:id | Update / Delete |
| GET/POST | /api/products | List / Create |
| PUT/DELETE | /api/products/:id | Update / Delete |
| GET/POST | /api/orders | List / Create |
| PUT/DELETE | /api/orders/:id | Update / Delete |
| GET | /api/analytics/dashboard | Dashboard stats |
