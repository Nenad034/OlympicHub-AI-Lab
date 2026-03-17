# NeoTravel Search Module - Source Code Export

This document contains the complete, self-contained source code for the search system as implemented in the NeoTravel platform. It is designed for easy migration to other applications.

## 1. CSS Styles (Global or Scoped)
Add these styles to your global CSS file or a dedicated `SearchModule.css`.

```css
/* NeoTravel Search Assets */
:root {
  --bordo: #800020;
  --emerald: #10B981;
  --amber: #F59E0B;
}

.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--bordo);
  color: white !important;
  border: none;
  border-radius: 12px;
  padding: 10px 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
  box-shadow: 0 8px 16px rgba(128, 0, 32, 0.2);
}

.search-type-tab {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 4px;
}

.type-tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.5);
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
  padding: 0 8px 12px 8px;
  margin-bottom: -1px;
  min-width: 90px;
}

.type-tab-item.active {
  color: var(--bordo);
  border-bottom-color: var(--bordo);
}

.type-tab-item span {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.search-input-field {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-field label {
  position: absolute;
  top: 8px;
  left: 48px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.5);
  text-transform: capitalize;
  z-index: 10;
  pointer-events: none;
}

.search-input-field input {
  width: 100%;
  padding: 24px 16px 8px 48px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  background: rgba(255,255,255,0.4);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  outline: none;
  height: 64px;
  transition: all 0.2s;
}

.search-input-field input:focus {
  background: white;
  border-color: var(--bordo);
}

.ai-summary {
  font-style: italic;
  font-size: 13px;
  color: var(--bordo);
  opacity: 0.9;
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--bordo);
}

.service-selection-card {
  cursor: pointer;
  transition: all 0.2s;
}

.service-selection-card:hover {
  border-color: var(--bordo);
  transform: translateY(-2px);
}

.mini-stepper {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.mini-step {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(0,0,0,0.05);
  position: relative;
}

.mini-step.active {
  background: var(--bordo);
}
```

## 2. React Component (`SearchModule.tsx`)
This is the full React logic including hooks and dummy search data.

