/**
 * Package Mock Service
 * 
 * Mock data and service for Dynamic Package Builder
 */

import type {
    DynamicPackage,
    PackageDestination,
    PackageFlight,
    PackageHotel,
    PackageTransfer,
    PackageExtra,
    ExtrasCatalogItem,
    DayByDayItinerary,
    ItineraryActivity,
    PackagePricing
} from '../types/package.types';

// ============================================================================
// MOCK EXTRAS CATALOG
// ============================================================================

export const mockExtrasCatalog: ExtrasCatalogItem[] = [
    // Paris
    {
        id: 'extra-1',
        type: 'ticket',
        name: 'Disneyland Paris - 1 Day',
        description: '1-dnevna ulaznica za Disneyland Paris sa pristupom svim atrakcijama',
        destination: 'Paris',
        destinations: ['Paris'],
        duration: 480, // 8 hours
        price: 89,
        currency: 'EUR',
        rating: 4.8,
        reviews: 15420,
        popular: true
    },
    {
        id: 'extra-2',
        type: 'ticket',
        name: 'Eiffel Tower Summit',
        description: 'Ulaznica za vrh Eiffel Tower-a sa skip-the-line pristupom',
        destination: 'Paris',
        destinations: ['Paris'],
        duration: 120,
        price: 35,
        currency: 'EUR',
        rating: 4.9,
        reviews: 28500,
        popular: true
    },
    {
        id: 'extra-3',
        type: 'ticket',
        name: 'Louvre Museum',
        description: 'Ulaznica za Louvre muzej sa audio vodičem',
        destination: 'Paris',
        destinations: ['Paris'],
        duration: 180,
        price: 25,
        currency: 'EUR',
        rating: 4.7,
        reviews: 19800
    },
    {
        id: 'extra-4',
        type: 'tour',
        name: 'Seine River Cruise',
        description: 'Večernja krstarenje Senom sa večerom',
        destination: 'Paris',
        destinations: ['Paris'],
        duration: 150,
        price: 75,
        currency: 'EUR',
        rating: 4.6,
        reviews: 8900
    },
    // Milan
    {
        id: 'extra-5',
        type: 'ticket',
        name: 'Duomo di Milano',
        description: 'Ulaznica za katedralu Duomo sa pristupom terasi',
        destination: 'Milan',
        destinations: ['Milan'],
        duration: 90,
        price: 20,
        currency: 'EUR',
        rating: 4.8,
        reviews: 12300,
        popular: true
    },
    {
        id: 'extra-6',
        type: 'tour',
        name: 'Milan City Walking Tour',
        description: 'Tura po centru Milana sa lokalnim vodičem',
        destination: 'Milan',
        destinations: ['Milan'],
        duration: 180,
        price: 45,
        currency: 'EUR',
        rating: 4.7,
        reviews: 5600
    },
    {
        id: 'extra-7',
        type: 'ticket',
        name: 'La Scala Opera House',
        description: 'Ulaznica za muzej La Scala i pozorište',
        destination: 'Milan',
        destinations: ['Milan'],
        duration: 120,
        price: 30,
        currency: 'EUR',
        rating: 4.5,
        reviews: 3200
    },
    {
        id: 'extra-8',
        type: 'restaurant',
        name: 'Traditional Italian Dinner',
        description: 'Večera u tradicionalnom italijanskom restoranu',
        destination: 'Milan',
        destinations: ['Milan'],
        duration: 120,
        price: 55,
        currency: 'EUR',
        rating: 4.6,
        reviews: 2100
    }
];

// ============================================================================
// MOCK PACKAGE GENERATOR
// ============================================================================

