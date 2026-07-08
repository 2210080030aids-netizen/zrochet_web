# Railway deployment guide — Zrochet

## GitHub repo
https://github.com/2210080030aids-netizen/zrochet_web

## Live site
Set after Railway deploy — your `*.up.railway.app` domain

---

## Deploy from scratch (checklist)

### 1. Push code to GitHub
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

### 2. Create Railway project
1. [railway.app](https://railway.app) → sign in with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select **zrochet_web** (`2210080030aids-netizen/zrochet_web`)

### 3. Add PostgreSQL
1. **+ New** → **Database** → **PostgreSQL**
2. Wait until **Active**

### 4. Connect database to web service
1. Open **web service** (not Postgres) → **Variables**
2. **+ New Variable** → **Add Reference** → Postgres → `DATABASE_URL`

### 5. Set web service variables

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Reference from Postgres (auto) |
| `ADMIN_PASSWORD` | Strong password for `/admin/login` |
| `NEXT_PUBLIC_SITE_URL` | Your Railway domain (step 6) |
| `NEXT_PUBLIC_UPI_ID` | Your UPI ID |
| `NEXT_PUBLIC_UPI_PAYEE_NAME` | `Zrochet` |

**Thank-you email on order approval:**

> **Railway blocks Gmail SMTP** (ports 587/465). Use **SendGrid** on Railway. Gmail SMTP still works on **localhost**.

**Railway production — SendGrid (required):**

1. [sendgrid.com](https://sendgrid.com) → free account
2. **Settings → API Keys** → Create API Key
3. **Settings → Sender Authentication → Verify Single Sender** → `2210080030aids@gmail.com`
4. Add Railway variables:

| Variable | Value |
|----------|--------|
| `SENDGRID_API_KEY` | your SendGrid API key |
| `SENDGRID_FROM` | `Zrochet <2210080030aids@gmail.com>` |

5. Redeploy

**Local development — Gmail SMTP:**

| Variable | Value |
|----------|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `2210080030aids@gmail.com` |
| `SMTP_PASS` | Gmail app password (`.env.local` only) |
| `SMTP_FROM` | `Zrochet <2210080030aids@gmail.com>` |

### 6. Generate domain
1. Web service → **Settings** → **Networking** → **Generate Domain**
2. Copy URL → set as `NEXT_PUBLIC_SITE_URL`
3. **Redeploy**

### 7. Verify deploy
- **Deployments** → **Success**
- Store: `https://YOUR-URL.up.railway.app`
- Admin: `https://YOUR-URL.up.railway.app/admin/login`

Migrate + seed run automatically on app start — no manual `db:seed` needed.

---

## Admin portal

| URL | Purpose |
|-----|---------|
| `/admin/login` | Sign in with `ADMIN_PASSWORD` |
| `/admin` | Dashboard |
| `/admin/collections` | Add / edit collections |
| `/admin/products` | Manage products |
| `/admin/orders` | View & approve payments |
| `/admin/settings` | Phone, email, address, hero image, UPI ID, Instagram |

---

## Local development

1. Copy `.env.example` → `.env.local`
2. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
3. Set `ADMIN_PASSWORD=zrochet-local` (or your choice)
4. Add `DATABASE_PUBLIC_URL` from Railway → Postgres → **Public Network** (not `.internal`)
5. Run:
   ```bash
   npm install
   npm run setup:local
   npm run dev
   ```
6. Store: http://localhost:3000  
   Admin: http://localhost:3000/admin/login

`npm run db:migrate` and `npm run db:seed` load `.env.local` automatically — no separate `.env` file required.

---

## Build & start (automatic on Railway)

**Build** (`npm run build`):
1. Prisma generate
2. Catalog JSON generate
3. Next.js build

**Start** (`npm run start`):
1. `prisma migrate deploy`
2. `db:seed` (skips if products exist)
3. `next start`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails (Tailwind) | Redeploy with **Clear build cache** |
| Build fails (`tsconfig.tsbuildinfo`) | Clear build cache |
| Admin empty / no products | Check deploy logs for migrate/seed; verify `DATABASE_URL` reference |
| Admin login fails | Check `ADMIN_PASSWORD` on **web service** |
| Email not sent on Railway | Railway blocks Gmail SMTP — add `SENDGRID_API_KEY` + verify sender at SendGrid |
| **Works on Wi‑Fi, not on mobile data (Jio/Airtel)** | See **Mobile data DNS fix** below |

---

## Mobile data DNS fix (India — Jio / Airtel)

**Symptom:** Chrome shows `DNS_PROBE_FINISHED_NXDOMAIN` on mobile data, but the site opens on Wi‑Fi.

**Cause:** Some Indian mobile carriers do not resolve `*.up.railway.app` reliably. The app and Railway deploy are fine — the phone’s cellular DNS cannot find the domain.

### Quick test on your phone (no domain purchase)

1. **Settings → Network & internet → Private DNS**
2. Set to **Private DNS provider hostname** → enter `dns.google` (or choose **Off**, then retry)
3. Turn **mobile data** back on, close Chrome completely, reopen:
   `https://zrochetweb-production.up.railway.app`

This fixes your phone only. **Customers on Jio will still have the same problem** until you use a custom domain.

### Permanent fix — custom domain (recommended)

Use your own domain (e.g. `zrochet.com` or `shop.zrochet.com`). Custom domains resolve on all networks.

#### Step 1 — Railway

1. Web service → **Settings** → **Networking**
2. **Public Networking** → **ON**
3. Click **+ Custom Domain**
4. Enter e.g. `shop.zrochet.com` or `www.zrochet.com`
5. Railway shows a **CNAME target** (copy it), e.g. `something.up.railway.app`

#### Step 2 — Domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)

Add a **CNAME** record:

| Type | Name | Value |
|------|------|--------|
| CNAME | `shop` (or `www`) | Paste Railway’s CNAME target |

**Tip:** If you use [Cloudflare](https://cloudflare.com), add the site there and turn **Proxy** (orange cloud) **ON** — this often fixes mobile carrier DNS in India.

Wait 5–30 minutes for DNS to propagate.

#### Step 3 — Railway variables

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://shop.zrochet.com` (your real custom URL) |

Redeploy the web service.

#### Step 4 — Verify

- Open the **custom domain** on **mobile data** (not Wi‑Fi)
- Share only the custom domain with customers — not the `*.up.railway.app` link

### Optional — try a new Railway subdomain

If you do not have a custom domain yet:

1. Railway → **Settings** → **Networking** → remove old domain → **Generate Domain**
2. Copy the **new** `*.up.railway.app` URL and test on mobile data

Sometimes a new subdomain works; a **custom domain is still the reliable long-term fix**.

---

## Security

- Never commit `.env` or `.env.local`
- Use a strong `ADMIN_PASSWORD` on Railway
- Rotate DB password if exposed publicly
