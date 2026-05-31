# Deployment Notes

## Backend

Set environment variables before running Django:

```powershell
$env:DJANGO_SECRET_KEY="replace-with-a-long-random-secret"
$env:DJANGO_DEBUG="False"
$env:DJANGO_ALLOWED_HOSTS="your-domain.com"
```

For a production server, run Django behind a WSGI server and serve `backend/media/` as uploaded product media.

## Frontend

Build the React app:

```powershell
cd frontend
npm install
npm run build
```

Deploy `frontend/dist/` to your web host. In production, keep `VITE_API_BASE_URL=/api` if the backend is served from the same domain, or set it to the full API origin.

## Inventory Rules

- Customer product lists hide products with `stock = 0`.
- Products with `stock <= 5` show a low-stock message.
- Checkout validates stock on the backend and reduces stock in SQLite.
- Admin users can view and edit all products, including out-of-stock products.

