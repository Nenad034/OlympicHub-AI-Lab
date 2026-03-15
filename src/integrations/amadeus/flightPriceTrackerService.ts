/**
 * Flight Price Tracker Service
 * Amadeus APIs:
 *   - GET /v1/analytics/itinerary-price-metrics  (price analysis: min/avg/max/quartiles)
 *   - GET /v1/shopping/flight-dates              (cheapest dates search)
 *
 * Docs:
 *   https://developers.amadeus.com/self-service/category/flights/api-doc/flight-price-analysis
 *   https://developers.amadeus.com/self-service/category/flights/api-doc/flight-cheapest-date-search
 */

import { getAmadeusAuth } from '../amadeus/api/amadeusAuthService';

const AMADEUS_BASE = import.meta.env.VITE_AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

// ─── Types ────────────────────────────────────────────────────

export interface PriceMetrics {
  quartileRanking: 'MINIMUM' | 'FIRST' | 'MEDIUM' | 'THIRD' | 'MAXIMUM';
  amount: string;
}

export interface ItineraryPriceMetricsResult {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  currencyCode: string;
  oneWay: boolean;
  priceMetrics: PriceMetrics[];
}

export interface CheapestDateResult {
  type: 'flight-date';
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: { total: string };
  links: {
    flightDestinations?: string;
    flightOffers?: string;
  };
}

export interface FlightWatch {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  targetPrice: number;
  currentPrice: number;
  lastChecked: string;
  currency: string;
  notifyOnDrop: boolean;
  notifyOnRise: boolean;
  active: boolean;
  priceHistory: { date: string; price: number }[];
}

// ─── Local Storage Keys ────────────────────────────────────────
const WATCHES_KEY = 'ssv3_flight_watches';

// ─── Price Metrics (Historical Analysis) ─────────────────────
export async function getItineraryPriceMetrics(
  origin: string,
  destination: string,
  departureDate: string,
  options: { currencyCode?: string; oneWay?: boolean } = {}
): Promise<ItineraryPriceMetricsResult[]> {
  try {
    const token = await getAmadeusAuth().getAccessToken();
    const params = new URLSearchParams({
      originIataCode: origin,
      destinationIataCode: destination,
      departureDate,
      ...(options.currencyCode && { currencyCode: options.currencyCode }),
      ...(options.oneWay !== undefined && { oneWay: String(options.oneWay) }),
    });
    const url = `${AMADEUS_BASE}/v1/analytics/itinerary-price-metrics?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Price metrics failed: ${res.status}`);
    const json = await res.json();
    return json.data as ItineraryPriceMetricsResult[];
  } catch (error) {
    console.error('[FlightTracker] getItineraryPriceMetrics error:', error);
    // Return mock data in case API not configured
    return getMockPriceMetrics(origin, destination, departureDate);
  }
}

// ─── Cheapest Dates Search ─────────────────────────────────────
export async function getCheapestDates(
  origin: string,
  destination: string,
  options: {
    departureDate?: string;
    oneWay?: boolean;
    duration?: string;
    nonStop?: boolean;
    maxPrice?: number;
    viewBy?: 'DATE' | 'DURATION' | 'WEEK';
  } = {}
): Promise<CheapestDateResult[]> {
  try {
    const token = await getAmadeusAuth().getAccessToken();
    const params = new URLSearchParams({
      origin,
      destination,
      ...(options.departureDate && { departureDate: options.departureDate }),
      ...(options.oneWay !== undefined && { oneWay: String(options.oneWay) }),
      ...(options.duration && { duration: options.duration }),
      ...(options.nonStop !== undefined && { nonStop: String(options.nonStop) }),
      ...(options.maxPrice && { maxPrice: String(options.maxPrice) }),
      ...(options.viewBy && { viewBy: options.viewBy }),
    });
    const url = `${AMADEUS_BASE}/v1/shopping/flight-dates?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Cheapest dates failed: ${res.status}`);
    const json = await res.json();
    return json.data as CheapestDateResult[];
  } catch (error) {
    console.error('[FlightTracker] getCheapestDates error:', error);
    return getMockCheapestDates(origin, destination);
  }
}

