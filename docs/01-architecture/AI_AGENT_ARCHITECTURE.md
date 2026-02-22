# 🤖 AI Agent Management System - Arhitektura

## 📋 Pregled

OlympicHub koristi **Multi-Agent Architecture** gde svaki modul ima svog specijalizovanog AI agenta, a **Master Orchestrator Agent** koordinira sve agente i upravlja komunikacijom između njih.

## 🏗️ Arhitektura Sistema

### Hijerarhija Agenata

```
┌─────────────────────────────────────────┐
│   🧠 Master Orchestrator Agent          │
│   (Upravlja svim agentima)              │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│ Agent Registry │  │ Context Manager │
│ (Katalog)      │  │ (Kontekst)      │
└───────┬────────┘  └──────┬──────────┘
        │                   │
        └─────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│ Mail  │    │ Hotel │    │ Price │
│ Agent │    │ Agent │    │ Agent │
└───────┘    └───────┘    └───────┘
    │             │             │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│Supplier│   │Customer│   │Fortress│
│ Agent │    │ Agent │    │ Agent │
└───────┘    └───────┘    └───────┘
```

## 🎯 Komponente Sistema

### 1. **Master Orchestrator Agent**

**Uloga**: Glavni AI agent koji:
- Razume korisnikov zahtev
- Određuje koji specijalizovani agent(i) treba da odgovori
- Koordinira komunikaciju između agenata
- Agregira odgovore i vraća finalni rezultat

**Primer**:
```
User: "Pronađi hotel u Budvi za 2 osobe, 7 noći, sa doručkom"

Master Orchestrator:
1. Analizira zahtev
2. Identifikuje potrebne agente: Hotel Agent + Pricing Agent
3. Šalje kontekst agentima
4. Agregira rezultate
5. Vraća formatiran odgovor
```

### 2. **Agent Registry** (Katalog Agenata)

**Uloga**: Centralni registar svih dostupnih agenata

```typescript
interface AgentDefinition {
  id: string;
  name: string;
  module: string;
  capabilities: string[];
  context: string[];
  priority: number;
  status: 'active' | 'inactive' | 'training';
}

const agentRegistry: AgentDefinition[] = [
  {
    id: 'hotel-agent',
    name: 'Hotel Management Agent',
    module: 'production-hub',
    capabilities: [
      'search_hotels',
      'create_hotel',
      'update_hotel',
      'manage_rooms',
      'manage_prices'
    ],
    context: ['hotels', 'rooms', 'amenities', 'locations'],
    priority: 1,
    status: 'active'
  },
  {
    id: 'pricing-agent',
    name: 'Pricing Intelligence Agent',
    module: 'pricing-intelligence',
    capabilities: [
      'calculate_price',
      'apply_discounts',
      'compare_prices',
      'suggest_pricing'
    ],
    context: ['prices', 'discounts', 'seasons', 'competitors'],
    priority: 2,
    status: 'active'
  },
  // ... ostali agenti
];
```

### 3. **Context Manager** (Upravljanje Kontekstom)

**Uloga**: Upravlja kontekstom i stanjem konverzacije

```typescript
interface ConversationContext {
  sessionId: string;
  userId: string;
  userLevel: number;
  currentModule: string;
  history: Message[];
  entities: ExtractedEntity[];
  activeAgents: string[];
  sharedData: Record<string, any>;
}

interface ExtractedEntity {
  type: 'hotel' | 'customer' | 'date' | 'price' | 'location';
  value: any;
  confidence: number;
  source: string; // koji agent je izvukao
}
```

### 4. **Specijalizovani Agenti**

Svaki modul ima svog agenta:

#### a) **Hotel Agent**
```typescript
const hotelAgent: AgentDefinition = {
  id: 'hotel-agent',
  name: 'Hotel Management Agent',
  systemPrompt: `
    Ti si specijalizovani AI agent za upravljanje hotelima u OlympicHub sistemu.
    
    Tvoje sposobnosti:
    - Pretraga hotela po lokaciji, kategoriji, uslugama
    - Kreiranje novih hotela
    - Upravljanje sobama i cenama
    - Analiza dostupnosti
    
    Kontekst koji razumeš:
    - Hotel ID, naziv, lokacija, kategorija
    - Sobe: tip, kapacitet, sadržaj
    - Cene: sezona, popusti, uslovi
    
    Kada korisnik pita o hotelu, uvek:
    1. Proveri dostupnost u bazi
    2. Prikaži relevantne informacije
    3. Predloži alternative ako je potrebno
  `,
  tools: [
    'searchHotels',
    'getHotelById',
    'createHotel',
    'updateHotel',
    'getRooms',
    'getPricing'
  ]
};
```

