# 🔐 Master Orchestrator - Access Levels

## 📋 Pregled Nivoa Pristupa

Master Orchestrator koristi **hijerarhijski sistem nivoa pristupa** koji određuje koji agenti su dostupni svakom korisniku na osnovu njihovog nivoa u sistemu.

## 👥 Nivoi Korisnika

### Level 1: Korisnik (User)
**Osnovni nivo** - Pristup osnovnim funkcijama

**Dostupni Agenti:**
- ✅ **Mail Agent** - Analiza i upravljanje email-ovima

**Opis**: Korisnici na ovom nivou mogu samo da koriste Mail Agent za osnovnu email komunikaciju.

---

### Level 2: Operater (Operator)
**Operativni nivo** - Pristup operativnim funkcijama

**Dostupni Agenti:**
- ✅ **Mail Agent** - Email komunikacija
- ✅ **Hotel Agent** - Pretraga i upravljanje hotelima
- ✅ **Customer Agent** - Upravljanje kupcima i booking history

**Opis**: Operateri mogu da pretražuju hotele, upravljaju sobama i rade sa kupcima.

---

### Level 3: Menadžer (Manager)
**Menadžerski nivo** - Pristup poslovnim funkcijama

**Dostupni Agenti:**
- ✅ **Mail Agent** - Email komunikacija
- ✅ **Hotel Agent** - Upravljanje hotelima
- ✅ **Customer Agent** - Upravljanje kupcima
- ✅ **Pricing Agent** - Kalkulacija cena, popusti, market analiza

**Opis**: Menadžeri mogu da upravljaju cenama, primenjuju popuste i analiziraju tržište.

---

### Level 4: Administrator (Admin)
**Administrativni nivo** - Pristup podacima i analytics

**Dostupni Agenti:**
- ✅ **Mail Agent** - Email komunikacija
- ✅ **Hotel Agent** - Upravljanje hotelima
- ✅ **Customer Agent** - Upravljanje kupcima
- ✅ **Pricing Agent** - Upravljanje cenama
- ✅ **Data Agent** - Database queries, analytics, reporting

**Opis**: Administratori imaju pristup svim podacima i mogu da generišu izveštaje.

---

### Level 5: Super Admin
**Super administrativni nivo** - Pun pristup svim funkcijama osim security

**Dostupni Agenti:**
- ✅ **Mail Agent** - Email komunikacija
- ✅ **Hotel Agent** - Upravljanje hotelima
- ✅ **Customer Agent** - Upravljanje kupcima
- ✅ **Pricing Agent** - Upravljanje cenama
- ✅ **Data Agent** - Database i analytics

**Opis**: Super admini imaju pristup svim agentima osim Fortress Agent-a.

---

### Level 6: Master
**Najviši nivo** - Potpun pristup svim agentima

**Dostupni Agenti:**
- ✅ **Mail Agent** - Email komunikacija
- ✅ **Hotel Agent** - Upravljanje hotelima
- ✅ **Customer Agent** - Upravljanje kupcima
- ✅ **Pricing Agent** - Upravljanje cenama
- ✅ **Data Agent** - Database i analytics
- ✅ **Fortress Agent** - Security analysis, threat detection, recommendations

**Opis**: Master korisnici imaju potpun pristup svim agentima uključujući i Fortress Agent za security analizu.

---

## 🎨 Vizuelni Indikatori

Svaki agent u Agent Registry-ju prikazuje **Level Badge** sa bojom koja odgovara nivou pristupa:

| Level | Boja | Primer |
|-------|------|--------|
| 1-2 | 🔵 Plava | `Lvl 1`, `Lvl 2` |
| 3 | 🟢 Zelena | `Lvl 3` |
| 4-5 | 🟣 Ljubičasta | `Lvl 4`, `Lvl 5` |
| 6 | 🔴 Crvena | `Lvl 6` |

## 📊 Tabela Pristupa

| Agent | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 | Level 6 |
|-------|---------|---------|---------|---------|---------|---------|
| **Mail Agent** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hotel Agent** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Customer Agent** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pricing Agent** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Data Agent** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Fortress Agent** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🔧 Implementacija

### Definicija Agenata

```typescript
const allAgents: Agent[] = [
    {
        id: 'mail-agent',
        name: 'Mail Agent',
        minLevel: 1, // Svi mogu da koriste
        // ...
    },
    {
        id: 'hotel-agent',
        name: 'Hotel Agent',
        minLevel: 2, // Operater i više
        // ...
    },
    {
        id: 'pricing-agent',
        name: 'Pricing Agent',
        minLevel: 3, // Menadžer i više
        // ...
    },
    {
        id: 'data-agent',
        name: 'Data Agent',
        minLevel: 4, // Admin i više
        // ...
    },
    {
        id: 'fortress-agent',
        name: 'Fortress Agent',
        minLevel: 6, // Samo Master
        // ...
    }
];
```

### Filtriranje Agenata

```typescript
// Filter agents based on user level
const agents = allAgents.filter(agent => userLevel >= agent.minLevel);
```

### Prikaz Level Badge-a

```tsx
<span style={{
    fontSize: '9px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '6px',
    background: agent.minLevel === 6 ? 'rgba(239, 68, 68, 0.1)' : 
               agent.minLevel >= 4 ? 'rgba(139, 92, 246, 0.1)' :
               agent.minLevel >= 3 ? 'rgba(16, 185, 129, 0.1)' :
               'rgba(59, 130, 246, 0.1)',
    color: agent.minLevel === 6 ? '#ef4444' : 
           agent.minLevel >= 4 ? '#8b5cf6' :
           agent.minLevel >= 3 ? '#10b981' :
           '#3b82f6'
}}>
    Lvl {agent.minLevel}
</span>
```

## 🎯 Use Cases

### Scenario 1: Operater (Level 2)
**Dostupni agenti**: Mail, Hotel, Customer

**Primer upita**:
```
"Pronađi hotel u Budvi za 2 osobe"
→ Aktivira: Hotel Agent ✅
→ Pricing Agent nije dostupan ❌
```

### Scenario 2: Menadžer (Level 3)
**Dostupni agenti**: Mail, Hotel, Customer, Pricing

**Primer upita**:
```
"Pronađi hotel u Budvi i izračunaj cenu sa popustom"
→ Aktivira: Hotel Agent ✅, Pricing Agent ✅
```

### Scenario 3: Master (Level 6)
**Dostupni agenti**: Svi (Mail, Hotel, Customer, Pricing, Data, Fortress)

**Primer upita**:
```
"Analiziraj security status i prikaži podatke o napadima"
→ Aktivira: Fortress Agent ✅, Data Agent ✅
```

## 🔒 Security Considerations

1. **Fortress Agent** je dostupan **samo Master korisnicima** (Level 6)
2. **Data Agent** je dostupan samo **Admin i višim nivoima** (Level 4+)
3. **Pricing Agent** je dostupan **Menadžerima i višim nivoima** (Level 3+)
4. **Mail Agent** je dostupan **svim korisnicima** (Level 1+)

## 📝 Best Practices

1. **Principle of Least Privilege**: Korisnici dobijaju pristup samo agentima koji su im potrebni za njihovu ulogu
2. **Gradual Escalation**: Nivoi pristupa se povećavaju postepeno sa povećanjem odgovornosti
3. **Clear Visual Indicators**: Level badge-ovi jasno pokazuju koji nivo je potreban
4. **Dynamic Filtering**: Agenti se automatski filtriraju na osnovu user level-a

---

**Napomena**: Nivoi pristupa se mogu lako ažurirati u `MasterOrchestrator.tsx` promenom `minLevel` vrednosti za svakog agenta.
