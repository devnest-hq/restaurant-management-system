# Payment Service

Isolated payment microservice for the Restaurant Management System.

## Setup

1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate

## Deployment

### Deploy to Render (Recommended)

1. Push this repository to GitHub.
2. Go to [render.com](https://render.com) and create an account.
3. Click **"New"** → **"Blueprint"**.
4. Connect your GitHub repository.
5. Select the `render.yaml` file from the `server/payment-service/` folder.
6. Render will automatically create the web service using Docker.
7. Set the following environment variables in the Render dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `NODE_BACKEND_URL` — your Node.js backend URL
   - `NODE_BACKEND_API_KEY` — shared API key with Node.js
   - `STRIPE_SECRET_KEY` — your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` — your Stripe webhook signing secret
8. Click **"Apply"** and wait for deployment.
9. Your service will be available at `https://payment-service.onrender.com`.
10. Update your Stripe webhook endpoint URL to point to your Render URL.

### Deploy Manually with Docker

```bash
docker build -t payment-service .
docker run -p 8000:8000 --env-file .env payment-service