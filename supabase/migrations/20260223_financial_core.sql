-- Promoted to use UUIDs for standard Supabase architecture, but keeping the requested logic.
-- 1. Tabela Aranžmana (Glavni folder za troškove i prihode)
CREATE TABLE public.aranzmani (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_broj VARCHAR(50) UNIQUE NOT NULL, -- Npr. GR-2026-001
    naziv_putovanja VARCHAR(255),
    datum_polaska DATE,
    datum_povratka DATE,
    organizator_id VARCHAR(50) DEFAULT 'Sopstveni', -- Može biti 'Sopstveni' ili subagent ID
    status VARCHAR(20) DEFAULT 'Aktivan', -- Aktivan, Završen, Storniran
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela Putnika/Klijenata
CREATE TABLE public.klijenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ime_prezime_naziv VARCHAR(255) NOT NULL,
    pib_jmbg VARCHAR(50),
    adresa TEXT,
    email VARCHAR(255),
    tip_lica VARCHAR(20) CHECK (tip_lica IN ('FIZICKO', 'PRAVNO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela Uplata (Povezana sa Fiskalizacijom i SEF-om)
CREATE TABLE public.uplate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aranzman_id UUID REFERENCES public.aranzmani(id) ON DELETE CASCADE,
    klijent_id UUID REFERENCES public.klijenti(id) ON DELETE RESTRICT,
    iznos_rsd DECIMAL(15, 2) NOT NULL,
    nacin_placanja VARCHAR(50), -- Gotovina, Kartica, Prenos, VCC
    vreme_uplate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pfr_broj VARCHAR(100), -- Broj fiskalnog isečka (ako je ESIR)
    sef_id VARCHAR(100),   -- ID avansnog/konačnog računa na SEF-u
    je_konacni_racun BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela Dobavljača i Ulaznih Faktura (Nabavka)
CREATE TABLE public.ulazni_racuni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aranzman_id UUID REFERENCES public.aranzmani(id) ON DELETE CASCADE,
    dobavljac_naziv VARCHAR(255) NOT NULL,
    broj_fakture VARCHAR(100) NOT NULL,
    iznos_valuta DECIMAL(15, 2) NOT NULL,
    valuta VARCHAR(10) DEFAULT 'RSD',
    kurs_na_dan DECIMAL(10, 4) DEFAULT 1.0,
    iznos_rsd_bruto DECIMAL(15, 2) NOT NULL, -- Ulazi u maržu sa PDV-om (Član 35)
    tip_troska VARCHAR(50) CHECK (tip_troska IN ('DIREKTAN', 'OPSTI')), -- 'DIREKTAN' (za maržu)
    vreme_unosa TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela Poreske Evidencije (Knjiga po Članu 35)
CREATE TABLE public.poreska_evidencija_cl35 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aranzman_id UUID UNIQUE REFERENCES public.aranzmani(id) ON DELETE CASCADE,
    ukupna_prodaja_rsd DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ukupna_nabavka_rsd DECIMAL(15, 2) NOT NULL DEFAULT 0,
    bruto_marza DECIMAL(15, 2) NOT NULL DEFAULT 0,
    osnovica_pdv DECIMAL(15, 2) NOT NULL DEFAULT 0,
    pdv_iznos DECIMAL(15, 2) NOT NULL DEFAULT 0,
    datum_obracuna TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_aranzmani_updated_at BEFORE UPDATE ON public.aranzmani FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uplate_updated_at BEFORE UPDATE ON public.uplate FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.aranzmani ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klijenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uplate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ulazni_racuni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poreska_evidencija_cl35 ENABLE ROW LEVEL SECURITY;

-- Basic Policies (can be refined later, assuming authenticated users have access)
CREATE POLICY "Allow authenticated users full access to aranzmani" ON public.aranzmani FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to klijenti" ON public.klijenti FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to uplate" ON public.uplate FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to ulazni_racuni" ON public.ulazni_racuni FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to poreska_evidencija_cl35" ON public.poreska_evidencija_cl35 FOR ALL USING (auth.role() = 'authenticated');
