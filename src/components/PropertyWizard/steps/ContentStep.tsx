import React, { useState } from 'react';
import { Sparkles, Globe } from 'lucide-react';
import type { StepProps } from '../types';
import type { PropertyContent } from '../../../types/property.types';

const ContentStep: React.FC<StepProps> = ({ data, onChange }) => {
    const [selectedLang, setSelectedLang] = useState('sr');
    const [showAiSettings, setShowAiSettings] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('Pronađi zvanični sajt ovog objekta i koristi ISKLJUČIVO njega kao izvor informacija. Ako ne možeš da nađeš zvanični sajt, stani i zatraži link. Ako nađeš, generiši opis, sadržaje, tačke interesa i tipove soba na osnovu njega.');
    const [sourceUrl, setSourceUrl] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const currentContent = data.content?.find(c => c.languageCode === selectedLang) || {
        languageCode: selectedLang,
        officialName: '',
        displayName: '',
        shortDescription: '',
        longDescription: '',
        locationDescription: '',
        policyText: '',
        metaTitle: '',
        metaDescription: '',
        structuredJson: ''
    };

    const updateContent = (updates: Partial<PropertyContent>) => {
        const newContent = data.content?.filter(c => c.languageCode !== selectedLang) || [];
        newContent.push({ ...currentContent, ...updates } as PropertyContent);
        onChange({ content: newContent });
    };

    const handleHtmlPreview = () => {
        const title = currentContent.displayName || currentContent.officialName || 'Hotel';
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${title} - Interni Pregled</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; max-width: 900px; margin: 0 auto; color: #333; }
                    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
                    .section { margin-top: 30px; background: #f5f5f5; padding: 20px; border-radius: 8px; }
                    .label { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 5px; }
                    pre { background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 6px; overflow-x: auto; }
                    .preview-box { border: 1px solid #ddd; padding: 20px; border-radius: 6px; background: white; margin-top: 10px; }
                </style>
            </head>
            <body>
                <h1>Interni Pregled Podataka: ${title}</h1>
                
                <div class="section">
                    <div class="label">SEO Meta Podaci</div>
                    <p><strong>Meta Title:</strong> ${currentContent.metaTitle || '-'}</p>
                    <p><strong>Meta Description:</strong> ${currentContent.metaDescription || '-'}</p>
                </div>

                <div class="section">
                    <div class="label">HTML Sadržaj (Opis)</div>
                    <div class="preview-box">
                        ${currentContent.longDescription || '<i>Nema generisanog opisa.</i>'}
                    </div>
                </div>

                <div class="section">
                    <div class="label">Structured Data (JSON-LD)</div>
                    <pre>${currentContent.structuredJson || '// Empty'}</pre>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const handleGenerateAi = () => {
        setIsGenerating(true);
        // Simulate AI generation delay
        setTimeout(() => {
            const hotelName = (data as any).name || 'Naš Hotel';
            const city = data.address?.city || 'Centar';

            // 1. Generate Serbian Content
            const contentSr: PropertyContent = {
                languageCode: 'sr',
                officialName: hotelName,
                displayName: hotelName,
                shortDescription: `Doživite savršen odmor u ${hotelName}, smeštenom u srcu destinacije ${city}. Spoj luksuza, tradicije i vrhunske usluge za nezaboravne trenutke.`,
                longDescription: `
<p><b>${hotelName} – Vaša oaza mira u srcu destinacije ${city}</b></p>
<p>${hotelName} predstavlja idealan spoj moderne arhitekture i toplog gostoprimstva. Bilo da dolazite poslovno ili na odmor, naš hotel nudi sve što vam je potrebno za savršen boravak - od luksuznih soba do vrhunskog wellness centra.</p>

<p class="section"><b>Lokacija</b></p>
<p>Hotel se nalazi na prestižnoj lokaciji u mestu ${city}, na adresi ${data.address?.addressLine1 || 'Centar'}. Okružen je zelenilom i nalazi se u neposrednoj blizini glavnih turističkih atrakcija, šetališta i poslovne zone, što ga čini savršenim polazištem za istraživanje.</p>

<p class="section"><b>Sadržaji hotela</b></p>
<p>Gostima su na raspolaganju brojni sadržaji uključujući à la carte restoran sa lokalnim i internacionalnim specijalitetima, lobby bar sa terasom, moderno opremljenu konferencijsku salu, besplatan brzi Wi-Fi u celom objektu, kao i privatni parking sa video nadzorom (uz doplatu).</p>

<p class="section"><b>Wellness i rekreacija</b></p>
<p>Naš ekskluzivni Wellness & Spa centar prostire se na 500m2 i nudi zatvoreni bazen sa termalnom vodom, finsku saunu, parno kupatilo i zonu za relaksaciju. Za ljubitelje aktivnog odmora, tu je i moderno opremljena teretana dostupna 24h.</p>

<p class="section"><b>Smeštaj</b></p>
<p>Hotel raspolaže sa 50 luksuzno opremljenih smeštajnih jedinica. Sve sobe su klimatizovane i zvučno izolovane.</p><br>

<p><b># Standard Soba</b> Kapacitet: 2 osobe<br>Komforna soba površine 25m2, idealna za parove. Sadrži francuski ležaj, radni sto, LCD TV sa kablovskim kanalima, sef, mini-bar, ketler za čaj/kafu i moderno kupatilo sa tuš kabinom i fenom. Wi-Fi je besplatan.</p>
<hr style="border:0;border-top:1px solid #ccc;margin:10px 0;">

<p><b># Deluxe Apartman</b> Kapacitet: 4 osobe<br>Prostran apartman od 45m2 sa odvojenom spavaćom sobom i dnevnim boravkom. Poseduje privatnu terasu sa panoramskim pogledom. Opremljen je sa dva LCD TV-a, mini-kuhinjom, aparatom za kafu i luksuznim kupatilom sa đakuzi kadom, bade mantilima i papučama.</p>
<hr style="border:0;border-top:1px solid #ccc;margin:10px 0;">

<p class="section"><b>Usluga</b></p>
<p>Usluga je na bazi noćenja sa doručkom (bogati švedski sto). Mogućnost doplate za polupansion (večera - izbor više jela ili švedski sto, zavisno od broja gostiju).</p>

<p class="section"><b>Dodatne usluge</b></p>
<p>Recepcija je otvorena 24h. Nudimo usluge pranja i peglanja veša, room service, kao i organizaciju transfera od/do aerodroma uz prethodnu najavu.</p>
<hr>
<p><b>Najčešća pitanja (FAQ)</b></p>
<p><b>Da li hotel ima wellness sadržaje?</b><br>Da, hotel poseduje Wellness centar sa bazenom i saunom. Korišćenje bazena je besplatno za goste hotela.</p>
<p><b>Da li hotel ima parking?</b><br>Da, dostupan je privatni parking u okviru objekta (nije potrebna rezervacija) i naplaćuje se 10 EUR po danu.</p>
<p><b>Da li su kućni ljubimci dozvoljeni?</b><br>Da, kućni ljubimci su dozvoljeni na zahtev. Moguća je dodatna naknada.</p>
<p><b>Koliko je hotel udaljen od centra?</b><br>Hotel je udaljen oko 500m od strogog centra grada.</p>
`.trim(),
                locationDescription: '',
                policyText: '',
                metaTitle: `${hotelName} ${city} | Wellness & Spa Odmor | Zvanični Sajt`,
                metaDescription: `Rezervišite boravak u ${hotelName}, ${city}. Luksuzne sobe, spa centar, restoran i odlična lokacija. Najbolje cene i specijalne ponude za vaš savršen odmor.`,
                structuredJson: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Hotel",
                    "name": hotelName,
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": city,
                        "streetAddress": data.address?.addressLine1
                    },
                    "description": `Doživite savršen odmor u ${hotelName}...`,
                    "starRating": data.starRating
                }, null, 2)
            };

            // 2. Generate English Content
            const contentEn: PropertyContent = {
                languageCode: 'en',
                officialName: hotelName,
                displayName: hotelName,
                shortDescription: `Experience a perfect stay at ${hotelName}, located in the heart of ${city}. A blend of luxury, tradition, and premium service for unforgettable moments.`,
                longDescription: `
<p><b>${hotelName} – Your oasis of peace in the heart of ${city}</b></p>
<p>${hotelName} represents the ideal blend of modern architecture and warm hospitality. Whether you are visiting for business or leisure, our hotel offers everything you need for a perfect stay - from luxurious rooms to a top-notch wellness center.</p>

<p class="section"><b>Location</b></p>
<p>The hotel is situated in a prestigious location in ${city}, at ${data.address?.addressLine1 || 'City Center'}. Surrounded by greenery and located in close proximity to main tourist attractions, promenades, and the business zone, it is the perfect starting point for exploration.</p>

<p class="section"><b>Hotel Facilities</b></p>
<p>Guests can enjoy numerous facilities including an à la carte restaurant with local and international specialties, a lobby bar with a terrace, a fully equipped conference hall, free high-speed Wi-Fi throughout the property, and private parking (surcharge applies).</p>

<p class="section"><b>Wellness & Recreation</b></p>
<p>Our exclusive Wellness & Spa center covers 500m2 and offers an indoor pool with thermal water, Finnish sauna, steam bath, and relaxation zone. For active vacation lovers, a modern gym is available 24/7.</p>

<p class="section"><b>Accommodation</b></p>
<p>The hotel features 50 luxuriously equipped accommodation units. All rooms are air-conditioned and soundproofed.</p><br>

<p><b># Standard Room</b> Capacity: 2 persons<br>Comfortable room of 25m2, ideal for couples. Features a double bed, work desk, LCD TV with cable channels, safe, mini-bar, kettle for tea/coffee, and a modern bathroom with shower cabin and hairdryer. Wi-Fi is free.</p>
<hr style="border:0;border-top:1px solid #ccc;margin:10px 0;">

<p><b># Deluxe Suite</b> Capacity: 4 persons<br>Spacious suite of 45m2 with separate bedroom and living room. Features a private terrace with panoramic views. Equipped with two LCD TVs, mini-kuhinjom, aparatom za kafu and a luxurious bathroom with jacuzzi tub, bathrobes, and slippers.</p>
<hr style="border:0;border-top:1px solid #ccc;margin:10px 0;">

<p class="section"><b>Service</b></p>
<p>Service is based on Bed & Breakfast (rich buffet). Half-board supplement available (choice of menu or buffet for dinner).</p>

<p class="section"><b>Additional Services</b></p>
<p>Reception is open 24/7. We offer laundry and ironing services, room service, and airport transfers upon request.</p>
<hr>
<p><b>FAQ</b></p>
<p><b>Does the hotel have wellness facilities?</b><br>Yes, the hotel has a Wellness center with pool and sauna. Pool access is free for guests.</p>
<p><b>Is parking available?</b><br>Yes, private parking is available on-site (10 EUR/day).</p>
<p><b>Are pets allowed?</b><br>Yes, pets are allowed upon request. Charges may apply.</p>
<p><b>How far is the center?</b><br>The hotel is about 500m from the city center.</p>
`.trim(),
                locationDescription: '',
                policyText: '',
                metaTitle: `${hotelName} ${city} | Wellness & Spa Vacation | Official Site`,
                metaDescription: `Book your stay at ${hotelName}, ${city}. Luxury rooms, spa, restaurant, and great location. Best rates and special offers.`,
                structuredJson: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Hotel",
                    "name": hotelName,
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": city,
                        "streetAddress": data.address?.addressLine1
                    },
                    "description": `Experience a perfect stay at ${hotelName}...`,
                    "starRating": data.starRating
                }, null, 2)
            };

            // 3. Generate Points of Interest (Distances)
            const newPois: any[] = [
                { poiName: `Centar grada (${city})`, distanceMeters: 500, poiType: 'CityCenter' },
                { poiName: 'Aerodrom Nikola Tesla', distanceMeters: 18500, poiType: 'Airport' },
                { poiName: 'Glavna Autobuska Stanica', distanceMeters: 2100, poiType: 'TrainStation' },
                { poiName: 'Lokalni Restorani', distanceMeters: 200, poiType: 'Restaurant' }
            ];

            // 4. Generate Amenities
            const newAmenities: any[] = [
                { amenityId: 'wifi', propertyId: 'temp', otaCode: '1', name: 'Besplatan WiFi', category: 'General', isFree: true, onSite: true, reservationRequired: false },
                { amenityId: 'parking', propertyId: 'temp', otaCode: '2', name: 'Parking', category: 'General', isFree: true, onSite: true, reservationRequired: true },
                { amenityId: 'pool', propertyId: 'temp', otaCode: '3', name: 'Bazen', category: 'Wellness', isFree: false, onSite: true, reservationRequired: false },
                { amenityId: 'ac', propertyId: 'temp', otaCode: '4', name: 'Klima Uređaj', category: 'Room', isFree: true, onSite: true, reservationRequired: false }
            ];

            // 5. Generate Room Types
            const newRoomTypes: any[] = [
                {
                    roomTypeId: 'rt_' + Date.now(),
                    code: 'STD',
                    nameInternal: 'Standard Dvokrevetna Soba',
                    category: 'Room',
                    standardOccupancy: 2,
                    maxAdults: 2,
                    maxChildren: 1,
                    maxOccupancy: 3,
                    minOccupancy: 1,
                    bathroomCount: 1,
                    bathroomType: 'Private',
                    beddingConfigurations: [{ bedTypeCode: 'DOUBLE', quantity: 1, isExtraBed: false }],
                    amenities: [],
                    images: []
                },
                {
                    roomTypeId: 'rt_' + (Date.now() + 1),
                    code: 'DLX',
                    nameInternal: 'Deluxe Apartman',
                    category: 'Suite',
                    standardOccupancy: 3,
                    maxAdults: 3,
                    maxChildren: 2,
                    maxOccupancy: 4,
                    minOccupancy: 1,
                    bathroomCount: 1,
                    bathroomType: 'Private',
                    beddingConfigurations: [{ bedTypeCode: 'KING', quantity: 1, isExtraBed: false }, { bedTypeCode: 'SOFA_BED', quantity: 1, isExtraBed: true }],
                    amenities: [],
                    images: []
                }
            ];

            // Update All Data
            const otherContent = data.content?.filter(c => c.languageCode !== 'sr' && c.languageCode !== 'en') || [];
            onChange({
                content: [...otherContent, contentSr, contentEn],
                pointsOfInterest: newPois,
                propertyAmenities: newAmenities,
                roomTypes: newRoomTypes,
                website: (data as any).website || `https://www.${hotelName.toLowerCase().replace(/[^a-z0-9]/g, '')}.rs`
            } as any);

            setIsGenerating(false);
            setShowAiSettings(false);
        }, 1500);
    };

    return (
        <div>
            {/* AI Control Panel */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} className="text-accent" />
                        <h4 style={{ margin: 0, fontSize: '14px' }}>Opis i Seo</h4>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className="btn-secondary"
                            onClick={handleHtmlPreview}
                            style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                            <Globe size={14} style={{ marginRight: '4px' }} /> HTML Prikaz
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => setShowAiSettings(!showAiSettings)}
                            style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                            {showAiSettings ? 'Sakrij Podešavanja' : 'Podešavanja Prompta'}
                        </button>
                        <button
                            className="btn-primary-glow"
                            onClick={handleGenerateAi}
                            disabled={isGenerating}
                            style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                            {isGenerating ? 'Generisanje...' : 'Generiši Sadržaj'}
                        </button>
                    </div>
                </div>

                {showAiSettings && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        <label className="form-label">Globalni AI Prompt Template</label>
                        <textarea
                            className="form-textarea"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            style={{ fontSize: '13px', fontFamily: 'monospace', minHeight: '80px', width: '100%' }}
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>Definišite instrukcije za AI model. Koristite ovaj prostor za tonalitet, stil i specifične zahteve.</small>

                        <div style={{ marginTop: '16px' }}>
                            <label className="form-label">Link ka izvornom sajtu (Opciono)</label>
                            <input
                                className="form-input"
                                placeholder="https://www.official-hotel-site.com"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                            />
                            <small style={{ color: 'var(--text-secondary)' }}>Ukoliko AI ne pronađe sajt, ovde unesite tačan link.</small>
                        </div>
                    </div>
                )}
            </div>

            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="form-section-title" style={{ margin: 0 }}>Tekstualni Sadržaj (Višejezično)</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={`btn-${selectedLang === 'sr' ? 'primary' : 'secondary'}`}
                            onClick={() => setSelectedLang('sr')}
                            style={{ padding: '8px 16px' }}
                        >
                            Srpski
                        </button>
                        <button
                            className={`btn-${selectedLang === 'en' ? 'primary' : 'secondary'}`}
                            onClick={() => setSelectedLang('en')}
                            style={{ padding: '8px 16px' }}
                        >
                            English
                        </button>
                    </div>
                </div>

                <div className="form-grid single">
                    <div className="form-group">
                        <label className="form-label">Kratak Opis (max 300 karaktera)</label>
                        <textarea
                            className="form-textarea"
                            maxLength={300}
                            placeholder="Za mobilne aplikacije i brzi pregled..."
                            value={currentContent.shortDescription || ''}
                            onChange={(e) => updateContent({ shortDescription: e.target.value })}
                            style={{ minHeight: '80px' }}
                        />
                        <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {currentContent.shortDescription?.length || 0}/300
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Detaljan Opis (2000+ karaktera)</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Za detaljne stranice i SEO..."
                            value={currentContent.longDescription || ''}
                            onChange={(e) => updateContent({ longDescription: e.target.value })}
                            style={{ minHeight: '200px' }}
                        />
                    </div>

                    {/* SEO SECTION */}
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', marginTop: '16px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--accent)' }}>SEO & Meta Podaci (Google Search)</h4>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Meta Title (Naslov)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    maxLength={60}
                                    placeholder="Naslov za pretraživače..."
                                    value={currentContent.metaTitle || ''}
                                    onChange={(e) => updateContent({ metaTitle: e.target.value })}
                                    style={{ paddingRight: '60px', width: '100%' }}
                                />
                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: (currentContent.metaTitle?.length || 0) > 60 ? 'red' : 'gray' }}>
                                    {currentContent.metaTitle?.length || 0}/60
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Meta Description (Opis)</label>
                            <textarea
                                className="form-textarea"
                                maxLength={160}
                                placeholder="Kratak opis koji se pojavljuje u rezultatima pretrage..."
                                value={currentContent.metaDescription || ''}
                                onChange={(e) => updateContent({ metaDescription: e.target.value })}
                                style={{ minHeight: '80px' }}
                            />
                            <small style={{ color: (currentContent.metaDescription?.length || 0) > 160 ? 'red' : 'var(--text-secondary)' }}>
                                {currentContent.metaDescription?.length || 0}/160 preporučenih karaktera
                            </small>
                        </div>

                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <label className="form-label">Structured Data (JSON-LD) - Skriveno</label>
                            <textarea
                                className="form-textarea"
                                readOnly
                                value={currentContent.structuredJson || ''}
                                placeholder="Automatski generisan JSON-LD kod..."
                                style={{ minHeight: '60px', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', opacity: 0.7 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Opis Lokacije</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Opis kraja/komšiluka..."
                            value={currentContent.locationDescription || ''}
                            onChange={(e) => updateContent({ locationDescription: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pravila Kuće (Polisa)</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Sitna slova o pravilima..."
                            value={currentContent.policyText || ''}
                            onChange={(e) => updateContent({ policyText: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentStep;
