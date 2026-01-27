# 🚀 DEPLOYMENT GUIDE - OlympicHub

**Last Updated:** 2026-01-04  
**Status:** Ready for Deployment

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Variables**
Proveri da imaš sve potrebne environment variables:

```bash
# .env.local (lokalno)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_TELEGRAM_BOT_TOKEN=your-telegram-token (optional)
VITE_TELEGRAM_CHAT_ID=your-chat-id (optional)
```

### **2. Build Test**
```bash
# Testiraj build lokalno
npm run build

# Testiraj production build
npm run preview
```

### **3. Dependencies Check**
```bash
# Proveri da li ima vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🌐 **VERCEL DEPLOYMENT**

### **Metod 1: Vercel Dashboard (Preporučeno)**

#### **Korak 1: Import Project**
1. Otvori https://vercel.com/new
2. Klikni "Import Git Repository"
3. Izaberi GitHub
4. Izaberi `Nenad034/olympichub034`
5. Klikni "Import"

#### **Korak 2: Configure Project**
```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **Korak 3: Environment Variables**
Dodaj u Vercel Dashboard:
```
VITE_SUPABASE_URL = your-supabase-url
VITE_SUPABASE_ANON_KEY = your-supabase-anon-key
VITE_TELEGRAM_BOT_TOKEN = your-telegram-token (optional)
VITE_TELEGRAM_CHAT_ID = your-chat-id (optional)
```

#### **Korak 4: Deploy**
1. Klikni "Deploy"
2. Sačekaj build (2-3 minuta)
3. Otvori deployment URL

---

### **Metod 2: Vercel CLI**

#### **Korak 1: Install Vercel CLI**
```bash
npm i -g vercel
```

#### **Korak 2: Login**
```bash
vercel login
```

#### **Korak 3: Deploy Development**
```bash
vercel
```

Odgovori na pitanja:
```
? Set up and deploy "d:\OlympicHub"? [Y/n] Y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] N
? What's your project's name? olympichub034
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

#### **Korak 4: Set Environment Variables**
```bash
vercel env add VITE_SUPABASE_URL
# Paste value

vercel env add VITE_SUPABASE_ANON_KEY
# Paste value
```

#### **Korak 5: Deploy Production**
```bash
vercel --prod
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem 1: Build Failed**

**Error:** `npm ERR! code ELIFECYCLE`

**Rešenje:**
```bash
# Obriši node_modules i package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Retry build
npm run build
```

---

### **Problem 2: Environment Variables Not Working**

**Error:** `undefined` za env variables

**Rešenje:**
1. Proveri da env variables počinju sa `VITE_`
2. Redeploy nakon dodavanja env variables
3. Proveri da su env variables postavljene za **Production**

```bash
# Vercel Dashboard
Settings → Environment Variables → Production
```

---

### **Problem 3: 404 on Refresh**

**Error:** 404 kada refresh-uješ stranicu

**Rešenje:**
Već rešeno u `vercel.json`:
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

---

### **Problem 4: CORS Errors**

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Rešenje:**
Proveri Supabase CORS settings:
```
Supabase Dashboard → Settings → API → CORS
Add: https://your-vercel-domain.vercel.app
```

---

## 📊 **POST-DEPLOYMENT CHECKLIST**

### **1. Verify Deployment**
- [ ] Otvori deployment URL
- [ ] Proveri da se aplikacija učitava
- [ ] Proveri da nema console errors

### **2. Test Features**
- [ ] Test TCT Connection (`/tct-test`)
- [ ] Test Hotel Search (`/tct`)
- [ ] Test AI Watchdog (`/watchdog`)
- [ ] Test routing (navigate između stranica)

### **3. Performance Check**
- [ ] Otvori Lighthouse (Chrome DevTools)
- [ ] Run audit
- [ ] Proveri Performance score (target: >90)
- [ ] Proveri Accessibility score (target: >90)

### **4. Security Check**
- [ ] Proveri Security Headers
  - Open DevTools → Network → Select any request → Headers
  - Verify: X-Content-Type-Options, X-Frame-Options, etc.
- [ ] Proveri da env variables nisu exposed
  - Open DevTools → Sources → Check for .env values

### **5. Monitoring Setup**
- [ ] Vercel Analytics enabled
- [ ] Vercel Speed Insights enabled
- [ ] Error tracking configured

---

## 🔄 **CONTINUOUS DEPLOYMENT**

Vercel automatski deploy-uje na svaki push:

```bash
# Push to main = Production deploy
git push origin main

# Push to develop = Preview deploy
git push origin develop
```

### **Branch Strategy:**
```
main → Production (olympichub034.vercel.app)
develop → Preview (olympichub034-git-develop.vercel.app)
feature/* → Preview (olympichub034-git-feature-xyz.vercel.app)
```

---

## 🎯 **CUSTOM DOMAIN (Optional)**

### **Korak 1: Buy Domain**
- Namecheap, GoDaddy, Google Domains, etc.

### **Korak 2: Add Domain to Vercel**
```
Vercel Dashboard → Project → Settings → Domains
Add: yourdomain.com
```

### **Korak 3: Configure DNS**
Dodaj DNS records:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### **Korak 4: Wait for DNS Propagation**
- Usually 5-30 minutes
- Check: https://dnschecker.org

---

## 📱 **MOBILE APP (Future)**

### **PWA Setup:**
```bash
# Install Vite PWA plugin
npm install vite-plugin-pwa -D

# Configure in vite.config.ts
# Add manifest.json
# Add service worker
```

---

## 🔐 **SECURITY BEST PRACTICES**

### **1. Environment Variables**
- ✅ Never commit `.env` files
- ✅ Use Vercel Environment Variables
- ✅ Separate dev/prod variables

### **2. API Keys**
- ✅ TCT credentials in Supabase Edge Functions
- ✅ Supabase anon key is public (OK)
- ✅ Supabase service key ONLY server-side

### **3. HTTPS**
- ✅ Vercel automatically provides HTTPS
- ✅ Force HTTPS redirect (automatic)

---

## 📊 **MONITORING**

### **Vercel Analytics**
```
Vercel Dashboard → Project → Analytics
- Page views
- Unique visitors
- Top pages
- Geographic data
```

### **Vercel Speed Insights**
```
Vercel Dashboard → Project → Speed Insights
- Real User Monitoring (RUM)
- Core Web Vitals
- Performance scores
```

### **Error Tracking (Optional)**
```bash
# Sentry
npm install @sentry/react

# Configure in main.tsx
```

---

## 🎊 **SUCCESS CRITERIA**

### **Deployment is successful when:**
- ✅ Build completes without errors
- ✅ Application loads on deployment URL
- ✅ All routes work correctly
- ✅ API calls work (TCT, Supabase)
- ✅ No console errors
- ✅ Lighthouse score >90
- ✅ Security headers present

---

## 📞 **SUPPORT**

### **Vercel Support:**
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: https://vercel.com/support

### **Project Support:**
- GitHub Issues: https://github.com/Nenad034/olympichub034/issues
- Email: nenad.tomic1403@gmail.com

---

## 🎯 **NEXT STEPS AFTER DEPLOYMENT**

1. ✅ Update TODO_LIST.md (mark FAZA 1 complete)
2. ✅ Share deployment URL with stakeholders
3. ✅ Monitor analytics for first 24h
4. ✅ Start FAZA 2 (Quick Wins)

---

**Last Updated:** 2026-01-04  
**Deployment Status:** Ready ✅
