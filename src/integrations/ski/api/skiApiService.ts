import europeanResorts from '../data/europe_ski_resorts.json';
import type { SkiResort, SkiSearchResponse } from '../types/skiTypes';
import { supabase } from '../../../supabaseClient';

class SkiApiService {
    private static instance: SkiApiService;

    private readonly serbianTranslations: Record<string, string> = {
        'Les Trois Vallées': 'Tri Doline',
        'Chamonix': 'Šamoni',
        'St. Anton am Arlberg': 'Sankt Anton am Arlberg',
        "Cortina d'Ampezzo": "Kortina d'Ampeco",
        'Bansko': 'Bansko',
        'Borovets': 'Borovec',
        'Zell am See': 'Cel am Ze',
        'Kitzbühel': 'Kicbil',
        'Zermatt': 'Cermat',
        "Val d'Isère": "Val d'Izer",
        'Livigno': 'Livinjo',
        'Bormio': 'Bormio',
        'Madonna di Campiglio': 'Madona di Kampiljo',
        'Ischgl': 'Išgl',
        'Kranjska Gora': 'Kranjska Gora',
        'Jahorina': 'Jahorina',
        'Bjelašnica': 'Bjelašnica',
        'Pamporovo': 'Pamporovo',
        'Sölden': 'Zelden',
        'Hintertux': 'Hintertuks',
        'Courchevel': 'Kurševel',
        'Val Thorens': 'Val Torens',
        'Méribel': 'Meribel',
        'Garmisch-Partenkirchen': 'Garmiš-Partenkirhen',
        'Vogel': 'Vogel',
        'Krvavec': 'Krvavec',
        'Rogla': 'Rogla',
        'Serfaus Fiss Ladis': 'Serfaus Fis Ladis',
        'Saalbach': 'Zalbah',
        'Schladming': 'Šladming',
        'Obertauern': 'Obertauern',
        'Nassfeld': 'Nasfeld',
        'Bad Kleinkirchheim': 'Bad Klajnkirhajm',
        'Kaprun': 'Kaprun',
        'Flachau': 'Flahau',
        'Kronplatz - Plan de Corones': 'Kronplac',
        'Alta Badia': 'Alta Badia',
        'Val Gardena': 'Val Gardena',
        'Sestriere': 'Sestriere',
        'Verbier': 'Verbie',
        'St. Moritz': 'Sankt Moric',
        'Davos': 'Davos',
        'Kolašin': 'Kolašin',
        'Popova Šapka': 'Popova Šapka',
        'Mavrovo': 'Mavrovo'
    };

    private readonly officialMaps: Record<string, string> = {
        'Bansko': 'https://skimap.org/data/2789/2253/1647712351.jpg',
        'Kopaonik': 'https://skimap.org/data/2873/2501/1512419409.jpg',
        'Stara planina': 'https://skimap.org/data/2874/2502/1324709848.jpg',
        'Tornik': 'https://skimap.org/data/2875/2503/1324710188.jpg',
        'St. Anton am Arlberg': 'https://www.st-anton.at/en/global/images/skimaps/skimap_arlberg_east.jpg',
        "Cortina d'Ampezzo": 'https://www.dolomitisuperski.com/dam/jcr:8f1e6b8a-8a5c-4d8b-9b1e-6b8a8a5c4d8b/skimap-cortina.jpg',
        'Les Trois Vallées': 'https://www.les3vallees.com/images/default-source/cartes-et-plans/plan_des_pistes_les_3_vallees.jpg',
        'Zell am See': 'https://www.zellamsee-kaprun.com/assets/images/Zell_am_See/Schmitten/Schmittenhoehe_Pistenplan_Winter.jpg',
        'Kitzbühel': 'https://www.kitzski.at/media/kitzski-pistenplan-2023-24.jpg',
        'Chamonix': 'https://www.chamonix.com/sites/default/files/2021-11/plan-pistes-chamonix-mont-blanc.jpg',
        'Sölden': 'https://www.soelden.com/fileadmin/user_upload/soelden/dokumente/Pistenplan_Winter.jpg',
        'Borovets': 'https://www.bulgarian-ski.com/maps/borovets-piste-map.jpg',
        'Zermatt': 'https://www.zermatt.ch/media/Zermatt/Pistenplaene/Pistenplan-Zermatt',
        'Ischgl': 'https://www.ischgl.com/media/Ischgl/Pistenplan-Silvretta-Arena.jpg',
        'Jahorina': 'https://www.oc-jahorina.com/wp-content/uploads/2021/11/MAPA-JAHORINA-2021.jpg'
    };