```tsx
import React, { useState } from 'react';
import { 
  Building2, Plane, ShoppingBag, Navigation, Map, Anchor, Compass, Zap, Car, 
  MapPin, CalendarDays, Users, Bus, Clock, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
export interface Selection { 
  id: string; 
  type: string; 
  name: string; 
  price: number; 
  icon: React.ReactNode; 
  aiSummary?: string; 
}

// --- Mock Data ---
export const MOCK_SEARCH_RESULTS = [
  { id: 'h-1', type: 'Accommodation', name: 'Rixos Premium Magawish', location: 'Hurghada, Egypt', price: 145, rating: 5, tags: ['UAI', 'Luxury'], aiSummary: 'Idealno za porodice.', prediction: 'Only 3 left', icon: <Building2 color="#800020" size={24} /> },
  { id: 'h-2', type: 'Accommodation', name: 'Steigenberger ALDAU Beach', location: 'Hurghada, Egypt', price: 125, rating: 5, tags: ['AI', 'Beachfront'], aiSummary: 'Vrhunski spa centar.', prediction: 'High demand', icon: <Building2 color="#800020" size={24} /> },
  { id: 'h-4', type: 'Accommodation', name: 'Baron Palace Sahl Hasheesh', location: 'Sahl Hasheesh, Egypt', price: 180, rating: 5, tags: ['UAI', 'Palace'], aiSummary: 'Ultimativni luksuz.', prediction: 'Member Deal', icon: <Building2 color="#800020" size={24} /> },
  { id: 'f-1', type: 'Flight', name: 'Air Cairo SM381', location: 'BEG -> HRG', price: 320, rating: 4.5, tags: ['Direct', '7KG Cabin'], aiSummary: 'Najbrži let direktno do Hurgade.', prediction: 'Good price', icon: <Plane color="#800020" size={24} /> },
  { id: 'f-2', type: 'Flight', name: 'Turkish Airlines TK1082', location: 'BEG -> IST -> HRG', price: 410, rating: 5, tags: ['1 Stop', '30KG Luggage'], aiSummary: 'Vrhunski komfor.', prediction: 'Premium', icon: <Plane color="#800020" size={24} /> },
  { id: 'a-1', type: 'Activity', name: 'Giftun Island Speedboat', location: 'Hurghada Port', price: 65, rating: 5, tags: ['Snorkeling', 'Lunch'], aiSummary: 'Must see!', prediction: 'Popular', icon: <Map color="#800020" size={24} /> }
];

interface SearchModuleProps {
  onServiceSelect?: (service: Selection) => void;
}

export const SearchModule: React.FC<SearchModuleProps> = ({ onServiceSelect }) => {
  const [searchFilter, setSearchFilter] = useState('Packages');
  const [packageStep, setPackageStep] = useState(0); 

  const tabs = [
    { id: 'Stays', label: 'Smeštaj', icon: <Building2 size={22} />, fields: ['city-hotel', 'dates', 'rooms'] },
    { id: 'Flights', label: 'Letovi', icon: <Plane size={22} />, fields: ['from', 'to', 'dates', 'passengers'] },
    { id: 'Packages', label: 'Dinamika', icon: <ShoppingBag size={22} />, fields: ['from', 'to', 'dates', 'rooms'] },
    { id: 'Transfers', label: 'Transferi', icon: <Navigation size={22} />, fields: ['from-to', 'dates', 'time'] },
    { id: 'Things', label: 'Izleti', icon: <Map size={22} />, fields: ['destination', 'dates'] },
    { id: 'Cruises', label: 'Krstarenja', icon: <Anchor size={22} />, fields: ['destination', 'dates', 'cruise-line'] },
    { id: 'Putovanja', label: 'Putovanja', icon: <Compass size={22} />, fields: ['destination', 'dates'] },
    { id: 'Charteri', label: 'Čarteri', icon: <Zap size={22} />, fields: ['from', 'to', 'dates'] },
    { id: 'Cars', label: 'Cars', icon: <Car size={22} />, fields: ['pickup', 'dates'] }
  ];

  const currentTab = tabs.find(t => t.id === searchFilter) || tabs[0];
  
  const handleInternalSelect = (service: any) => {
    setPackageStep(prev => Math.min(prev + 1, 4));
    if (onServiceSelect) {
      onServiceSelect({
        id: service.id,
        type: service.type,
        name: service.name,
        price: service.price,
        icon: service.icon,
        aiSummary: service.aiSummary
      });
    }
  };

  const renderFields = () => {
    return currentTab.fields.map((field, idx) => {
      const styles = { position: 'absolute', left: '16px', opacity: 0.6 };
      const commonInp = { height: '64px', border: 'none', background: 'transparent', outline: 'none' };
      
      switch(field) {
        case 'city-hotel': return <div key={idx} className="search-input-field"><label>City or Hotel</label><MapPin size={18} style={styles as any} /><input type="text" placeholder="Hurgada, Egypt" style={commonInp} /></div>;
        case 'from': return <div key={idx} className="search-input-field"><label>Leaving from</label><MapPin size={18} style={styles as any} /><input type="text" defaultValue="Belgrade (BEG)" style={commonInp} /></div>;
        case 'to': return <div key={idx} className="search-input-field"><label>Going to</label><MapPin size={18} style={styles as any} /><input type="text" placeholder="Antalya, Turkey" style={commonInp} /></div>;
        case 'dates': return <div key={idx} className="search-input-field"><label>Dates</label><CalendarDays size={18} style={styles as any} /><input type="text" readOnly value="18 Mar - 25 Mar" style={commonInp} /></div>;
        case 'rooms': return <div key={idx} className="search-input-field"><label>Rooms & Travellers</label><Users size={18} style={styles as any} /><input type="text" readOnly value="1 Room, 2 Adults" style={commonInp} /></div>;
        case 'passengers': return <div key={idx} className="search-input-field"><label>Travellers</label><Users size={18} style={styles as any} /><input type="text" readOnly value="2 Adults" style={commonInp} /></div>;
        default: return <div key={idx} className="search-input-field"><label>{field}</label><MapPin size={18} style={styles as any} /><input type="text" placeholder="..." style={commonInp} /></div>;
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="search-type-tab" style={{ justifyContent: 'center' }}>
         {tabs.map(tab => (
           <div key={tab.id} className={`type-tab-item ${searchFilter === tab.id ? 'active' : ''}`} onClick={() => setSearchFilter(tab.id)}>
              <div style={{ marginBottom: '4px' }}>{tab.icon}</div>
              <span>{tab.label}</span>
           </div>
         ))}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${currentTab.fields.length}, 1fr) 180px`, 
        gap: '8px', 
        alignItems: 'center', 
        background: 'rgba(255,255,255,0.8)', 
        padding: '8px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
      }}>
         {renderFields()}
         <button className="btn-primary" style={{ height: '64px', borderRadius: '12px' }}>PRETRAGA</button>
      </div>

      <div style={{ marginTop: '8px' }}>
         <div className="mini-stepper">
            {['Izbor 1', 'Izbor 2', 'Izbor 3', 'Kraj'].map((label, idx) => (
               <div key={label} className={`mini-step ${packageStep >= idx ? 'active' : ''}`} />
            ))}
         </div>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence mode="popLayout">
            {packageStep < 4 ? (
               MOCK_SEARCH_RESULTS.filter(r => {
                  if (searchFilter === 'Stays') return r.type === 'Accommodation';
                  if (searchFilter === 'Flights') return r.type === 'Flight';
                  return true;
               }).map(res => (
                  <motion.div key={res.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card service-selection-card" style={{ padding: '12px 24px' }}>
                     <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(128,0,32,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{res.icon}</div>
                        <div style={{ flex: 1 }}>
                           <h4 style={{ fontSize: '15px', fontWeight: '800' }}>{res.name}</h4>
                           <div className="ai-summary">{res.aiSummary}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                           <div style={{ fontSize: '20px', fontWeight: '900' }}>€{res.price}</div>
                           <button className="btn-primary" onClick={() => handleInternalSelect(res)}>IZABERI</button>
                        </div>
                     </div>
                  </motion.div>
               ))
            ) : (
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '60px 0' }}>
                  <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
                  <h2 style={{ fontSize: '24px', fontWeight: '900' }}>Rezervacija je spremna!</h2>
               </motion.div>
            )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};
