import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MailAccount {
    id: string;
    email: string;
    name: string;
    color: string;
    signature?: string;
    title?: string;
    phoneOffice?: string;
    phoneMobile?: string;
    web?: string;
    companyName?: string;
    logoUrl?: string;
}

export interface Email {
    id: string;
    sender: string;
    senderEmail: string;
    recipient: string;
    subject: string;
    preview: string;
    body: string;
    time: string;
    isUnread: boolean;
    isStarred: boolean;
    category: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';
    accountId: string;
    deletedAt?: string;
    isLocal?: boolean;
}

interface MailState {
    accounts: MailAccount[];
    emails: Email[];
    selectedAccountId: string;
    draftToCompose: { subject: string; body: string; to?: string } | null;

    // Actions
    sendEmail: (data: { accountId: string, to: string, subject: string, body: string, sender: string, senderEmail: string }) => void;
    updateEmail: (id: string, updates: Partial<Email>) => void;
    deleteEmail: (id: string) => void;
    restoreEmail: (id: string) => void;
    setSignature: (accountId: string, signature: string) => void;
    setSelectedAccount: (id: string) => void;
    setEmails: (emails: Email[]) => void;
    addAccount: (account: Omit<MailAccount, 'id'>) => string;
    updateAccount: (id: string, updates: Partial<MailAccount>) => void;
    removeAccount: (id: string) => void;
    receiveEmail: (data: { accountId: string, from: string, fromEmail: string, subject: string, body: string }) => void;
    setDraftToCompose: (draft: { subject: string; body: string; to?: string } | null) => void;
}