    private readonly officialGalleries: Record<string, string[]> = {
        'Bad Kleinkirchheim': [
            'https://fuutazbsb.filerobot.com/Freigegeben/Thermal-Roemerbad_Bad-Kleinkirchheim_Sommer-Mathias-Praegant_MBN-Tourismus_Millstaetter-See-Bad-Kleinkirchheim-Nockberge-Tourismusmanagement-GmbH_Mathias-Praegant.jpeg?gravity=auto&w=864&h=576&func=crop&q=75',
            'https://fuutazbsb.filerobot.com/Freigegeben/Therme-St-Kathrein-Familienbereich_Familien-Gesundheitstherme-St-Kathrein_Gert-Perauer-Foto-Perauer-.jpeg?w=864&h=576&func=crop&q=75',
            'https://fuutazbsb.filerobot.com/Freigegeben/Lebensgefuehl-Oesterreich-Action-auf-der-Piste_Oesterreich-Werbung_Marko-Mestrovic.jpeg?gravity=auto&w=480&h=360&func=crop&q=75'
        ],
        'St. Anton am Arlberg': [
            'https://images.unsplash.com/photo-1491555103946-3c635332828b?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1520113282655-23f32f9a882d?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1549413289-497d3122c4f7?auto=format&fit=crop&q=80&w=1200'
        ],
        'Kitzbühel': [
            'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&q=80&w=1200'
        ],
        'Sölden': [
            'https://images.unsplash.com/photo-1605540435646-81400673437f?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1542601039-29ad9e8248c7?auto=format&fit=crop&q=80&w=1200'
        ],
        'Ischgl': [
            'https://images.unsplash.com/photo-1514828066551-7ec2dfb94420?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1614013491410-b9cc8c67a731?auto=format&fit=crop&q=80&w=1200'
        ]
    };

    private readonly officialDescriptions: Record<string, string> = {
        'Bad Kleinkirchheim': `Uživajte u raznovrsnim zimskim trenucima u Koruškoj. Od porodičnog i opuštenog skijanja do zahtevnih crnih staza – ovde ćete pronaći savršenu stazu po svom ukusu. Skijalište Bad Kleinkirchheim nudi 103 kilometra savršeno uređenih staza na preko 300 hektara površine: 11 kilometara plavih staza, 84 kilometra crvenih i 8 kilometara crnih staza, uz 24 moderna lift-objekta (4 gondole, 8 sedežnica, 12 liftova tipa sidro/tanjir).

Za ljubitelje adrenalina i dodatne zabave tu su Kaiserburg Bob – prva koruška bob staza na šinama, kao i Snowtubing kod donje stanice Kaiserburgbahn. Jedinstven doživljaj nudi „Sauna direktno na stazi” sa masažnim i sauna kockama na gornjim stanicama Kaiserburgbahn i Biosphärenparkbahn Brunnach. Za decu je tu Kidsslope – velika skijaška avantura sa maskotama Nox & Nixi, dok Snowpark nudi freestyle na različitim nivoima sa brojnim preprekama.

Ljubitelji laganijeg tempa mogu uživati na Slow Slope stazama. Područje nudi 4 škole skijanja sa vrhunskim vrtićima za decu, kao i posebne popuste za roditelje gde dečiji ski pass košta samo 1€ uz smeštaj kod partnera. Za opuštanje nakon skijanja, tu je Thermal Römerbad sa svojih 13 sauna i prostranim wellness prostorom na više nivoa. Besplatan Ski-Thermenbus povezuje sve ključne tačke od 08:30 do 17:00 časova.`,
        'St. Anton am Arlberg': 'Sankt Anton je kolevka alpskog skijanja i jedan od najprestižnijih ski centara na svetu. Sa direktnim pristupom ka 300 km staza, nudi vrhunski off-piste teren i legendarnu après-ski scenu.',
        'Kitzbühel': 'Kitzbühel je najpoznatiji po trci „Hahnenkamm”, najspektakularnijem spustu na svetu. Gradić odiše tradicijom i luksuzom, uz savršeno pripremljene staze za sve nivoe skijaša.',
        'Sölden': 'Sölden je jedini ski centar u Austriji sa tri vrha iznad 3.000 metara (BIG 3) i dva glečera, što garantuje sneg od oktobra do maja. Poznat je i kao lokacija snimanja filma James Bond „Spectre”.',
        'Ischgl': 'Ischgl je sinonim za visoki stil i vrhunsku zabavu. Moto „Relax if you can” najbolje opisuje spoj besprekornih staza koje se protežu do Švajcarske i nezaboravnih koncerata na vrhu planine.'
    };

