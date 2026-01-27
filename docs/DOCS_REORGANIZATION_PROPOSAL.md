# 📁 Predlog Reorganizacije `docs` Foldera

**Datum**: 2026-01-10  
**Razlog**: Bolji pregled i lakše pronalaženje dokumentacije

---

## 🎯 Trenutno Stanje

Trenutno imamo **54 fajla** u root-u `docs` foldera, što otežava navigaciju i pronalaženje relevantne dokumentacije.

---

## 📂 Predložena Struktura

```
docs/
├── README.md (glavni index sa linkovima)
├── INDEPENDENT_DEVELOPMENT_LOG.md (ostaje u root-u)
│
├── 01-architecture/          # Arhitektura sistema
│   ├── ARCHITECTURE.md
│   ├── COMPONENTS.md
│   ├── AI_AGENT_ARCHITECTURE.md
│   ├── HOTEL_PROVIDER_ARCHITECTURE.md
│   ├── FLIGHT_API_ARCHITECTURE.md
│   ├── DYNAMIC_PACKAGES_ARCHITECTURE.md
│   └── UNIFIED_API_GATEWAY_PROPOSAL.md
│
├── 02-api-integration/       # API integracije
│   ├── API.md
│   ├── API_INTEGRATION_CHECKLIST.md
│   ├── API_INTEGRATION_PATTERNS.md
│   ├── API_INTEGRATION_TEMPLATE.md
│   ├── RATE_LIMITING.md
│   ├── UNIFIED_API_TEST.md
│   │
│   ├── tct/                  # TCT specifična dokumentacija
│   │   ├── TCT_DOCUMENTATION_INDEX.md
│   │   ├── TCT_INTEGRATION_PLAN.md
│   │   ├── TCT_B2B_ACTIVATION_PROCEDURE.md
│   │   ├── TCT_B2B_QUICK_REFERENCE.md
│   │   ├── TCT_SECURITY_QUICK_START.md
│   │   └── TCT_SECURITY_TOOLS.md
│   │
│   ├── opengreece/
│   │   └── OPENGREECE_API_DOCUMENTATION.md
│   │
│   ├── solvex/
│   │   ├── SOLVEX_INTEGRATION_SUMMARY.md
│   │   ├── SOLVEX_DEBUG_LOG.md
│   │   ├── SOLVEX_SUCCESS_REPORT.md
│   │   └── SOLVEX_TEST_RESULTS.ts
│   │
│   └── google-maps/
│       └── GOOGLE_MAPS_SETUP.md
│
├── 03-features/              # Implementacije feature-a
│   ├── master-search/
│   │   └── MASTER_SEARCH_PLAN.md
│   │
│   ├── packages/
│   │   ├── PACKAGE_BUILDER_IMPLEMENTATION_LOG.md
│   │   ├── PACKAGE_BUILDER_SUMMARY.md
│   │   ├── PACKAGE_BUILDER_USER_GUIDE.md
│   │   ├── PACKAGE_SEARCH_PROGRESS.md
│   │   ├── PACKAGE_SEARCH_WIZARD_PLAN.md
│   │   └── DYNAMIC_PACKAGE_WIZARD_MASTER_SUMMARY.md
│   │
│   ├── flights/
│   │   ├── FLIGHT_API_IMPLEMENTATION_LOG.md
│   │   └── FLIGHT_USER_GUIDE.md
│   │
│   ├── email/
│   │   ├── EMAIL_IMPLEMENTATION_SUMMARY.md
│   │   ├── EMAIL_SETUP.md
│   │   └── QUICKSTART_EMAIL.md
│   │
│   └── ai-systems/
│       ├── AI_WATCHDOG_DOCUMENTATION.md
│       ├── AI_WATCHDOG_ENHANCEMENTS.md
│       ├── ORCHESTRATOR_ACCESS_LEVELS.md
│       ├── CONSULTATIVE_INTELLIGENCE.md
│       └── FORTRESS.md
│
├── 04-security/              # Sigurnost
│   ├── SECURITY.md
│   ├── SECURITY_CHECKLIST.md
│   ├── SECURITY_COMPLETED.md
│   ├── SECURITY_IMPLEMENTATION.md
│   └── SECURITY_STABILITY_PERFORMANCE_QA.md
│
├── 05-development/           # Development procesi
│   ├── CODE_QUALITY_STANDARDS.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── REFACTORING_PLAN.md
│   └── FILE_VERIFICATION.md
│
├── 06-deployment/            # Deployment
│   └── DEPLOYMENT_GUIDE.md
│
├── api/                      # Postojeći API folder (ostaje)
│   └── (existing files)
│
└── legal/                    # Postojeći Legal folder (ostaje)
    └── (existing files)
```

---

## 📋 Detaljna Raspodela Fajlova

