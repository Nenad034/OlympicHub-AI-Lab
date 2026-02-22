-- Seed Data for Olympic Hub Testing
-- Run this in Supabase SQL Editor

-- 1. Insert a Property (Hotel)
INSERT INTO properties (id, name, type, location, stars)
VALUES ('prop-splendid', 'Hotel Splendid Conference & Spa', 'hotel', 'Bečići, Crna Gora', 5)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert a Pricelist for the Hotel
INSERT INTO pricelists (id, title, internal_code, status, property_id, product)
VALUES (
    'pl-splendid-summer', 
    'Hotel Splendid - Leto 2026', 
    'SPL-2026', 
    'active', 
    'prop-splendid',
    '{"service": "Polupansion", "name": "Superior Soba sa pogledom na more", "type": "Double"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Price Periods for the Hotel
INSERT INTO price_periods (pricelist_id, date_from, date_to, net_price, provision_percent, basis)
VALUES 
    ('pl-splendid-summer', '2026-06-01', '2026-06-30', 120.00, 15.00, 'PER_PERSON_DAY'),
    ('pl-splendid-summer', '2026-07-01', '2026-08-31', 180.00, 15.00, 'PER_PERSON_DAY'),
    ('pl-splendid-summer', '2026-09-01', '2026-09-30', 130.00, 15.00, 'PER_PERSON_DAY')
ON CONFLICT DO NOTHING;

-- 4. Insert Travel Services (Transport & Excursions)
INSERT INTO travel_services (category, title, description, location, price_gross, currency, tags)
VALUES 
    (
        'transport', 
        'Autobuska karta Beograd - Budva (Povratna)', 
        'Redovna linija sa polascima svakog dana u 21:00h sa BAS stanice.', 
        'Beograd - Budva', 
        45.00, 
        'EUR', 
        ARRAY['bus', 'beograd', 'budva', 'prevoz']
    ),
    (
        'excursion', 
        'Krstarenje Bokokotorskim zalivom', 
        'Celodnevni izlet brodom: Kotor - Gospa od Škrpjela - Plava Špilja - Herceg Novi.', 
        'Kotor', 
        35.00, 
        'EUR', 
        ARRAY['brod', 'izlet', 'boka', 'katar', 'more']
    ),
    (
        'excursion', 
        'Srce Crne Gore (Lovćen & Cetinje)', 
        'Obilazak Mauzoleja na Lovćenu, degustacija pršuta u Njegušima i poseta Cetinju.', 
        'Lovćen', 
        40.00, 
        'EUR', 
        ARRAY['izlet', 'planina', 'lovcen', 'cetinje', 'istorija']
    ),
    (
        'transfer', 
        'Privatni transfer Aerodrom Tivat - Hotel Splendid', 
        'Udobno vozilo za do 4 osobe sa dočekom na aerodromu.', 
        'Tivat', 
        25.00, 
        'EUR', 
        ARRAY['transfer', 'tivat', 'splendid', 'taxi']
    )
ON CONFLICT DO NOTHING;