    private readonly officialHighlights: Record<string, string[]> = {
        'Bad Kleinkirchheim': [
            '103 km staza (11km plave, 84km crvene, 8km crne)',
            '24 moderna lifta i gondole za maksimalan komfor',
            'Smeštaj kod partnera: Dečiji ski pass za samo 1€',
            'Kaiserburg Bob - prva koruška staza za bob na šinama',
            'Thermal Römerbad - 13 sauna i wellness na stazi',
            'Snowtubing i Snowpark za freestyle avanture',
            'Kidsslope - avantura sa maskotama Nox & Nixi',
            'Ski-Thermenbus - besplatan transfer kroz celo mesto',
            'Uživanje u 22 autentične planinske kolibe',
            '60 km zimskih planinarskih staza kroz idilične predele'
        ],
        'St. Anton am Arlberg': ['Najveće povezano skijalište u Austriji', 'Vrhunski Off-piste tereni', 'Legendarna MooserWirt zabava'],
        'Kitzbühel': ['Legendarna staza Streif', 'Srednjovekovni šarm grada', 'Vrhunski restorani'],
        'Sölden': ['BIG 3 - Tri vrha iznad 3.000m', '007 Elements izložba', 'Dva glečera'],
        'Ischgl': ['Top of the Mountain koncerti', 'Povezanost sa Švajcarskom (Samnaun)', 'Duty-free šoping']
    };

