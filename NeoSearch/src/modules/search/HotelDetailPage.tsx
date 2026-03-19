import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Share2, Calendar, Users, Info, 
  Wifi, Waves, Car, Users2, Coffee, Activity, 
  ShieldCheck, HelpCircle, ChevronUp, Clock,
  Utensils, BedDouble, Baby, GraduationCap,
  Beer, Dumbbell, Landmark, Palmtree
} from 'lucide-react';
import { PropertyService } from '../booking/PropertyService';

export const HotelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotel = async () => {
      if (!id) return;
      try {
        const props = await PropertyService.fetchAllProperties();
        const found = props.find((p: any) => p.id.toString() === id || p.hotel_name === id);
        if (found) {
          setHotel(found);
        }
      } catch (e) {
        console.error("Greška pri učitavanju hotela:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800' }}>Učitavanje hotela...</div>;
  if (!hotel) return <div style={{ padding: '100px', textAlign: 'center' }}>Hotel nije pronađen. <button onClick={() => navigate('/')}>Nazad</button></div>;

  const images = hotel.image_urls || [];
  const mainImage = hotel.main_image_url || images[0];
  const sideImages = images.slice(1, 5);

  return (
    <div style={{ background: '#fff', color: '#333', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER SECTION - GALLERY */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', height: '480px', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ gridRow: 'span 2', background: '#eee' }}>
            <img src={mainImage} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {sideImages.map((url: string, i: number) => (
            <div key={i} style={{ background: '#eee', position: 'relative' }}>
              <img src={url} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {i === 3 && (
                <div style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                   <Share2 size={16} />
                </div>
              )}
            </div>
          ))}
          {/* Fill if less than 4 side images */}
          {Array.from({ length: 4 - sideImages.length }).map((_, i) => (
            <div key={`fill-${i}`} style={{ background: '#f5f5f5' }} />
          ))}
        </div>

        {/* TITLE SECTION */}
        <div style={{ marginTop: '24px' }}>
           <div style={{ fontSize: '14px', color: '#777', marginBottom: '8px' }}>
             Crna Gora, Primorska regija, {hotel.location || 'Budva'}
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <h1 style={{ fontSize: '42px', fontWeight: '900', margin: 0, color: '#1a1a1a' }}>{hotel.name}</h1>
                 <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({ length: hotel.star_rating || 4 }).map((_, i) => <Star key={i} size={20} fill="#F59E0B" color="#F59E0B" />)}
                 </div>
              </div>
              <button 
                className="glass-card" 
                style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
              >
                <Share2 size={16} /> PODELI
              </button>
           </div>

           {/* BADGES */}
           <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <span style={{ padding: '6px 16px', background: '#800020', color: 'white', fontSize: '11px', fontWeight: '900', borderRadius: '4px' }}>NAŠA PREPORUKA</span>
              <span style={{ padding: '6px 16px', background: '#bf002e', color: 'white', fontSize: '11px', fontWeight: '900', borderRadius: '4px' }}>LETO 2026</span>
              <span style={{ padding: '6px 16px', background: '#9e0026', color: 'white', fontSize: '11px', fontWeight: '900', borderRadius: '4px' }}>GRATIS BORAVAK ZA DETE DO 10 GODINA</span>
           </div>

           {/* DESCRIPTION */}
           <div style={{ marginTop: '40px', lineHeight: '1.8', fontSize: '16px', color: '#444', maxWidth: '1000px' }}>
              <p style={{ fontWeight: '600', marginBottom: '24px', fontSize: '18px' }}>
                {hotel.name} – {hotel.intro_description || 'Idealna destinacija za vaš odmor.'}
              </p>
              
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1a1a1a', marginBottom: '16px' }}>Lokacija</h3>
                <p>{hotel.description?.split('Lokacija')[1]?.split('Sadržaj')[0] || `Hotel ima izuzetnu lokaciju u ${hotel.location || 'Budvi'}, smešten na samo par koraka od najlepših plaža.`}</p>
              </div>

              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1a1a1a', marginBottom: '16px' }}>Sadržaji hotela</h3>
                <p>{hotel.description?.split('Sadržaji')[1]?.split('Wellness')[0] || 'Hotel nudi obilje sadržaja za celu porodicu. Poseduje recepciju, prostrani lobi, barove i bazene.'}</p>
              </div>

              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1a1a1a', marginBottom: '16px' }}>Smeštaj</h3>
                <p>{hotel.description?.split('Smeštaj')[1] || 'Sve sobe i apartmani su klimatizovani, moderno opremljeni i pružaju maksimalnu udobnost.'}</p>
              </div>
           </div>

           <button 
             onClick={() => navigate('/')}
             style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', background: 'transparent', margin: '40px 0' }}
           >
             ZATVORI <ChevronUp size={16} />
           </button>
        </div>

        {/* SADRŽAJ ICONS SECTION */}
        <div style={{ marginTop: '60px', paddingBottom: '60px', borderBottom: '1px solid #eee' }}>
           <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '40px' }}>Sadržaj</h2>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'x 40px', rowGap: '32px' }}>
              <FeatureItem icon={<Clock size={20} />} label="Check In" value="14:00" />
              <FeatureItem icon={<Clock size={20} />} label="Check Out" value="10:00" />
              <FeatureItem icon={<Users2 size={20} />} label="Čuvanje kućnih ljubimaca" value="Ne" badge="Ne" />
              
              <FeatureItem icon={<Wifi size={20} />} label="Internet" value="WiFi pristup internetu" badge="Da, besplatno" />
              <FeatureItem icon={<Waves size={20} />} label="Bazen" value="Bazen na otvorenom" />
              <FeatureItem icon={<Car size={20} />} label="Parking dostupan" value="Parking uz doplatu" />

              <FeatureItem icon={<BedDouble size={20} />} label="Pušenje" value="Sobe za nepušače" />
              <FeatureItem icon={<GraduationCap size={20} />} label="Poslovni sadržaji" value="Sale za sastanke" />
              <FeatureItem icon={<Clock size={20} />} label="Usluge recepcije" value="24 satno radno vreme" />

              <FeatureItem icon={<Users size={20} />} label="Višejezično osoblje" value="Da" />
              <FeatureItem icon={<Palmtree size={20} />} label="Usluga prevoza do aerodroma" value="Dostupno" badge="Da, uz doplatu" />
              <FeatureItem icon={<Baby size={20} />} label="Deca dobrodošla" value="Da" />

              <FeatureItem icon={<Baby size={20} />} label="Usluge čuvanja dece" value="Usluga dostupna" />
              <FeatureItem icon={<Dumbbell size={20} />} label="Frizer/Kozmetički salon" value="Dostupno" />
              <FeatureItem icon={<Beer size={20} />} label="Bar/salon" value="Dostupno" />

              <FeatureItem icon={<ShieldCheck size={20} />} label="Klimatizovane sobe" value="Sve sobe" />
              <FeatureItem icon={<Users2 size={20} />} label="Porodične sobe" value="Dostupne" />
              <FeatureItem icon={<Utensils size={20} />} label="Hrana i piće" value="A la carte restoran" />
           </div>
        </div>

        {/* BOOKING SECTION */}
        <div style={{ marginTop: '80px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-1px' }}>REZERVIŠITE SVOJ ODMOR</h1>
          <p style={{ opacity: 0.6, fontSize: '18px', marginBottom: '48px' }}>Proverite raspoloživost smeštaja i rezervišite svoj smeštaj po najpovoljnijim cenama.</p>

          <div style={{ background: '#f8f8f8', padding: '32px', borderRadius: '24px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 200px', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
             <div className="search-field" style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>KADA ŽELITE PUTOVATI?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #ddd' }}>
                   <Calendar size={18} color="#999" />
                   <span style={{ fontSize: '13px', fontWeight: '700' }}>Odaberite period boravka</span>
                </div>
             </div>
             <div className="search-field" style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>Koliko putnika?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #ddd' }}>
                   <Users size={18} color="#999" />
                   <span style={{ fontSize: '13px', fontWeight: '700' }}>Odaberite broj putnika</span>
                </div>
             </div>
             <div className="search-field" style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>USLUGA</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #ddd' }}>
                   <Coffee size={18} color="#999" />
                   <span style={{ fontSize: '13px', fontWeight: '700' }}>Polupansion</span>
                </div>
             </div>
             <button style={{ background: '#0a637d', color: 'white', border: 'none', borderRadius: '50px', padding: '16px 24px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', height: '60px' }}>
                PROVERI RASPOLOŽIVOST
             </button>
          </div>

          {/* ROOMS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '100px' }}>
            {['Dvokrevetna soba', 'Dvokrevetna soba + pomoćni ležaj', 'Dvokrevetna soba - RANI BUKING', 'Apartman za 4 osobe'].map((type, i) => (
              <div key={i} style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ textAlign: 'left' }}>
                   <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 12px 0' }}>{type}</h3>
                   <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BedDouble size={16} /> Broj ležaja: {i % 2 === 0 ? '2' : '3'}</span>
                   </div>
                   <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '11px', fontWeight: '800', color: '#bf002e', textTransform: 'uppercase', textDecoration: 'underline' }}>
                      <span style={{ cursor: 'pointer' }}>Opis sobe</span>
                      <span style={{ cursor: 'pointer' }}>Cenovnik</span>
                      <span style={{ cursor: 'pointer' }}>Raspoloživost</span>
                   </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', opacity: 0.5, fontWeight: '800' }}>CENA OD</div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#0a637d' }}>€{51 + (i * 4)}</div>
                      <div style={{ fontSize: '11px', opacity: 0.5 }}>po osobi po danu</div>
                   </div>
                   <div style={{ width: '200px', textAlign: 'left', fontSize: '11px', opacity: 0.6, display: 'flex', gap: '12px' }}>
                      <Info size={16} />
                      <span>Za tačan proračun cene unesite period i broj osoba.</span>
                   </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, label, value, badge }: any) => (
  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
    <div style={{ color: '#999', marginTop: '4px' }}>{icon}</div>
    <div>
       <div style={{ fontSize: '14px', fontWeight: '800', color: '#333', marginBottom: '4px' }}>{label}</div>
       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', opacity: 0.7 }}>{value}</span>
          {badge && (
            <span style={{ fontSize: '9px', fontWeight: '900', background: badge.includes('besplatno') ? '#10B981' : (badge.includes('Ne') ? '#EF4444' : '#F59E0B'), color: 'white', padding: '3px 8px', borderRadius: '30px', textTransform: 'uppercase' }}>
               {badge}
            </span>
          )}
       </div>
    </div>
  </div>
);
