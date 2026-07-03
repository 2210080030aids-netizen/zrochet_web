# Zrochet Web

Handmade crochet e-commerce store + admin portal (Next.js, PostgreSQL, Railway).

**Repository:** https://github.com/2210080030aids-netizen/zrochet_web

## Local development

```bash
npm install
cp .env.example .env.local   # edit with your values
npm run setup:local          # needs DATABASE_PUBLIC_URL
npm run dev
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin/login (password from `ADMIN_PASSWORD` in `.env.local`)

## Deploy

See [RAILWAY.md](./RAILWAY.md).