#### b) **Pricing Agent**
```typescript
const pricingAgent: AgentDefinition = {
  id: 'pricing-agent',
  name: 'Pricing Intelligence Agent',
  systemPrompt: `
    Ti si specijalizovani AI agent za pricing intelligence.
    
    Tvoje sposobnosti:
    - Kalkulacija cena na osnovu sezone, tražnje, konkurencije
    - Primena popusta i specijalnih ponuda
    - Analiza tržišta i preporuke za cene
    
    Kontekst koji razumeš:
    - Bazne cene, sezonski koeficijenti
    - Popusti: early bird, last minute, grupni
    - Konkurentske cene
    
    Kada korisnik pita o ceni:
    1. Izračunaj finalnu cenu
    2. Prikaži breakdown (baza + dodaci - popusti)
    3. Predloži optimizacije
  `,
  tools: [
    'calculatePrice',
    'applyDiscounts',
    'getCompetitorPrices',
    'suggestPricing'
  ]
};
```

#### c) **Mail Agent**
```typescript
const mailAgent: AgentDefinition = {
  id: 'mail-agent',
  name: 'Email Management Agent',
  systemPrompt: `
    Ti si specijalizovani AI agent za email komunikaciju.
    
    Tvoje sposobnosti:
    - Analiza email-ova i ekstrakcija zahteva
    - Generisanje odgovora i ponuda
    - Upravljanje email kampanjama
    
    Kontekst koji razumeš:
    - Email struktura, pošiljalac, primalac
    - Zahtevi putnika (destinacija, datum, broj osoba)
    - Template-i za odgovore
    
    Kada analiziraš email:
    1. Ekstraktuj ključne informacije (ko, šta, kada, gde)
    2. Identifikuj tip zahteva (upit, rezervacija, reklamacija)
    3. Predloži odgovarajući odgovor
  `,
  tools: [
    'analyzeEmail',
    'extractEntities',
    'generateResponse',
    'sendEmail'
  ]
};
```

#### d) **Fortress Agent**
```typescript
const fortressAgent: AgentDefinition = {
  id: 'fortress-agent',
  name: 'Security Defense Agent',
  systemPrompt: `
    Ti si specijalizovani AI agent za bezbednost sistema.
    
    Tvoje sposobnosti:
    - Analiza security logs i detekcija anomalija
    - Preporuke za poboljšanje bezbednosti
    - Incident response
    
    Kontekst koji razumeš:
    - Attack types, severity levels
    - IP addresses, user agents
    - Security metrics i trends
    
    Kada analiziraš security event:
    1. Klasifikuj tip pretnje
    2. Proceni severity
    3. Predloži akciju (block, monitor, alert)
  `,
  tools: [
    'analyzeAttack',
    'blockIP',
    'generateSecurityReport',
    'suggestMitigation'
  ]
};
```

## 🔄 Komunikacija Između Agenata

### Agent-to-Agent Protocol

```typescript
interface AgentMessage {
  from: string;        // agent ID
  to: string;          // agent ID ili 'master'
  type: 'request' | 'response' | 'notification';
  payload: {
    action: string;
    data: any;
    context: Partial<ConversationContext>;
  };
  timestamp: string;
  correlationId: string; // za praćenje konverzacije
}
```

### Primer Komunikacije

```
User → Master: "Pronađi hotel u Budvi sa bazenom, cena do 100€ po noći"

Master → Hotel Agent: {
  action: 'search_hotels',
  data: { location: 'Budva', amenities: ['pool'] },
  context: { userQuery: '...' }
}

Hotel Agent → Master: {
  hotels: [
    { id: 'h1', name: 'Hotel Splendid', rooms: [...] },
    { id: 'h2', name: 'Hotel Mediteran', rooms: [...] }
  ]
}

Master → Pricing Agent: {
  action: 'calculate_prices',
  data: { hotelIds: ['h1', 'h2'], maxPrice: 100 },
  context: { hotels: [...] }
}

Pricing Agent → Master: {
  prices: [
    { hotelId: 'h1', price: 95, breakdown: {...} },
    { hotelId: 'h2', price: 85, breakdown: {...} }
  ]
}

Master → User: "Pronašao sam 2 hotela u Budvi sa bazenom..."
```

