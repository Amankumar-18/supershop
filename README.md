# SuperShop E-Commerce

React + Django + Tailwind CSS e-commerce demo based on the supplied UI/UX code.

## Features

- Product catalog with category filtering and search
- Product detail page with stock, delivery, and buy-now actions
- Cart and wishlist
- Quantity controls, checkout form, order confirmation, and persistent stock reduction
- Customer order history
- Light/dark theme
- Demo login for customer and admin
- Admin product create/edit/delete, image upload, stock management, and dashboard stats
- Django JSON API with SQLite persistence

Deployment notes are in `DEPLOYMENT.md`.

## Demo Accounts

- User: `user@shop.com` / `user`
- Admin: `admin@shop.com` / `admin`

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed
python manage.py runserver
```

The API runs at `http://127.0.0.1:8000`.

## Frontend Setup

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173`.