class PackageMockService {
    /**
     * Generate sample package: Milan & Paris
     */
    generateSamplePackage(): DynamicPackage {
        const startDate = new Date('2026-06-15');

        // Destinations
        const destinations: PackageDestination[] = [
            {
                id: 'dest-1',
                city: 'Milan',
                country: 'Italy',
                countryCode: 'IT',
                arrivalDate: '2026-06-15',
                departureDate: '2026-06-18',
                nights: 3,
                sequence: 1
            },
            {
                id: 'dest-2',
                city: 'Paris',
                country: 'France',
                countryCode: 'FR',
                arrivalDate: '2026-06-18',
                departureDate: '2026-06-22',
                nights: 4,
                sequence: 2
            }
        ];

        // Flights
        const flights: PackageFlight[] = [
            {
                id: 'flight-1',
                type: 'outbound',
                origin: 'BEG',
                destination: 'MXP',
                departureDate: '2026-06-15',
                departureTime: '10:00',
                arrivalDate: '2026-06-15',
                arrivalTime: '12:30',
                flightNumber: 'JU500',
                airline: 'JU',
                airlineName: 'Air Serbia',
                duration: 150,
                stops: 0,
                price: 180,
                currency: 'EUR'
            },
            {
                id: 'flight-2',
                type: 'internal',
                origin: 'MXP',
                destination: 'CDG',
                departureDate: '2026-06-18',
                departureTime: '14:00',
                arrivalDate: '2026-06-18',
                arrivalTime: '16:00',
                flightNumber: 'AF1234',
                airline: 'AF',
                airlineName: 'Air France',
                duration: 120,
                stops: 0,
                price: 150,
                currency: 'EUR'
            },
            {
                id: 'flight-3',
                type: 'return',
                origin: 'CDG',
                destination: 'BEG',
                departureDate: '2026-06-22',
                departureTime: '18:00',
                arrivalDate: '2026-06-22',
                arrivalTime: '21:30',
                flightNumber: 'JU501',
                airline: 'JU',
                airlineName: 'Air Serbia',
                duration: 210,
                stops: 0,
                price: 190,
                currency: 'EUR'
            }
        ];

        // Hotels
        const hotels: PackageHotel[] = [
            {
                id: 'hotel-1',
                destinationId: 'dest-1',
                destination: 'Milan',
                hotelName: 'Hotel Principe di Savoia',
                hotelCode: 'MXP001',
                stars: 4,
                checkIn: '2026-06-15',
                checkOut: '2026-06-18',
                nights: 3,
                roomType: 'Double Room',
                mealPlan: 'BB',
                mealPlanName: 'Bed & Breakfast',
                price: 450,
                currency: 'EUR'
            },
            {
                id: 'hotel-2',
                destinationId: 'dest-2',
                destination: 'Paris',
                hotelName: 'Hotel Le Marais',
                hotelCode: 'CDG002',
                stars: 4,
                checkIn: '2026-06-18',
                checkOut: '2026-06-22',
                nights: 4,
                roomType: 'Superior Double',
                mealPlan: 'HB',
                mealPlanName: 'Half Board',
                price: 680,
                currency: 'EUR'
            }
        ];

        // Transfers
        const transfers: PackageTransfer[] = [
            {
                id: 'transfer-1',
                type: 'airport_to_hotel',
                from: 'Milan Malpensa Airport',
                to: 'Hotel Principe di Savoia',
                date: '2026-06-15',
                time: '13:00',
                vehicleType: 'private',
                vehicleName: 'Private Car',
                passengers: 2,
                price: 45,
                currency: 'EUR',
                duration: 45
            },
            {
                id: 'transfer-2',
                type: 'hotel_to_airport',
                from: 'Hotel Principe di Savoia',
                to: 'Milan Malpensa Airport',
                date: '2026-06-18',
                time: '12:00',
                vehicleType: 'private',
                vehicleName: 'Private Car',
                passengers: 2,
                price: 45,
                currency: 'EUR',
                duration: 45
            },
            {
                id: 'transfer-3',
                type: 'airport_to_hotel',
                from: 'Paris Charles de Gaulle Airport',
                to: 'Hotel Le Marais',
                date: '2026-06-18',
                time: '16:30',
                vehicleType: 'private',
                vehicleName: 'Private Car',
                passengers: 2,
                price: 55,
                currency: 'EUR',
                duration: 50
            },
            {
                id: 'transfer-4',
                type: 'hotel_to_airport',
                from: 'Hotel Le Marais',
                to: 'Paris Charles de Gaulle Airport',
                date: '2026-06-22',
                time: '16:00',
                vehicleType: 'private',
                vehicleName: 'Private Car',
                passengers: 2,
                price: 55,
                currency: 'EUR',
                duration: 50
            }
        ];

        // Extras
        const extras: PackageExtra[] = [
            {
                id: 'extra-selected-1',
                type: 'tour',
                name: 'Milan City Walking Tour',
                description: 'Tura po centru Milana sa lokalnim vodičem',
                destinationId: 'dest-1',
                destination: 'Milan',
                date: '2026-06-16',
                time: '10:00',
                duration: 180,
                price: 45,
                currency: 'EUR',
                quantity: 2,
                totalPrice: 90
            },
            {
                id: 'extra-selected-2',
                type: 'ticket',
                name: 'Disneyland Paris - 1 Day',
                description: '1-dnevna ulaznica za Disneyland Paris',
                destinationId: 'dest-2',
                destination: 'Paris',
                date: '2026-06-19',
                time: '09:00',
                duration: 480,
                price: 89,
                currency: 'EUR',
                quantity: 2,
                totalPrice: 178
            },
            {
                id: 'extra-selected-3',
                type: 'ticket',
                name: 'Eiffel Tower Summit',
                description: 'Ulaznica za vrh Eiffel Tower-a',
                destinationId: 'dest-2',
                destination: 'Paris',
                date: '2026-06-20',
                time: '15:00',
                duration: 120,
                price: 35,
                currency: 'EUR',
                quantity: 2,
                totalPrice: 70
            }
        ];

        // Generate itinerary
        const itinerary = this.generateItinerary(destinations, flights, hotels, transfers, extras);

        // Calculate pricing
        const pricing = this.calculatePricing(flights, hotels, transfers, extras, 2);

        const package_: DynamicPackage = {
            id: 'pkg-sample-001',
            name: 'Milano & Paris Adventure',
            description: 'Nezaboravno putovanje kroz Milano i Pariz sa posetom Disneylandu',
            destinations,
            flights,
            hotels,
            transfers,
            extras,
            itinerary,
            pricing,
            duration: 8,
            travelers: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft'
        };

        return package_;
    }

