# 🔒 SECURITY DEPLOYMENT CHECKLIST

## Pre-Deployment Checklist

### **1. Environment Variables** ✅
- [ ] Sve API credentials u Supabase secrets
- [ ] `.env` fajl NIJE commit-ovan
- [ ] `.env.example` kreiran (bez vrednosti)
- [ ] Production env variables postavljene
- [ ] Development env variables odvojene

### **2. API Security / Telegram** ✅
- [ ] TCT credentials u Edge Functions
- [ ] Supabase anon key public (OK)
- [ ] Supabase service key SAMO server-side
- [ ] Telegram bot token u secrets
- [ ] **Webhook Secret Validation:** `X-Telegram-Bot-Api-Secret-Token` provera implementirana
- [ ] **API Rate Limiting (per User ID):** Limitiranje po Telegram `user_id`
- [ ] Nema hardcoded credentials u kodu

### **3. Code Security** ✅ (Specifično za AI generisan kod)
- [ ] `npm audit` prošao bez critical issues
- [ ] **Dependency Pinning:** Fiksne verzije u `package.json` (ne `^1.0.0`)
- [ ] **Logic Sanity Check:** Provera da AI nije uveo logiku koja zaobilazi validaciju
- [ ] No `console.log` sa sensitive data
- [ ] Error messages ne otkrivaju sistem details
- [ ] Input validation na svim formama
- [ ] Nema `process.env.NODE_ENV === 'development'` bypass-a u produkciji

### **4. GitHub Security** ✅
- [ ] Repository postavljen na PRIVATE
- [ ] Branch protection rules aktivirane
- [ ] Secret scanning enabled
- [ ] Dependabot alerts enabled
- [ ] CODEOWNERS fajl kreiran

### **5. Supabase Security** ✅
- [ ] Row Level Security (RLS) policies
- [ ] **Database Role Permissions:** `authenticated` i `anon` role imaju MINIMALNE privilegije
- [ ] **PITR (Point-in-Time Recovery):** Uključen ako je projekat na Pro planu
- [ ] Database backups konfigurisani
- [ ] Edge Functions deployed
- [ ] Secrets postavljeni
- [ ] API rate limiting enabled

### **6. Frontend Security** ✅
- [ ] Content Security Policy (CSP)
- [ ] Security headers konfigurisani
- [ ] HTTPS enforced
- [ ] XSS protection (DOMPurify)
- [ ] CSRF protection

### **7. Monitoring / AI Watchdog** ✅
- [ ] AI Watchdog running
- [ ] Business Health Monitor active
- [ ] **Token Usage Alerting:** Prag potrošnje postavljen (auto-shutdown ako > $X/sat)
- [ ] Error logging configured
- [ ] Alert system tested
- [ ] HITL system functional
- [ ] Infinite loop detection u asinhronim funkcijama

---

## Post-Deployment Checklist

### **1. Immediate (First 24h)**
- [ ] Proveri da aplikacija radi
- [ ] Proveri AI Watchdog dashboard
- [ ] Proveri da nema exposed secrets
- [ ] Proveri error logs
- [ ] Test HITL notifications

### **2. First Week**
- [ ] Monitor API usage
- [ ] Check security alerts
- [ ] Review access logs
- [ ] Test backup restore
- [ ] Update documentation

### **3. Monthly**
- [ ] Security audit
- [ ] Dependency updates
- [ ] Review access permissions
- [ ] Check for vulnerabilities
- [ ] Update security policies

---

## Emergency Response Plan

### **If Credentials Leaked:**
1. **IMMEDIATELY** revoke compromised credentials
2. Generate new credentials
3. Update Supabase secrets
4. Redeploy Edge Functions
5. Monitor for suspicious activity
6. Document incident

### **If Security Breach:**
1. **IMMEDIATELY** take affected systems offline
2. Assess damage
3. Notify affected users (if applicable)
4. Fix vulnerability
5. Restore from backup if needed
6. Document and learn

---

## Security Contacts

### **Primary:**
- **Email:** nenad.tomic1403@gmail.com
- **GitHub:** @Nenad034

### **Services:**
- **Supabase Support:** https://supabase.com/support
- **GitHub Security:** security@github.com

---

## Regular Maintenance Schedule

### **Daily:**
- [ ] Check AI Watchdog alerts
- [ ] Review error logs

### **Weekly:**
- [ ] Run `npm audit`
- [ ] Check GitHub security alerts
- [ ] Review access logs

### **Monthly:**
- [ ] Full security audit
- [ ] Update dependencies
- [ ] Review and update policies
- [ ] Test backup restore

### **Quarterly:**
- [ ] Penetration testing
- [ ] Security training
- [ ] Policy review
- [ ] Disaster recovery drill

---

**Last Updated:** 2026-01-16  
**Next Review:** 2026-02-16
