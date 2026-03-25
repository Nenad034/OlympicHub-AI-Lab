
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from the project root
const envPath = join(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SUPPLIERS = ['Solvex', 'Filos', 'MtsGlobe', 'TCT', 'Amadeus', 'Open Greece', 'Kyte', 'Olympic Travel'];
const TRIP_TYPES = ['Smestaj', 'Avio karte', 'Dinamicki paket', 'Putovanja', 'Transfer', 'Bus', 'Krstarenje'];
const CURRENCIES = ['EUR', 'RSD', 'USD'];
const STATUSES = ['confirmed', 'pending', 'cancelled', 'completed'];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBirthDate(age) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(Math.floor(Math.random() * 12));
  d.setDate(Math.floor(Math.random() * 28));
  return d.toISOString().split('T')[0];
}

async function clearReservations() {
  console.log('🧹 Clearing existing data...');
  // Clear dependent notifications first
  await supabase.from('solvex_notifications').delete().neq('id', 'NONE');
  // Clear supplier obligations that might reference these
  await supabase.from('supplier_obligations').delete().neq('id', 'NONE');
  // Clear the main reservations
  const { error } = await supabase.from('reservations').delete().neq('cis_code', 'KEEP_STAY_SAFE');
  if (error) console.error('Error clearing reservations:', error);
  else console.log('✅ Done clearing all related tables.');
}

async function populateReservations() {
  console.log('🚀 Generating 20 diverse reservations...');
  
  const reservations = [];
  
  for (let i = 1; i <= 20; i++) {
    const adultsCount = Math.floor(Math.random() * 3) + 1;
    const childrenCount = Math.floor(Math.random() * 3);
    const tripType = getRandom(TRIP_TYPES);
    const supplier = getRandom(SUPPLIERS);
    const currency = getRandom(CURRENCIES);
    const status = getRandom(STATUSES);
    
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + Math.floor(Math.random() * 90) + 10);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + Math.floor(Math.random() * 14) + 3);
    
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const pricePerNight = Math.floor(Math.random() * 150) + 50;
    const totalPrice = nights * pricePerNight * (adultsCount + (childrenCount * 0.5));
    const paidAmount = status === 'confirmed' ? totalPrice : (status === 'completed' ? totalPrice : (Math.random() > 0.5 ? Math.floor(totalPrice * 0.3) : 0));

    const passengers = [];
    for (let a = 0; a < adultsCount; a++) {
      passengers.push({
        firstName: `Passenger${i}_A${a}`,
        lastName: `Surname${i}`,
        type: 'adult',
        birthDate: generateBirthDate(25 + Math.floor(Math.random() * 40))
      });
    }
    for (let c = 0; c < childrenCount; c++) {
      passengers.push({
        firstName: `Child${i}_C${c}`,
        lastName: `Surname${i}`,
        type: 'child',
        birthDate: generateBirthDate(Math.floor(Math.random() * 12) + 2)
      });
    }

    const resCode = `${String(i).padStart(7, '0')}-2026`;
    const cisCode = `CIS-${resCode}`;

    const dossier = {
      cisCode,
      resCode,
      status: status.charAt(0).toUpperCase() + status.slice(1),
      booker: {
        fullName: passengers[0].firstName + ' ' + passengers[0].lastName,
        email: `user${i}@example.com`,
        phone: `+3816${Math.floor(Math.random() * 9000000) + 1000000}`,
        address: `Address ${i}, City ${i}`,
        city: `City ${i}`,
        country: 'Srbija'
      },
      passengers,
      customerType: Math.random() > 0.3 ? 'B2C-Individual' : (Math.random() > 0.5 ? 'B2C-Legal' : 'B2B-Subagent'),
      tripItems: [{
        id: `item-${i}`,
        type: tripType,
        supplier: supplier,
        subject: `${tripType} Service ${i}`,
        city: `Destination ${i}`,
        country: `Country ${i}`,
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        bruttoPrice: totalPrice,
        currency: currency,
        stars: Math.floor(Math.random() * 3) + 3
      }],
      finance: {
        currency: currency,
        totalAmount: totalPrice,
        payments: paidAmount > 0 ? [{
          id: `p-${i}`,
          amount: paidAmount,
          currency: currency,
          method: getRandom(['bank', 'cash', 'card']),
          date: new Date().toISOString(),
          status: 'confirmed'
        }] : []
      }
    };

    const dbRes = {
      cis_code: dossier.cisCode,
      ref_code: dossier.resCode,
      status: status,
      customer_name: dossier.booker.fullName,
      customer_type: dossier.customerType,
      destination: dossier.tripItems[0].city + ', ' + dossier.tripItems[0].country,
      accommodation_name: dossier.tripItems[0].subject,
      check_in: dossier.tripItems[0].checkIn,
      check_out: dossier.tripItems[0].checkOut,
      nights: nights,
      pax_count: passengers.length,
      total_price: totalPrice,
      paid: paidAmount,
      currency: currency,
      supplier: supplier,
      trip_type: tripType,
      phone: dossier.booker.phone,
      email: dossier.booker.email,
      provider: supplier.toLowerCase().includes('solvex') ? 'solvex' : (supplier.toLowerCase().includes('tct') ? 'tct' : 'opengreece'),
      guests_data: dossier
    };

    reservations.push(dbRes);
  }

  const { data, error } = await supabase.from('reservations').insert(reservations);
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log(`✅ Successfully added 20 new reservations.`);
  }
}

async function run() {
  await clearReservations();
  await populateReservations();
}

run();
