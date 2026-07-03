# Railway deployment guide — Zrochet

## Live site
https://zrochetcurserrailway-production.up.railway.app

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
3. Select **Zrochet_Curser_railway**

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

**Optional — thank-you email on order approval:**

| Variable | Example |
|----------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your Gmail |
| `SMTP_PASS` | Gmail app password |
| `SMTP_FROM` | `Zrochet <your@gmail.com>` |

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
| `/admin/settings` | Phone, email, address, hero image |

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
| Email not sent on approve | Add SMTP variables |

---

## Security

- Never commit `.env` or `.env.local`
- Use a strong `ADMIN_PASSWORD` on Railway
- Rotate DB password if exposed publicly