const defaultSignature = (name: string, title: string, email: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 25px;">
    <div style="font-weight: 800; font-size: 18px; color: #0f172a; margin-bottom: 2px;">${name}</div>
    <div style="font-weight: 600; font-size: 13px; color: #475569; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.5px;">${title}</div>
    
    <table cellpadding="0" cellspacing="0" style="font-size: 13px; color: #475569; border: none;">
        <tr>
            <td style="padding: 2px 0;">☎️ <span style="margin-left: 8px;"><b>T:</b> +381 11 311 0 311</span></td>
        </tr>
        <tr>
            <td style="padding: 2px 0;">📱 <span style="margin-left: 8px;"><b>M:</b> +381 64 111 2233</span></td>
        </tr>
        <tr>
            <td style="padding: 2px 0;">✉️ <span style="margin-left: 8px;"><b>E:</b> ${email}</span></td>
        </tr>
        <tr>
            <td style="padding: 2px 0;">🌐 <span style="margin-left: 8px;"><b>W:</b> www.olympic.rs</span></td>
        </tr>
    </table>
    
    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
        <img src="/clicktotravel.png" alt="PrimeClick Logo" style="height: 60px; width: auto; display: block;" />
        <div style="margin-top: 10px; font-weight: 800; color: #0f172a; font-size: 15px; letter-spacing: -0.3px;">PrimeClickTravel</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Premium Travel Management System</div>
    </div>
</div>
`;

const initialAccounts: MailAccount[] = [
    { 
        id: 'acc1', 
        email: 'nenad.tomic1403@gmail.com', 
        name: 'Nenad Tomić', 
        color: '#ea4335',
        title: 'Direktor',
        companyName: 'PrimeClickTravel',
        phoneOffice: '+381 11 311 0 311',
        phoneMobile: '+381 64 111 2233',
        web: 'www.olympic.rs',
        signature: defaultSignature('Nenad Tomić', 'Direktor', 'nenad.tomic1403@gmail.com')
    },
    { 
        id: 'acc2', 
        email: 'nenad.tomic@olympic.rs', 
        name: 'Nenad Tomić', 
        color: '#3fb950',
        title: 'Direktor',
        companyName: 'Olympic Travel',
        signature: defaultSignature('Nenad Tomić', 'Direktor', 'nenad.tomic@olympic.rs')
    },
    { 
        id: 'acc3', 
        email: 'info@olympic.rs', 
        name: 'Olympic Info', 
        color: '#3b82f6',
        title: 'Customer Support',
        companyName: 'Olympic Travel',
        signature: defaultSignature('Olympic Travel Team', 'Podrška Korisnicima', 'info@olympic.rs')
    }
];

const initialEmails: Email[] = [
    // Inbox - Primljeni mejlovi
    {
        id: 'msg-001',
        accountId: 'acc1',
        sender: 'Marko Petrović',
        senderEmail: 'marko.petrovic@gmail.com',
        recipient: 'nenad.tomic1403@gmail.com',
        subject: 'Upit za letovanje u Grčkoj - porodica 4 osobe',
        body: `Poštovani,

Interesuje me ponuda za letovanje u Grčkoj za period od 15.07. do 25.07.2026. godine.

Putujemo porodica od 4 osobe (2 odraslih + 2 dece uzrasta 8 i 12 godina).

Preferiramo:
- Hotel 4* ili 5* sa All Inclusive uslugom
- Smeštaj u blizini plaže
- Destinacija: Halkidiki ili Krit
- Budžet: do 3000 EUR

Molim Vas da mi pošaljete ponudu sa dostupnim opcijama.

Hvala unapred!

Srdačan pozdrav,
Marko Petrović
Tel: +381 64 123 4567`,
        preview: 'Interesuje me ponuda za letovanje u Grčkoj za period od 15.07. do 25.07.2026. godine. Putujemo porodica od 4 osobe...',
        time: '09:15',
        isUnread: true,
        isStarred: false,
        category: 'inbox',
        isLocal: true
    },
    {
        id: 'msg-002',
        accountId: 'acc2',
        sender: 'Ana Jovanović',
        senderEmail: 'ana.jovanovic@example.com',
        recipient: 'nenad.tomic@olympic.rs',
        subject: 'Potvrda rezervacije - Turska, Antalija',
        body: `Poštovani,

Želim da potvrdim rezervaciju za aranžman u Turskoj:

Hotel: Crystal Sunset Luxury Resort 5*
Destinacija: Antalija, Turska
Period: 01.08 - 10.08.2026
Smeštaj: 2 odraslih, 1 dete (5 godina)
Tip sobe: Superior Room Sea View
Usluga: Ultra All Inclusive

Molim Vas da mi pošaljete profakturu i uputstvo za uplatu.

Hvala!

Srdačan pozdrav,
Ana Jovanović
Tel: +381 63 987 6543`,
        preview: 'Želim da potvrdim rezervaciju za aranžman u Turskoj: Hotel: Crystal Sunset Luxury Resort 5*...',
        time: '10:42',
        isUnread: true,
        isStarred: true,
        category: 'inbox',
        isLocal: true
    },
    {
        id: 'msg-003',
        accountId: 'acc3',
        sender: 'Jelena Nikolić',
        senderEmail: 'jelena.nikolic@company.rs',
        recipient: 'info@olympic.rs',
        subject: 'Grupno putovanje - 25 osoba, Egipat',
        body: `Poštovanje,

Organizujemo grupno putovanje za našu kompaniju i interesuje nas ponuda za Egipat.

Detalji:
- Broj putnika: 25 osoba
- Period: Septembar 2026 (fleksibilni smo sa datumom)
- Destinacija: Hurgada ili Šarm el Šeik
- Trajanje: 7 noćenja
- Hotel: 5* sa All Inclusive
- Potreban transfer od aerodroma

Molim Vas za ponudu sa cenama i dostupnim terminima.

Takođe nas interesuje mogućnost organizovanja team building aktivnosti.

Srdačan pozdrav,
Jelena Nikolić
Event Manager
Tel: +381 11 234 5678`,
        preview: 'Organizujemo grupno putovanje za našu kompaniju i interesuje nas ponuda za Egipat. Broj putnika: 25 osoba...',
        time: '11:28',
        isUnread: false,
        isStarred: false,
        category: 'inbox',
        isLocal: true
    },
    {
        id: 'msg-004',
        accountId: 'acc1',
        sender: 'Stefan Đorđević',
        senderEmail: 'stefan.djordjevic@gmail.com',
        recipient: 'nenad.tomic1403@gmail.com',
        subject: 'Ski pass Kopaonik - Novogodišnji aranžman',
        body: `Zdravo Nenade,

Interesuje me novogodišnji aranžman na Kopaoniku.

Putujemo 2 odraslih + 1 dete (10 godina).

Period: 29.12.2026 - 05.01.2027 (7 noćenja)

Potrebno nam je:
- Apartman ili studio sa kuhinjom
- Ski pass za sve
- Škola skijanja za dete (ako je moguće)

Budžet: do 1500 EUR

Javi mi šta imaš dostupno.

Pozdrav,
Stefan`,
        preview: 'Interesuje me novogodišnji aranžman na Kopaoniku. Putujemo 2 odraslih + 1 dete (10 godina)...',
        time: '14:05',
        isUnread: true,
        isStarred: false,
        category: 'inbox',
        isLocal: true
    },
    {
        id: 'msg-005',
        accountId: 'acc2',
        sender: 'Milan Stojanović',
        senderEmail: 'milan.stojanovic@travel.rs',
        recipient: 'nenad.tomic@olympic.rs',
        subject: 'Saradnja - B2B ponude za agencije',
        body: `Poštovani,

Predstavljam turističku agenciju "Travel Plus" iz Novog Sada.

Interesuje nas uspostavljanje B2B saradnje i pristup vašim ponudama za:
- Letovanja (Grčka, Turska, Egipat)
- Zimovanja (Kopaonik, Zlatibor)
- Gradske ture (Beč, Budimpešta, Prag)

Molim Vas da mi pošaljete:
- Uslove saradnje
- Provizije za agencije
- Pristup B2B portalu (ako postoji)

Očekujemo uspešnu saradnju!

Srdačan pozdrav,
Milan Stojanović
Travel Plus Agency
Tel: +381 21 456 7890
www.travelplus.rs`,
        preview: 'Predstavljam turističku agenciju "Travel Plus" iz Novog Sada. Interesuje nas uspostavljanje B2B saradnje...',
        time: '15:33',
        isUnread: false,
        isStarred: true,
        category: 'inbox',
        isLocal: true
    },

    // Sent - Poslati mejlovi
    {
        id: 'msg-sent-001',
        accountId: 'acc1',
        sender: 'Nenad Tomić',
        senderEmail: 'nenad.tomic1403@gmail.com',
        recipient: 'marko.petrovic@gmail.com',
        subject: 'Re: Upit za letovanje u Grčkoj - porodica 4 osobe',
        body: `Poštovani Marko,

Hvala na upitu!

Imam odličnu ponudu za Vas:

🏨 HOTEL: Blue Lagoon Resort 5*
📍 LOKACIJA: Halkidiki, Kasandra
📅 PERIOD: 15.07 - 25.07.2026 (10 noćenja)
👨‍👩‍👧‍👦 SMEŠTAJ: 2 odraslih + 2 dece (8 i 12 god)
🍽️ USLUGA: All Inclusive
💰 CENA: 2.750 EUR (ukupno za sve)

Uključeno:
✅ Avionski prevoz (direktan let)
✅ Transfer aerodrom-hotel-aerodrom
✅ Osiguranje
✅ Dečiji klub i animacija
✅ Bazen sa toboganima
✅ Plaža udaljena 50m

Hotel ima odličan kids club i animaciju za decu, a plaža je peskovita i plitka - idealno za porodice.

Da li Vas interesuje ova ponuda? Mogu da rezervišem odmah.

Srdačan pozdrav,
Nenad Tomić
Olympic Travel
Tel: +381 64 111 2233`,
        preview: 'Hvala na upitu! Imam odličnu ponudu za Vas: HOTEL: Blue Lagoon Resort 5*, LOKACIJA: Halkidiki...',
        time: '09:45',
        isUnread: false,
        isStarred: false,
        category: 'sent',
        isLocal: true
    },
    {
        id: 'msg-sent-002',
        accountId: 'acc2',
        sender: 'Nenad Tomić',
        senderEmail: 'nenad.tomic@olympic.rs',
        recipient: 'ana.jovanovic@example.com',
        subject: 'Re: Potvrda rezervacije - Turska, Antalija',
        body: `Poštovana Ana,

Vaša rezervacija je potvrđena! 🎉

📋 DETALJI REZERVACIJE:
━━━━━━━━━━━━━━━━━━━━━━━━━
🏨 Hotel: Crystal Sunset Luxury Resort 5*
📍 Destinacija: Antalija, Turska
📅 Period: 01.08 - 10.08.2026 (9 noćenja)
👥 Putnici: 2 odraslih + 1 dete (5 god)
🛏️ Soba: Superior Room Sea View
🍽️ Usluga: Ultra All Inclusive
💰 Ukupna cena: 1.890 EUR

UKLJUČENO:
✅ Avionski prevoz (direktan let)
✅ Transfer aerodrom-hotel-aerodrom
✅ Putno osiguranje
✅ Sve takse i naknade

U prilogu šaljem profakturu. Rok za uplatu je 7 dana.

Uplatom potvrđujete rezervaciju.

Za sva pitanja sam na raspolaganju!

Srdačan pozdrav,
Nenad Tomić
Olympic Travel
Tel: +381 64 111 2233
Email: nenad.tomic@olympic.rs`,
        preview: 'Vaša rezervacija je potvrđena! Hotel: Crystal Sunset Luxury Resort 5*, Destinacija: Antalija, Turska...',
        time: '11:10',
        isUnread: false,
        isStarred: false,
        category: 'sent',
        isLocal: true
    },
    {
        id: 'msg-sent-003',
        accountId: 'acc3',
        sender: 'Olympic Travel Team',
        senderEmail: 'info@olympic.rs',
        recipient: 'jelena.nikolic@company.rs',
        subject: 'Re: Grupno putovanje - 25 osoba, Egipat',
        body: `Poštovana Jelena,

Hvala na upitu za grupno putovanje!

Pripremili smo ponudu za Vašu grupu:

🌴 EGIPAT - GRUPNI ARANŽMAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 DESTINACIJA: Hurgada
🏨 HOTEL: Jaz Aquamarine Resort 5*
📅 PERIOD: 10.09 - 17.09.2026 (7 noćenja)
👥 GRUPA: 25 osoba
🍽️ USLUGA: All Inclusive

💰 CENA PO OSOBI: 650 EUR
💰 UKUPNO: 16.250 EUR

UKLJUČENO:
✅ Avionski prevoz (charter let)
✅ Transfer aerodrom-hotel-aerodrom
✅ Smeštaj u dvokrevetnim sobama
✅ All Inclusive ishrana
✅ Osiguranje
✅ Vodič tokom putovanja

🎯 TEAM BUILDING OPCIJE:
- Jeep safari kroz pustinju (40 EUR/os)
- Snorkeling izlet (35 EUR/os)
- Večera na brodu (50 EUR/os)

📌 SPECIJALNA POGODNOST:
- 1 osoba GRATIS (za organizatora)
- Fleksibilna uplata (3 rate)

Ponuda važi do 31.01.2026.

Za rezervaciju potreban je avans od 30%.

Srdačan pozdrav,
Olympic Travel Team
Tel: +381 11 123 4567
Email: info@olympic.rs
www.olympic.rs`,
        preview: 'Hvala na upitu za grupno putovanje! Pripremili smo ponudu za Vašu grupu: EGIPAT - GRUPNI ARANŽMAN...',
        time: '12:15',
        isUnread: false,
        isStarred: false,
        category: 'sent',
        isLocal: true
    },

    // Drafts - Nedovršeni mejlovi
    {
        id: 'msg-draft-001',
        accountId: 'acc1',
        sender: 'Nenad Tomić',
        senderEmail: 'nenad.tomic1403@gmail.com',
        recipient: 'milan.petrovic@example.com',
        subject: 'Ponuda za Španiju - Costa Brava',
        body: `Poštovani Milan,

Hvala na upitu za letovanje u Španiji.

Pripremio sam ponudu za Costa Bravu:

🏨 HOTEL: H-Top Royal Sun 4*
📍 LOKACIJA: Santa Susanna, Costa Brava
📅 PERIOD: 

[NEDOVRŠENO - treba dodati detalje]`,
        preview: 'Hvala na upitu za letovanje u Španiji. Pripremio sam ponudu za Costa Bravu...',
        time: '16:22',
        isUnread: false,
        isStarred: false,
        category: 'drafts',
        isLocal: true
    },
    {
        id: 'msg-draft-002',
        accountId: 'acc2',
        sender: 'Nenad Tomić',
        senderEmail: 'nenad.tomic@olympic.rs',
        recipient: '',
        subject: 'Novogodišnja ponuda - Kopaonik',
        body: `Poštovani,

Pripremamo specijalne novogodišnje ponude za Kopaonik.

[DRAFT - treba dodati detalje o hotelima i cenama]`,
        preview: 'Pripremamo specijalne novogodišnje ponude za Kopaonik...',
        time: '17:45',
        isUnread: false,
        isStarred: false,
        category: 'drafts',
        isLocal: true
    }
];

export const useMailStore = create<MailState>()(
    persist(
        (set) => ({
            accounts: initialAccounts,
            emails: initialEmails,
            selectedAccountId: 'acc1',
            draftToCompose: null,

            sendEmail: (data: { accountId: string, to: string, subject: string, body: string, sender: string, senderEmail: string }) => set((state: MailState) => {
                const newEmail: Email = {
                    id: Math.random().toString(36).substring(7),
                    accountId: data.accountId,
                    sender: data.sender,
                    senderEmail: data.senderEmail,
                    recipient: data.to,
                    subject: data.subject,
                    body: data.body,
                    preview: data.body.substring(0, 100) + '...',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isUnread: false,
                    isStarred: false,
                    category: 'sent',
                    isLocal: true
                };
                return { emails: [newEmail, ...state.emails] };
            }),

            updateEmail: (id: string, updates: Partial<Email>) => set((state: MailState) => ({
                emails: state.emails.map(e => e.id === id ? { ...e, ...updates } : e)
            })),

            deleteEmail: (id: string) => set((state: MailState) => ({
                emails: state.emails.map(e => {
                    if (e.id === id) {
                        return {
                            ...e,
                            category: 'trash',
                            deletedAt: new Date().toISOString()
                        };
                    }
                    return e;
                })
            })),

            restoreEmail: (id: string) => set((state: MailState) => ({
                emails: state.emails.map(e => {
                    if (e.id === id) {
                        return { ...e, category: 'inbox', deletedAt: undefined };
                    }
                    return e;
                })
            })),

            setSignature: (accountId: string, signature: string) => set((state: MailState) => ({
                accounts: state.accounts.map(a => a.id === accountId ? { ...a, signature } : a)
            })),

            setSelectedAccount: (id: string) => set({ selectedAccountId: id }),
            setEmails: (emails: Email[]) => set({ emails }),

            addAccount: (accountData: Omit<MailAccount, 'id'>) => {
                const newId = `acc-${Math.random().toString(36).substring(2, 9)}`;
                set((state: MailState) => ({
                    accounts: [...state.accounts, { ...accountData, id: newId }],
                    selectedAccountId: newId
                }));
                return newId;
            },

            updateAccount: (id: string, updates: Partial<MailAccount>) => set((state: MailState) => ({
                accounts: state.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
            })),

            removeAccount: (id: string) => set((state: MailState) => {
                const newAccounts = state.accounts.filter(a => a.id !== id);
                return {
                    accounts: newAccounts,
                    selectedAccountId: state.selectedAccountId === id
                        ? (newAccounts.length > 0 ? newAccounts[0].id : '')
                        : state.selectedAccountId
                };
            }),

            receiveEmail: (data: { accountId: string, from: string, fromEmail: string, subject: string, body: string }) => set((state: MailState) => {
                const newEmail: Email = {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    accountId: data.accountId,
                    sender: data.from,
                    senderEmail: data.fromEmail,
                    recipient: 'Mene',
                    subject: data.subject,
                    body: data.body,
                    preview: data.body.substring(0, 100) + '...',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isUnread: true,
                    isStarred: false,
                    category: 'inbox',
                    isLocal: true
                };
                return { emails: [newEmail, ...state.emails] };
            }),

            setDraftToCompose: (draft) => set({ draftToCompose: draft }),
        }),
        {
            name: 'olympic-mail-storage',
        }
    )
);