    /**
     * Generate day-by-day itinerary
     */
    private generateItinerary(
        destinations: PackageDestination[],
        flights: PackageFlight[],
        hotels: PackageHotel[],
        transfers: PackageTransfer[],
        extras: PackageExtra[]
    ): DayByDayItinerary[] {
        const itinerary: DayByDayItinerary[] = [];
        const startDate = new Date('2026-06-15');

        for (let day = 1; day <= 8; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day - 1);

            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.toLocaleDateString('sr-RS', { weekday: 'long' });

            const activities: ItineraryActivity[] = [];

            // Add flights for this day
            flights.filter(f => f.departureDate === dateStr).forEach(flight => {
                activities.push({
                    id: `activity-flight-${flight.id}`,
                    time: flight.departureTime,
                    type: 'flight',
                    icon: '🛫',
                    title: `Let ${flight.flightNumber} ${flight.origin}-${flight.destination}`,
                    description: `${flight.airlineName} • ${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m`,
                    componentId: flight.id,
                    details: flight
                });
            });

            // Add transfers for this day
            transfers.filter(t => t.date === dateStr).forEach(transfer => {
                activities.push({
                    id: `activity-transfer-${transfer.id}`,
                    time: transfer.time,
                    type: 'transfer',
                    icon: '🚗',
                    title: `Transfer: ${transfer.from} → ${transfer.to}`,
                    description: `${transfer.vehicleName} • ${transfer.duration}min`,
                    componentId: transfer.id,
                    details: transfer
                });
            });

            // Add hotel check-in/out
            hotels.forEach(hotel => {
                if (hotel.checkIn === dateStr) {
                    activities.push({
                        id: `activity-checkin-${hotel.id}`,
                        time: '14:00',
                        type: 'hotel',
                        icon: '🏨',
                        title: `Check-in: ${hotel.hotelName}`,
                        description: `${hotel.stars}⭐ • ${hotel.mealPlanName}`,
                        componentId: hotel.id,
                        details: hotel
                    });
                }
                if (hotel.checkOut === dateStr) {
                    activities.push({
                        id: `activity-checkout-${hotel.id}`,
                        time: '11:00',
                        type: 'hotel',
                        icon: '🏨',
                        title: `Check-out: ${hotel.hotelName}`,
                        description: `Kraj boravka`,
                        componentId: hotel.id,
                        details: hotel
                    });
                }
            });

            // Add extras for this day
            extras.filter(e => e.date === dateStr).forEach(extra => {
                activities.push({
                    id: `activity-extra-${extra.id}`,
                    time: extra.time || '10:00',
                    type: 'extra',
                    icon: extra.type === 'ticket' ? '🎫' : extra.type === 'tour' ? '🚶' : '🍽',
                    title: extra.name,
                    description: extra.description,
                    duration: extra.duration ? `${Math.floor(extra.duration / 60)}h ${extra.duration % 60}m` : undefined,
                    componentId: extra.id,
                    details: extra
                });
            });

            // Sort activities by time
            activities.sort((a, b) => a.time.localeCompare(b.time));

            // Determine destination for this day
            let destination = 'Belgrade';
            for (const dest of destinations) {
                const arrival = new Date(dest.arrivalDate);
                const departure = new Date(dest.departureDate);
                if (currentDate >= arrival && currentDate < departure) {
                    destination = dest.city;
                    break;
                }
            }

            itinerary.push({
                day,
                date: dateStr,
                dayOfWeek,
                destination,
                activities
            });
        }