// ─── Watch Management (LocalStorage) ──────────────────────────

export function getWatches(): FlightWatch[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveWatch(watch: FlightWatch): void {
  const watches = getWatches();
  const idx = watches.findIndex(w => w.id === watch.id);
  if (idx >= 0) watches[idx] = watch;
  else watches.push(watch);
  localStorage.setItem(WATCHES_KEY, JSON.stringify(watches));
}

export function addWatch(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  targetPrice: number;
  currentPrice: number;
  currency?: string;
}): FlightWatch {
  const watch: FlightWatch = {
    id: `watch_${Date.now()}`,
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    targetPrice: params.targetPrice,
    currentPrice: params.currentPrice,
    lastChecked: new Date().toISOString(),
    currency: params.currency || 'EUR',
    notifyOnDrop: true,
    notifyOnRise: false,
    active: true,
    priceHistory: [{ date: new Date().toISOString().split('T')[0], price: params.currentPrice }],
  };
  saveWatch(watch);
  return watch;
}

export function removeWatch(id: string): void {
  const watches = getWatches().filter(w => w.id !== id);
  localStorage.setItem(WATCHES_KEY, JSON.stringify(watches));
}

export function toggleWatch(id: string): void {
  const watches = getWatches();
  const w = watches.find(x => x.id === id);
  if (w) { w.active = !w.active; localStorage.setItem(WATCHES_KEY, JSON.stringify(watches)); }
}

// Check all active watches against current prices
export async function checkWatches(): Promise<{ watch: FlightWatch; dropped: boolean; newPrice: number }[]> {
  const watches = getWatches().filter(w => w.active);
  const alerts: { watch: FlightWatch; dropped: boolean; newPrice: number }[] = [];

  for (const watch of watches) {
    try {
      const results = await getCheapestDates(watch.origin, watch.destination, {
        departureDate: watch.departureDate,
        oneWay: !watch.returnDate,
        viewBy: 'DATE',
      });
      const matching = results.find(r => r.departureDate === watch.departureDate);
      if (matching) {
        const newPrice = parseFloat(matching.price.total);
        const dropped = newPrice < watch.currentPrice;
        watch.currentPrice = newPrice;
        watch.lastChecked = new Date().toISOString();
        watch.priceHistory.push({ date: new Date().toISOString().split('T')[0], price: newPrice });
        if (watch.priceHistory.length > 30) watch.priceHistory = watch.priceHistory.slice(-30);
        saveWatch(watch);
        if ((dropped && watch.notifyOnDrop) || (!dropped && watch.notifyOnRise)) {
          alerts.push({ watch, dropped, newPrice });
        }
      }
    } catch (e) {
      console.error('[FlightTracker] checkWatch error:', e);
    }
  }
  return alerts;
}

// ─── Mock Data (when API not configured) ──────────────────────
function getMockPriceMetrics(origin: string, dest: string, date: string): ItineraryPriceMetricsResult[] {
  const base = 120 + Math.floor(Math.random() * 80);
  return [{
    type: 'itinerary-price-metrics',
    origin,
    destination: dest,
    departureDate: date,
    currencyCode: 'EUR',
    oneWay: false,
    priceMetrics: [
      { quartileRanking: 'MINIMUM', amount: String(base * 0.6) },
      { quartileRanking: 'FIRST', amount: String(base * 0.8) },
      { quartileRanking: 'MEDIUM', amount: String(base) },
      { quartileRanking: 'THIRD', amount: String(base * 1.25) },
      { quartileRanking: 'MAXIMUM', amount: String(base * 1.8) },
    ],
  }];
}

function getMockCheapestDates(origin: string, dest: string): CheapestDateResult[] {
  const dates: CheapestDateResult[] = [];
  const today = new Date();
  for (let i = 7; i <= 90; i += 3) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const ret = new Date(d);
    ret.setDate(d.getDate() + 7);
    const price = (80 + Math.random() * 200).toFixed(2);
    dates.push({
      type: 'flight-date',
      origin,
      destination: dest,
      departureDate: dateStr,
      returnDate: ret.toISOString().split('T')[0],
      price: { total: price },
      links: {},
    });
  }
  return dates;
}
