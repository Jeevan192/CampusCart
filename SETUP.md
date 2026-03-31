CampusCart Backend Setup (MongoDB)

1. Copy environment template:
   - Copy .env.example to .env

2. Ensure MongoDB is running:
   - Local default expected: mongodb://127.0.0.1:27017/campuscart

3. Install dependencies:
   - npm.cmd install

4. Start server:
   - npm.cmd run dev
   - or npm.cmd start

5. Open app:
   - http://localhost:5000/landing.html

Vercel deployment

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. In Vercel Project Settings -> Environment Variables, set:
   - MONGODB_URI (use MongoDB Atlas URI for production)
   - JWT_SECRET
   - ALLOWED_DOMAINS (comma-separated)
4. Deploy. Vercel uses vercel.json to route all pages and API calls through server.js.
5. On deploy, open /landing.html on your Vercel domain.

Notes

- In-memory MongoDB fallback is for local development only.
- On Vercel, a real cloud MongoDB URI is required.

Implemented technical USP features

- Verified campus identity and trust score
- Intelligent listing enrichment and match scoring search
- Reputation updates on completed escrow transactions
- Escrow flow with pickup OTP confirmation
- Fair-price insight endpoint from marketplace history
- Buy request demand heatmap endpoint
- Listing risk score endpoint for fraud/safety signal
- Rental mode in listing creation and data model
- Context integration recommendations endpoint
- Password strength enforcement in signup API and live strength checker in signup form