    private readonly criticalResorts = [
        {
            id: 'kopaonik-srbija',
            name: 'Kopaonik',
            country: 'Srbija',
            region: 'Raška/Rasina',
            location: { lat: 43.2863, lng: 20.8094 },
            status: 'open',
            activities: ['downhill', 'snowboarding', 'night_skiing', 'nordic'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 15, lengthInKm: 30 }, intermediate: { count: 10, lengthInKm: 14 }, advanced: { count: 7, lengthInKm: 6 } } } } }, lifts: { count: 24, byType: { gondola: { count: 1 }, chair_lift: { count: 11 }, drag_lift: { count: 12 } } } }
        },
        {
            id: 'stara-planina-srbija',
            name: 'Stara planina',
            country: 'Srbija',
            region: 'Istočna Srbija',
            location: { lat: 43.3765, lng: 22.5830 },
            status: 'open',
            activities: ['downhill', 'snowboarding'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 4, lengthInKm: 5 }, intermediate: { count: 3, lengthInKm: 5 }, advanced: { count: 2, lengthInKm: 3 } } } } }, lifts: { count: 5, byType: { gondola: { count: 1 }, chair_lift: { count: 2 }, drag_lift: { count: 2 } } } }
        },
        {
            id: 'tornik-zlatibor',
            name: 'Tornik',
            country: 'Srbija',
            region: 'Zapadna Srbija',
            location: { lat: 43.6644, lng: 19.6461 },
            status: 'open',
            activities: ['downhill', 'snowboarding'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 2, lengthInKm: 3 }, intermediate: { count: 2, lengthInKm: 3 }, advanced: { count: 1, lengthInKm: 1 } } } } }, lifts: { count: 3, byType: { gondola: { count: 0 }, chair_lift: { count: 1 }, drag_lift: { count: 2 } } } }
        },
        {
            id: 'bansko-bulgaria',
            name: 'Bansko',
            country: 'Bugarska',
            region: 'Pirin',
            location: { lat: 41.8384, lng: 23.4885 },
            status: 'open',
            activities: ['downhill', 'snowboarding'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 6, lengthInKm: 33 }, intermediate: { count: 9, lengthInKm: 37 }, advanced: { count: 3, lengthInKm: 5 } } } } }, lifts: { count: 14, byType: { gondola: { count: 1 }, chair_lift: { count: 9 }, drag_lift: { count: 4 } } } }
        },
        {
            id: 'borovets-bulgaria',
            name: 'Borovets',
            country: 'Bugarska',
            region: 'Rila',
            location: { lat: 42.2644, lng: 23.6067 },
            status: 'open',
            activities: ['downhill', 'snowboarding', 'night_skiing'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 8, lengthInKm: 24 }, intermediate: { count: 10, lengthInKm: 29 }, advanced: { count: 3, lengthInKm: 5 } } } } }, lifts: { count: 13, byType: { gondola: { count: 1 }, chair_lift: { count: 4 }, drag_lift: { count: 8 } } } }
        },
        {
            id: 'jahorina-bih',
            name: 'Jahorina',
            country: 'BiH',
            region: 'Republika Srpska',
            location: { lat: 43.7371, lng: 18.5714 },
            status: 'open',
            activities: ['downhill', 'snowboarding', 'night_skiing'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 5, lengthInKm: 20 }, intermediate: { count: 9, lengthInKm: 25 }, advanced: { count: 2, lengthInKm: 4 } } } } }, lifts: { count: 11, byType: { gondola: { count: 2 }, chair_lift: { count: 5 }, drag_lift: { count: 4 } } } }
        },
        {
            id: 'soelden-austria',
            name: 'Sölden',
            country: 'Austrija',
            region: 'Tyrol',
            location: { lat: 46.9677, lng: 11.0071 },
            status: 'open',
            activities: ['downhill', 'snowboarding', 'glacier'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 15, lengthInKm: 70 }, intermediate: { count: 12, lengthInKm: 45 }, advanced: { count: 8, lengthInKm: 29 } } } } }, lifts: { count: 31, byType: { gondola: { count: 8 }, chair_lift: { count: 16 }, drag_lift: { count: 7 } } } }
        },
        {
            id: 'kitzbuhel-austria',
            name: 'Kitzbühel',
            country: 'Austrija',
            region: 'Tyrol',
            location: { lat: 47.4466, lng: 12.3921 },
            status: 'open',
            activities: ['downhill', 'snowboarding'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 18, lengthInKm: 102 }, intermediate: { count: 14, lengthInKm: 66 }, advanced: { count: 6, lengthInKm: 20 } } } } }, lifts: { count: 57, byType: { gondola: { count: 11 }, chair_lift: { count: 27 }, drag_lift: { count: 19 } } } }
        },
        {
            id: 'bad-kleinkirchheim-austria',
            name: 'Bad Kleinkirchheim',
            country: 'Austrija',
            region: 'Carinthia',
            location: { lat: 46.8143, lng: 13.7915 },
            status: 'open',
            activities: ['downhill', 'snowboarding', 'thermal_bath'],
            stats: { runs: { byActivity: { downhill: { byDifficulty: { easy: { count: 5, lengthInKm: 18 }, intermediate: { count: 15, lengthInKm: 77 }, advanced: { count: 3, lengthInKm: 8 } } } } }, lifts: { count: 24, byType: { gondola: { count: 4 }, chair_lift: { count: 7 }, drag_lift: { count: 13 } } } }
        }
    ];

    private readonly officialSkiPassPrices: Record<string, any> = {
        'Bad Kleinkirchheim': {
            seasons: [
                {
                    name: 'Peak Sezona',
                    dates: '25.12.25 - 06.01.26 | 25.01.26 - 14.03.26',
                    prices: [
                        {
                            duration: '1 dan',
                            adult: { price: 69.50, label: 'Odrasli (19+ god)' },
                            youth: { price: 52.00, label: 'Mladi (15-18 god)' },
                            child: { price: 35.00, label: 'Deca (6-14 god)' }
                        },
                        {
                            duration: '6 dana',
                            adult: { price: 363.00, label: 'Odrasli (19+ god)' },
                            youth: { price: 273.00, label: 'Mladi (15-18 god)' },
                            child: { price: 182.00, label: 'Deca (6-14 god)' }
                        }
                    ]
                },
                {
                    name: 'Međusezona',
                    dates: '07.01.26 - 24.01.26 | 15.03.26 - 28.03.26',
                    prices: [
                        {
                            duration: '1 dan',
                            adult: { price: 64.50, label: 'Odrasli (19+ god)' },
                            youth: { price: 48.50, label: 'Mladi (15-18 god)' },
                            child: { price: 32.50, label: 'Deca (6-14 god)' }
                        },
                        {
                            duration: '6 dana',
                            adult: { price: 341.00, label: 'Odrasli (19+ god)' },
                            youth: { price: 256.00, label: 'Mladi (15-18 god)' },
                            child: { price: 171.00, label: 'Deca (6-14 god)' }
                        }
                    ]
                }
            ]
        },
        'Kopaonik': {
            seasons: [
                {
                    name: 'Peak Sezona',
                    dates: 'Sredina sec - polovina feb',
                    prices: [
                        {
                            duration: '1 dan',
                            adult: { price: 45.00, label: 'Odrasli (12+ god)' },
                            youth: { price: 35.00, label: 'Studenti/Seniori' },
                            child: { price: 28.00, label: 'Deca (6-11 god)' }
                        }
                    ]
                }
            ]
        }
    };

    private constructor() { }

    private getSerbianName(name: string, country: string): string {
        if (country === 'Srbija' || country === 'Serbia') return name;
        if (this.serbianTranslations[name]) return this.serbianTranslations[name];

        // Basic phonetic fallback
        return name
            .replace(/sch/g, 'š')
            .replace(/sh/g, 'š')
            .replace(/ch/g, 'č')
            .replace(/cz/g, 'č')
            .replace(/tsch/g, 'č')
            .replace(/tz/g, 'c')
            .replace(/w/g, 'v')
            .replace(/y/g, 'i')
            .replace(/x/g, 'ks')
            .replace(/qu/g, 'kv')
            .replace(/ph/g, 'f')
            .replace(/Sch/g, 'Š')
            .replace(/Sh/g, 'Š')
            .replace(/Ch/g, 'Č')
            .replace(/Tsch/g, 'Č')
            .replace(/Tz/g, 'C')
            .replace(/W/g, 'V')
            .replace(/Y/g, 'I')
            .replace(/X/g, 'Ks')
            .replace(/Qu/g, 'Kv')
            .replace(/Ph/g, 'F');
    }

    public static getInstance(): SkiApiService {
        if (!SkiApiService.instance) {
            SkiApiService.instance = new SkiApiService();
        }
        return SkiApiService.instance;
    }

    private mapWmoCode(code: number): string {
        if (code === 0) return 'Sunny';
        if (code <= 3) return 'Partly Cloudy';
        if (code === 45 || code === 48) return 'Foggy';
        if (code >= 51 && code <= 55) return 'Drizzle';
        if (code >= 61 && code <= 65) return 'Rainy';
        if (code >= 71 && code <= 77) return 'Snowing';
        if (code >= 80 && code <= 82) return 'Showers';
        if (code === 85 || code === 86) return 'Snow Showers';
        if (code >= 95) return 'Stormy';
        return 'Cloudy';
    }

    private async fetchLiveWeather(lat: number, lng: number) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=snow_depth&timezone=auto`;
            const response = await fetch(url);
            const data = await response.json();

            return {
                temp: Math.round(data.current?.temperature_2m ?? 0),
                conditions: this.mapWmoCode(data.current?.weather_code ?? 0),
                windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
                snowDepth: Math.round((data.hourly?.snow_depth?.[0] ?? 0) * 100),
                humidity: data.current?.relative_humidity_2m
            };
        } catch (e) {
            console.error('Open-Meteo Error:', e);
            return null;
        }
    }

    private async mapDbResortToSkiResort(dbResort: any): Promise<SkiResort> {
        const lat = dbResort.location?.lat ?? dbResort.latitude ?? 0;
        const lng = dbResort.location?.lng ?? dbResort.longitude ?? 0;
        const liveWeather = await this.fetchLiveWeather(lat, lng);

        const stats = dbResort.stats || {};
        const runStats = stats.runs?.byActivity?.downhill?.byDifficulty || {};

        const runsByDifficulty: any = {};
        let calculatedTotalLength = 0;
        Object.entries(runStats).forEach(([cat, s]: [string, any]) => {
            const l = parseFloat((s.lengthInKm || 0).toFixed(1));
            calculatedTotalLength += l;
            runsByDifficulty[cat] = {
                count: s.count || 0,
                lengthKm: l
            };
        });

        const liftStats = stats.lifts?.byType || {};
        const liftsByType: any = {};
        Object.entries(liftStats).forEach(([type, s]: [string, any]) => {
            liftsByType[type] = {
                count: s.count || 0
            };
        });

        return {
            id: dbResort.id,
            name: dbResort.name,
            country: dbResort.country,
            region: dbResort.region,
            status: dbResort.status as any,
            lastUpdated: dbResort.updated_at || new Date().toISOString(),
            localizedName: this.getSerbianName(dbResort.name, dbResort.country),
            mapImageUrl: this.officialMaps[dbResort.name] || dbResort.map_image_url || null,
            websiteUrl: dbResort.website_url,

            snowReport: {
                summitDepth: liveWeather?.snowDepth ? liveWeather.snowDepth + 30 : 50,
                baseDepth: liveWeather?.snowDepth || 20,
                newSnow24h: liveWeather?.conditions === 'Snowing' ? 10 : 0,
                newSnow48h: liveWeather?.conditions === 'Snowing' ? 20 : 0,
                lastSnowfallDate: new Date().toISOString().split('T')[0],
                snowCondition: 'Packed'
            },

            mountainStatus: {
                liftsTotal: stats.lifts?.count || 0,
                liftsOpen: Math.floor((stats.lifts?.count || 0) * 0.9),
                trailsTotal: stats.runs?.count || 0,
                trailsOpen: Math.floor((stats.runs?.count || 0) * 0.85),
                nightSkiing: dbResort.activities?.includes('night_skiing') || false,
                snowMaking: true,

                stats: {
                    runs: {
                        totalCount: stats.runs?.count || 0,
                        totalLengthKm: parseFloat(calculatedTotalLength.toFixed(1)),
                        byDifficulty: runsByDifficulty
                    },
                    lifts: {
                        totalCount: stats.lifts?.count || 0,
                        byType: liftsByType
                    }
                }
            },

            weather: {
                summit: {
                    temp: (liveWeather?.temp ?? 0) - 3,
                    feelsLike: (liveWeather?.temp ?? 0) - 6,
                    conditions: liveWeather?.conditions || 'Unknown',
                    windSpeed: (liveWeather?.windSpeed ?? 0) + 10,
                    windDir: 'NW',
                    visibility: 5000
                },
                mid: {
                    temp: (liveWeather?.temp ?? 0) - 1,
                    feelsLike: (liveWeather?.temp ?? 0) - 4,
                    conditions: liveWeather?.conditions || 'Unknown',
                    windSpeed: (liveWeather?.windSpeed ?? 0) + 5,
                    windDir: 'W',
                    visibility: 8000
                },
                base: {
                    temp: liveWeather?.temp ?? 0,
                    feelsLike: liveWeather?.temp ?? 0,
                    conditions: liveWeather?.conditions || 'Unknown',
                    windSpeed: liveWeather?.windSpeed ?? 0,
                    windDir: 'SW',
                    visibility: 15000
                }
            },

            location: {
                lat: dbResort.location?.lat ?? dbResort.latitude ?? 0,
                lng: dbResort.location?.lng ?? dbResort.longitude ?? 0
            },
            activities: dbResort.activities,
            description: this.officialDescriptions[dbResort.name] || null,
            gallery: this.officialGalleries[dbResort.name] || [],
            keyHighlights: this.officialHighlights[dbResort.name] || [],
            skiPassPrices: this.officialSkiPassPrices[dbResort.name] || null
        };
    }

    public async searchResorts(query: string = ''): Promise<SkiSearchResponse> {
        try {
            let queryBuilder = supabase.from('ski_resorts').select('*');
            if (query) {
                queryBuilder = queryBuilder.or(`name.ilike.%${query}%,country.ilike.%${query}%,region.ilike.%${query}%`);
            }
            const { data, error } = await queryBuilder.limit(20);

            // If Supabase is empty, fall back to the comprehensive local JSON file (1900+ resorts)
            if (error || !data || data.length === 0) {
                console.info('Using local JSON source for resorts (1900+ available)');
                const normalizedQuery = query.toLowerCase();
                const pureEuropeanResorts = (europeanResorts as any[]).filter(r => {
                    const lowName = (r.name || '').toLowerCase();
                    return !lowName.includes('kopaonik') && !lowName.includes('stara planina') && !lowName.includes('tornik');
                });
                const fullDataSource = [...pureEuropeanResorts, ...this.criticalResorts];

                const filtered = fullDataSource
                    .filter(r =>
                        !query ||
                        r.name.toLowerCase().includes(normalizedQuery) ||
                        r.country.toLowerCase().includes(normalizedQuery) ||
                        (r.region && r.region.toLowerCase().includes(normalizedQuery))
                    )
                    .slice(0, 20);

                const resorts = await Promise.all(filtered.map(r => this.mapDbResortToSkiResort(r)));
                return { resorts };
            }

            const resorts = await Promise.all(data.map((dbResort: any) => this.mapDbResortToSkiResort(dbResort)));
            return { resorts };
        } catch (error) {
            console.error('Error fetching ski data:', error);
            return { resorts: [] };
        }
    }

    public async getResortById(id: string): Promise<SkiResort | null> {
        try {
            const { data, error } = await supabase.from('ski_resorts').select('*').eq('id', id).maybeSingle();

            if (error || !data) {
                const pureEuropeanResorts = (europeanResorts as any[]).filter(r => {
                    const lowName = (r.name || '').toLowerCase();
                    return !lowName.includes('kopaonik') && !lowName.includes('stara planina') && !lowName.includes('tornik');
                });
                const fullDataSource = [...pureEuropeanResorts, ...this.criticalResorts];

                // Check local JSON fallback
                const local = fullDataSource.find(r => r.id === id);
                if (local) return await this.mapDbResortToSkiResort(local);
                return null;
            }
            return await this.mapDbResortToSkiResort(data);
        } catch (e) {
            console.error('Error in getResortById:', e);
            return null;
        }
    }
}

export const skiApiService = SkiApiService.getInstance();