### 1️⃣ **Architecture** (7 fajlova)
- ARCHITECTURE.md
- COMPONENTS.md
- AI_AGENT_ARCHITECTURE.md
- HOTEL_PROVIDER_ARCHITECTURE.md
- FLIGHT_API_ARCHITECTURE.md
- DYNAMIC_PACKAGES_ARCHITECTURE.md
- UNIFIED_API_GATEWAY_PROPOSAL.md

**Razlog**: Svi fajlovi koji opisuju arhitekturu sistema

---

### 2️⃣ **API Integration** (20 fajlova)
**Root API docs** (7):
- API.md
- API_INTEGRATION_CHECKLIST.md
- API_INTEGRATION_PATTERNS.md
- API_INTEGRATION_TEMPLATE.md
- RATE_LIMITING.md
- UNIFIED_API_TEST.md

**TCT subfolder** (6):
- TCT_DOCUMENTATION_INDEX.md
- TCT_INTEGRATION_PLAN.md
- TCT_B2B_ACTIVATION_PROCEDURE.md
- TCT_B2B_QUICK_REFERENCE.md
- TCT_SECURITY_QUICK_START.md
- TCT_SECURITY_TOOLS.md

**OpenGreece subfolder** (1):
- OPENGREECE_API_DOCUMENTATION.md

**Solvex subfolder** (4):
- SOLVEX_INTEGRATION_SUMMARY.md
- SOLVEX_DEBUG_LOG.md
- SOLVEX_SUCCESS_REPORT.md
- SOLVEX_TEST_RESULTS.ts

**Google Maps subfolder** (1):
- GOOGLE_MAPS_SETUP.md

**Razlog**: Sve API integracije grupisane po provajderima

---

### 3️⃣ **Features** (17 fajlova)

**Master Search** (1):
- MASTER_SEARCH_PLAN.md

**Packages** (6):
- PACKAGE_BUILDER_IMPLEMENTATION_LOG.md
- PACKAGE_BUILDER_SUMMARY.md
- PACKAGE_BUILDER_USER_GUIDE.md
- PACKAGE_SEARCH_PROGRESS.md
- PACKAGE_SEARCH_WIZARD_PLAN.md
- DYNAMIC_PACKAGE_WIZARD_MASTER_SUMMARY.md

**Flights** (2):
- FLIGHT_API_IMPLEMENTATION_LOG.md
- FLIGHT_USER_GUIDE.md

**Email** (3):
- EMAIL_IMPLEMENTATION_SUMMARY.md
- EMAIL_SETUP.md
- QUICKSTART_EMAIL.md

**AI Systems** (5):
- AI_WATCHDOG_DOCUMENTATION.md
- AI_WATCHDOG_ENHANCEMENTS.md
- ORCHESTRATOR_ACCESS_LEVELS.md
- CONSULTATIVE_INTELLIGENCE.md
- FORTRESS.md

**Razlog**: Grupisanje po feature-ima olakšava pronalaženje dokumentacije za specifične funkcionalnosti

---

### 4️⃣ **Security** (5 fajlova)
- SECURITY.md
- SECURITY_CHECKLIST.md
- SECURITY_COMPLETED.md
- SECURITY_IMPLEMENTATION.md
- SECURITY_STABILITY_PERFORMANCE_QA.md

**Razlog**: Sva sigurnosna dokumentacija na jednom mestu

---

### 5️⃣ **Development** (4 fajla)
- CODE_QUALITY_STANDARDS.md
- IMPLEMENTATION_SUMMARY.md
- REFACTORING_PLAN.md
- FILE_VERIFICATION.md

**Razlog**: Development procesi i standardi

---

### 6️⃣ **Deployment** (1 fajl)
- DEPLOYMENT_GUIDE.md

**Razlog**: Deployment dokumentacija

---

## ✅ Prednosti Nove Strukture

1. **Lakša Navigacija**: Umesto 54 fajla u root-u, imamo 6 jasno definisanih kategorija
2. **Logičko Grupisanje**: Slični fajlovi su zajedno
3. **Skalabilnost**: Lako dodavanje novih fajlova u odgovarajuće foldere
4. **Brže Pronalaženje**: Znate gde tražiti specifičnu dokumentaciju
5. **Bolja Organizacija**: API integracije grupisane po provajderima

---

## 🔄 Migracija

Mogu da kreiram bash/PowerShell skriptu koja će automatski:
1. Kreirati nove foldere
2. Premestiti fajlove u odgovarajuće lokacije
3. Ažurirati README.md sa novim linkovima
4. Commitovati izmene na GitHub

---

## ❓ Pitanja za Vas

1. **Da li odobravate ovu strukturu?**
2. **Želite li neke izmene u grupisanju?**
3. **Da li da odmah kreiram skriptu za migraciju?**
4. **Da li želite da dodam još neke kategorije?**

---

**Napomena**: Postojeći `api/` i `legal/` folderi ostaju netaknuti.
