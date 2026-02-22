export const countries = [
    { code: 'RS', name: 'Srbija' },
    { code: 'ME', name: 'Crna Gora' },
    { code: 'HR', name: 'Hrvatska' },
    { code: 'BA', name: 'Bosna i Hercegovina' },
    { code: 'MK', name: 'Severna Makedonija' },
    { code: 'SI', name: 'Slovenija' },
    { code: 'GR', name: 'Grčka' },
    { code: 'TR', name: 'Turska' },
    { code: 'IT', name: 'Italija' },
    { code: 'ES', name: 'Španija' },
    { code: 'FR', name: 'Francuska' },
    { code: 'DE', name: 'Nemačka' },
    { code: 'AT', name: 'Austrija' },
    { code: 'CH', name: 'Švajcarska' },
    { code: 'HU', name: 'Mađarska' },
    { code: 'RO', name: 'Rumunija' },
    { code: 'BG', name: 'Bugarska' },
    { code: 'AL', name: 'Albanija' },
    { code: 'RU', name: 'Rusija' },
    { code: 'US', name: 'Sjedinjene Američke Države' },
    { code: 'GB', name: 'Velika Britanija' },
    { code: 'CN', name: 'Kina' },
    { code: 'AE', name: 'Ujedinjeni Arapski Emirati' },
    { code: 'EG', name: 'Egipat' },
    { code: 'TN', name: 'Tunis' },
    { code: 'TH', name: 'Tajland' },
    { code: 'MV', name: 'Maldivi' }
].sort((a, b) => a.name.localeCompare(b.name));

export const getCountryName = (code: string) => {
    return countries.find(c => c.code === code)?.name || code;
};