```

## 3. Search Engine & Business Logic (`Engine.ts`)
Ovo je "mozak" koji računa cene, primenjuje popuste i validira pakete. Možete ga spojiti u jedan fajl ili držati odvojeno.

```typescript
/**
 * NeoTravel Core Engine - Logic for bundling, prices and AI rules
 */

// --- Simple Result Pattern (In case you don't have it) ---
export type Result<T, E = Error> = { ok: true, value: T } | { ok: false, error: E };
export const ok = <T>(value: T): Result<T, any> => ({ ok: true, value });
export const fail = <E>(error: E): Result<any, E> => ({ ok: false, error });

// --- Bundle Rule Entity ---
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'HYBRID';

export interface BundleRuleProps {
  id?: string;
  name: string;
  requiredItemTypes: string[]; 
  discountType: DiscountType;
  discountPercentage?: number;
  discountFixedAmount?: number;
  isActive: boolean;
  priority: number; 
  approvedBy?: string;
}

export class BundleRuleEntity {
  constructor(public props: BundleRuleProps) {}

  matches(itemTypes: string[]): boolean {
    if (!this.props.isActive || !this.props.approvedBy) return false;
    const upperItemTypes = itemTypes.map(t => t.toUpperCase());
    return this.props.requiredItemTypes.every(req => upperItemTypes.includes(req.toUpperCase()));
  }

  calculateDiscount(basePrice: number): number {
    let discount = 0;
    if (this.props.discountType === 'PERCENTAGE' || this.props.discountType === 'HYBRID') {
      discount += basePrice * ((this.props.discountPercentage || 0) / 100);
    }
    if (this.props.discountType === 'FIXED_AMOUNT' || this.props.discountType === 'HYBRID') {
      discount += (this.props.discountFixedAmount || 0);
    }
    return discount;
  }
}

// --- Bundle Rule Service ---
export class BundleRuleService {
  private static rules: BundleRuleEntity[] = [];

  public static getActiveRules(): BundleRuleEntity[] {
    return this.rules.filter(r => r.props.isActive && r.props.approvedBy);
  }

  public static seedInitialRules(): void {
    this.rules = [
      new BundleRuleEntity({
        id: 'rule-1',
        name: 'Standard Package Discount',
        requiredItemTypes: ['HOTEL', 'FLIGHT', 'TRANSFER'],
        discountType: 'PERCENTAGE',
        discountPercentage: 5,
        isActive: true,
        priority: 1,
        approvedBy: 'Admin'
      })
    ];
  }
}

// --- Dynamic Packaging Engine (DPE) ---
export class DynamicPackagingEngine {
  
  public static validatePackage(items: any[]): { isValid: boolean, suggestions: string[] } {
    const suggestions: string[] = [];
    const hasHotel = items.some(i => i.type === 'HOTEL' || i.type === 'ACCOMMODATION');
    const hasFlight = items.some(i => i.type === 'FLIGHT');
    const hasTransfer = items.some(i => i.type === 'TRANSFER');

    if (hasHotel && hasFlight && !hasTransfer) {
      suggestions.push("Sugestija: Dodati privatni transfer do hotela.");
    }

    return { isValid: true, suggestions };
  }

  public static calculateBundlePrice(items: { price: number, type: string }[]): number {
    const basePrice = items.reduce((sum, item) => sum + item.price, 0);
    const itemTypes = items.map(i => i.type.toUpperCase());
    
    const rules = BundleRuleService.getActiveRules();
    let totalDiscount = 0;

    for (const rule of rules) {
      if (rule.matches(itemTypes)) {
        totalDiscount += rule.calculateDiscount(basePrice);
      }
    }
    
    return Math.max(0, basePrice - totalDiscount);
  }
}
```

## Kako integrisati motor u UI?
U vašoj `SearchModule.tsx` komponenti, umesto običnog sabiranja cena, koristite motor ovako:

```tsx
// Primer integracije
const totalPrice = DynamicPackagingEngine.calculateBundlePrice(selectedServices);
const validation = DynamicPackagingEngine.validatePackage(selectedServices);
```