        return itinerary;
    }

    /**
     * Calculate package pricing
     */
    private calculatePricing(
        flights: PackageFlight[],
        hotels: PackageHotel[],
        transfers: PackageTransfer[],
        extras: PackageExtra[],
        travelers: number
    ): PackagePricing {
        const flightsTotal = flights.reduce((sum, f) => sum + f.price, 0) * travelers;
        const hotelsTotal = hotels.reduce((sum, h) => sum + h.price, 0);
        const transfersTotal = transfers.reduce((sum, t) => sum + t.price, 0);
        const extrasTotal = extras.reduce((sum, e) => sum + e.totalPrice, 0);

        const subtotal = flightsTotal + hotelsTotal + transfersTotal + extrasTotal;
        const taxes = subtotal * 0.1; // 10% tax
        const total = subtotal + taxes;

        return {
            flights: flightsTotal,
            hotels: hotelsTotal,
            transfers: transfersTotal,
            extras: extrasTotal,
            subtotal,
            taxes,
            total,
            currency: 'EUR',
            perPerson: total / travelers,
            breakdown: [
                { category: 'Letovi', name: 'Svi letovi', quantity: flights.length, unitPrice: flightsTotal / flights.length, totalPrice: flightsTotal },
                { category: 'Hoteli', name: 'Svi hoteli', quantity: hotels.length, unitPrice: hotelsTotal / hotels.length, totalPrice: hotelsTotal },
                { category: 'Transferi', name: 'Svi transferi', quantity: transfers.length, unitPrice: transfersTotal / transfers.length, totalPrice: transfersTotal },
                { category: 'Dodatno', name: 'Sve usluge', quantity: extras.length, unitPrice: extrasTotal / extras.length, totalPrice: extrasTotal }
            ]
        };
    }

    /**
     * Get extras catalog
     */
    getExtrasCatalog(): ExtrasCatalogItem[] {
        return mockExtrasCatalog;
    }

    /**
     * Get extras by destination
     */
    getExtrasByDestination(destination: string): ExtrasCatalogItem[] {
        return mockExtrasCatalog.filter(e =>
            e.destinations.includes(destination)
        );
    }
}

export const packageMockService = new PackageMockService();
