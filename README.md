# Servnix

Servnix is being rebuilt as a single-account marketplace. The current dashboard is a frontend UI with sample listings. Authentication is connected to the Express API and PostgreSQL.

## Development

Set `DATABASE_URL`, `JWT_SECRET`, and optionally `PORT`, `CLIENT_URL`, and `JWT_EXPIRES_IN` in `backend/.env.local`. Password recovery also needs `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`.

```text
cd backend
npm install
npm run migrate
npm run dev

cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/v1` to the backend on port 3000.

## Authentication

The auth migration, `backend/common/database/migrations/001_auth.js`, creates users, sessions, and password reset tokens. A user signs up with **name, email, and password**; there is no role. Signup then directs the user to log in. Passwords are validated and hashed with bcrypt. Successful login returns a token in both the JSON response and `Authorization: Bearer ...` response header. Protected requests send that token in the request header, where middleware verifies the JWT and active database session.

Forgot password emails a single-use link valid for 20 minutes. Resetting the password revokes existing sessions. The link opens the frontend reset form. If SMTP is unavailable, recovery cannot send an email.

The browser keeps its token in session storage, so closing the browser session signs the user out locally. My Services, Hiring, the service and job sections of Explore Listings, and the seller's Mart workspace use real API data. Product browsing and buying are not connected yet.

## Services

`backend/common/database/migrations/002_services.js` creates a `services` table with a UUID service ID and `owner_user_id` linked to the creator. Each service has a title, category, description, price, experience in years, and draft/active status. Authenticated users can create, list, read, update, and delete only their own services through `/v1/services`. Another account receives no access to those records. The frontend My Services page calls this API through `frontend/src/redux/Api/service/ServiceApi.js`. Media uploads are not part of this CRUD module yet.

## Hiring

`003_hiring.js` creates requirements, worker proposals, and requirement attachments. A client can create, edit, close, or delete their own requirements and review every proposal sent to those requirements. A worker can browse open work, submit one proposal per requirement, view their own proposals, and edit or withdraw a pending proposal while the requirement stays open. The client can accept one offer, which awards the requirement and rejects the others. Workers cannot inspect competing proposals.

Photo, video, and audio attachments for requirements are stored as PostgreSQL `BYTEA`. Up to three files are allowed, with an 8 MB per-file and 16 MB total limit. Uploaded files are validated for supported media types and served through an authenticated endpoint. The Hiring UI is connected through `frontend/src/redux/Api/hiring/HiringApi.js`.

## Service bookings

Logged-in users can request an active service from Explore Listings. A request includes a contact number, service address, booking details, and an optional preferred date. The owner cannot book their own service. The booking keeps the service title and price at the time of request.

My Services has views for owned services, received booking requests, and bookings made. Owners can approve or reject pending requests; buyers can cancel their own pending requests. A service with booking history cannot be deleted; changing it to Draft removes it from listings while keeping the booking record. Migrations `004_service_bookings.js` and `005_service_booking_pending_index.js` add the booking table and prevent duplicate pending requests.

## Seller products

`006_products.js` adds owner-scoped products with title, category, description, price, stock quantity, Draft/Active status, and one image stored in PostgreSQL. Sellers manage their own products in Mart. JPEG, PNG, and WebP images up to 5 MB are accepted; the server checks the file signature and serves the image to the owner and logged-in shoppers while the product is active. Publishing requires an image and positive stock.

`007_product_commerce.js` adds wishlist, cart, and order records. Logged-in users can browse active products in Explore Listings, save favorites, add products to a cart, and place an order with contact and delivery details. Checkout rechecks stock and saves a separate order item for each product. Sellers see their sales orders in Mart and can confirm, decline, or mark them fulfilled. Buyers can cancel pending orders. Declined or cancelled orders restore stock. Sold-out products become Draft; sellers can publish them again after restocking. No online payment is collected: payment and delivery are arranged with the seller.

## Verification

```text
cd backend
npm test

cd frontend
npm run lint
npm run build
```
