# 📚 LESSONS LEARNED

**Purpose:** Dokumentovanje grešaka, rešenja i najboljih praksi  
**Last Updated:** 2026-01-16

---

## 📋 Lesson Template

Kopiraj ovaj template za svaku novu lekciju:

```markdown
## Lesson #[NUMBER] - [TITLE]

**Date:** YYYY-MM-DD  
**Category:** Security / Performance / Architecture / UX / Other  
**Severity:** 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW

### What Happened
[Opis situacije/greške]

### Why It Happened
[Root cause analiza]

### What We Did Wrong
[Konkretne greške]

### What We Did Right
[Šta je dobro funkcionisalo]

### The Fix
[Kako smo rešili]

### Prevention Strategy
[Kako sprečiti ubuduće]

### Code Example (if applicable)

**Before (❌ Bad):**
```typescript
// Loš kod
```

**After (✅ Good):**
```typescript
// Ispravan kod
```

### Updated Documentation
- [ ] Updated SECURITY_CHECKLIST.md
- [ ] Updated AI_AGENT_MASTER_PROMPT.md
- [ ] Updated ARCHITECTURE.md
- [ ] Updated README.md

### Action Items
- [ ] [Konkretna akcija 1]
- [ ] [Konkretna akcija 2]
```

---

## 🎓 Learned Lessons

### Security

#### Lesson #001 - Environment Variables Exposure Risk
**Date:** 2026-01-16  
**Category:** Security  
**Severity:** 🔴 CRITICAL

**What We Learned:**
- `.env` fajlovi se lako mogu commit-ovati slučajno
- GitHub secret scanning ne hvata sve tipove credentials
- AI agenti često zaborave da provere `.gitignore`

**Prevention:**
- ✅ Dodato u AI_AGENT_MASTER_PROMPT.md
- ✅ Pre-commit hook za proveru `.env` fajlova
- ✅ Obavezna Self-Reflection checklist

---

#### Lesson #002 - Telegram Webhook Security
**Date:** 2026-01-16  
**Category:** Security  
**Severity:** 🟠 HIGH

**What We Learned:**
- Telegram webhooks mogu biti targetovani od napadača ako znaju URL
- Bez validacije `X-Telegram-Bot-Api-Secret-Token`, svako može slati lažne zahteve
- Rate limiting per user ID je kritičan za sprečavanje abuse-a

**Prevention:**
- ✅ Dodato u SECURITY_CHECKLIST.md
- ✅ Implementiran webhook secret validation
- ✅ Rate limiting per `user_id`

---

#### Lesson #003 - Database Role Permissions
**Date:** 2026-01-16  
**Category:** Security  
**Severity:** 🟠 HIGH

**What We Learned:**
- AI često generiše `GRANT ALL` umesto minimalnih privilegija
- `anon` role ne treba da ima `UPDATE` ili `DELETE` privilegije
- RLS policies nisu dovoljne bez pravilnih role permissions

**Prevention:**
- ✅ Dodato u SECURITY_CHECKLIST.md
- ✅ Mandatory review svih database permissions
- ✅ Automated testing za role permissions

---

### Performance

*(Trenutno nema zabeleženih lekcija)*

---

### Architecture

*(Trenutno nema zabeleženih lekcija)*

---

### UX

#### Lesson #004 - Calendar Height Jumping
**Date:** 2026-01-16  
**Category:** UX  
**Severity:** 🟡 MEDIUM

**What We Learned:**
- Kalendari koji menjaju visinu prilikom navigacije kroz mesece stvaraju loše UX
- Korisnici očekuju stabilan layout bez "skakanja"
- Padding sa praznim poljima do 6 redova rešava problem

**Code Example:**

**Before (❌ Bad):**
```typescript
// Kalendar prikazuje samo dane koji postoje
for (let i = 1; i <= totalDays; i++) {
  days.push(<div>{i}</div>);
}
```

**After (✅ Good):**
```typescript
// Kalendar uvek prikazuje 6 redova (42 polja)
for (let i = 1; i <= totalDays; i++) {
  days.push(<div>{i}</div>);
}
// Padding do 42
Array.from({ length: 42 - days.length }).map((_, i) => (
  <div key={`empty-${i}`} className="empty"></div>
));
```

**Prevention:**
- ✅ Dodato u component best practices
- ✅ Fixed height za sve modale

---

## 📊 Statistics

**Total Lessons:** 4  
**Security:** 3  
**Performance:** 0  
**Architecture:** 0  
**UX:** 1  
**Other:** 0

---

## 🎯 Recurring Themes

### Top 3 Issues:
1. **Security:** AI-generated code često propušta security checks
2. **Validation:** Input validation često nedostaje
3. **Error Handling:** Try-catch blokovi bez proper logging

### Top 3 Solutions:
1. **Self-Reflection Checklist:** Mandatory pre svakog commit-a
2. **Code Review:** Automated + manual review
3. **Documentation:** Ažuriranje AI_AGENT_MASTER_PROMPT.md

---

## 🔄 Continuous Improvement

### Monthly Review Process:
1. Pregledaj sve nove lessons
2. Identifikuj recurring patterns
3. Ažuriraj AI_AGENT_MASTER_PROMPT.md
4. Ažuriraj SECURITY_CHECKLIST.md
5. Share sa timom (ako postoji)

---

**Last Updated:** 2026-01-16  
**Next Review:** 2026-02-16