## 🧠 Učenje Agenata

### 1. **Training Data Structure**

```typescript
interface AgentTrainingData {
  agentId: string;
  examples: TrainingExample[];
  feedback: UserFeedback[];
  performance: PerformanceMetrics;
}

interface TrainingExample {
  input: string;
  expectedOutput: string;
  context: Record<string, any>;
  tags: string[];
}

interface UserFeedback {
  queryId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  wasHelpful: boolean;
}
```

### 2. **Continuous Learning Process**

```
1. Collect Data
   - User queries
   - Agent responses
   - User feedback
   
2. Analyze Patterns
   - Successful interactions
   - Failed interactions
   - Common queries
   
3. Update Training
   - Add new examples
   - Refine system prompts
   - Improve tools
   
4. Test & Validate
   - A/B testing
   - Performance metrics
   - User satisfaction
   
5. Deploy Updates
   - Gradual rollout
   - Monitor performance
   - Rollback if needed
```

### 3. **Agent Performance Metrics**

```typescript
interface PerformanceMetrics {
  agentId: string;
  totalQueries: number;
  successRate: number;
  averageResponseTime: number;
  userSatisfaction: number;
  accuracy: number;
  hallucinations: number; // broj netačnih odgovora
  lastUpdated: string;
}
```

## 🛠️ Implementacija

### Agent Service

```typescript
class AgentService {
  private agents: Map<string, Agent>;
  private contextManager: ContextManager;
  private registry: AgentRegistry;
  
  async processQuery(query: string, context: ConversationContext) {
    // 1. Master Orchestrator analizira query
    const analysis = await this.masterAgent.analyze(query, context);
    
    // 2. Identifikuj potrebne agente
    const requiredAgents = this.identifyAgents(analysis);
    
    // 3. Paralelno pozovi agente
    const responses = await Promise.all(
      requiredAgents.map(agentId => 
        this.callAgent(agentId, analysis, context)
      )
    );
    
    // 4. Agreguj rezultate
    const finalResponse = await this.masterAgent.aggregate(responses);
    
    // 5. Sačuvaj u istoriju
    await this.saveToHistory(query, finalResponse, context);
    
    return finalResponse;
  }
  
  private identifyAgents(analysis: QueryAnalysis): string[] {
    const agents: string[] = [];
    
    // Na osnovu intent-a i entiteta, odaberi agente
    if (analysis.intent === 'search_hotel') {
      agents.push('hotel-agent');
      if (analysis.entities.includes('price')) {
        agents.push('pricing-agent');
      }
    }
    
    if (analysis.intent === 'send_email') {
      agents.push('mail-agent');
    }
    
    return agents;
  }
}
```

## 📚 Best Practices

### 1. **Modularnost**
- Svaki agent je nezavisan modul
- Može raditi standalone
- Komunicira preko standardizovanog protokola

### 2. **Kontekst Sharing**
- Agenti dele kontekst preko Context Manager-a
- Koriste ID-jeve za referenciranje entiteta
- Održavaju konzistentnost podataka

### 3. **Error Handling**
- Graceful degradation (ako jedan agent ne radi, ostali nastavljaju)
- Fallback strategije
- Detaljno logovanje

### 4. **Performance**
- Paralelno izvršavanje gde je moguće
- Caching često korišćenih podataka
- Rate limiting za eksterne API-je

### 5. **Security**
- Validacija svih input-a
- Sanitizacija output-a
- Audit trail svih akcija

## 🎯 Roadmap

### Faza 1: Foundation (Tekuća)
- [x] Agent Registry
- [x] Context Manager
- [ ] Master Orchestrator
- [ ] Basic Agent Templates

### Faza 2: Specialization
- [ ] Hotel Agent
- [ ] Pricing Agent
- [ ] Mail Agent
- [ ] Customer Agent
- [ ] Fortress Agent

### Faza 3: Intelligence
- [ ] Machine Learning Integration
- [ ] Continuous Learning
- [ ] Performance Optimization
- [ ] Advanced Context Understanding

### Faza 4: Scale
- [ ] Multi-language Support
- [ ] Voice Interface
- [ ] Mobile Optimization
- [ ] Enterprise Features

---

**Cilj**: Kreirati najnapredniji AI Agent Management System u travel tech industriji! 🚀
