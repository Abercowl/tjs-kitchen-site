# tjskitchenvc.com: how to put it online (no terminal)

## 1. Fill in your details (optional, can do later)
Open `assets/site.js`. At the top is a block called **SITE**.
Type your phone, email, Instagram or Facebook between the quotes.
Anything left as `''` is hidden on the site.

## 2. GitHub
1. github.com → **New repository** → name it `tjs-kitchen-site` → Private → Create.
2. Click **uploading an existing file**.
3. Unzip `tjs-kitchen-site.zip` on your Mac. Drag **everything inside the folder** (the four .html files, `404.html`, `vercel.json`, `DEPLOY.md` and the `assets` folder) into the upload box.
4. Click **Commit changes**.

## 3. Vercel
1. vercel.com → **Add New… → Project** → Import `tjs-kitchen-site`.
2. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
3. Click **Deploy**. You'll get a `…vercel.app` link. Check it.

## 4. Point tjskitchenvc.com at it
1. In Vercel: Project → **Settings → Domains** → add `tjskitchenvc.com`, then also add `www.tjskitchenvc.com` (set it to redirect to `tjskitchenvc.com`).
2. Vercel shows the DNS records it wants (usually an **A record** for `@` and a **CNAME** for `www`). Copy those exact values.
3. In Namecheap: Domain List → `tjskitchenvc.com` → **Advanced DNS** → add those two records. Don't touch the existing `order` CNAME; that's your ordering site.
4. Wait for Vercel's Domains page to show both as **Valid** (minutes to a couple of hours).

## Updating later
- Text or details: open the file in GitHub → pencil icon → edit → Commit. Vercel redeploys on its own.
- **Menu, hours and open/closed update themselves** from the admin portal. Nothing to change here.
