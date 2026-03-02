export const NBS_RATES = {
    'EUR': 117.00,
    'USD': 108.00,
    'RSD': 1.00
} as const;

export const DOCUMENT_TRACKER_DEFAULT = {
    contract: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
    voucher: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
    itinerary: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
    proforma: { generated: false, sentEmail: false, sentViber: false, sentPrint: false }
};
