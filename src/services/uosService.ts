/**
 * UOS (Udruženje Osiguravača Srbije) Service
 * Implements integration with the Portal for Travel Agencies API.
 * 
 * Based on documentation and .NET demo provided in the "Osiguranje api" folder.
 */

const UOS_API_BASE_URL = import.meta.env.VITE_UOS_API_URL || 'https://testapi.udruzenje-osiguravaca-srbije.com/api/';

export interface UOSCredentials {
  username: string;
  password: string;
}

export interface UOSCountry {
  Id: number;
  Name: string;
  Code: string;
}

export interface UOSCurrency {
  Id: number;
  Name: string;
  Code: string;
}

export interface UOSPassenger {
  Id?: number;
  Name: string; // Combined FirstName LastName for UOS DTO
  IdentificationNumber: string; // JMBG
  DateOfBirth?: string; // ISO Date (if supported in extended DTO, official DTO shows Name/ID only)
}

export interface UOSTravelRoutePoint {
  Id?: number;
  FromDate: string;
  ToDate: string;
  Place: string;
  CountryId: number;
}

export interface UOSPolicy {
  Id: number;
  Number: string;
  ProductAndTariff?: string;
  SumInsured_EUR: number;
  InsuranceStartDate: string;
  InsuranceEndDate: string;
  InsuranceCompanyId: number;
  TravelAgencyId: number;
}

export interface UOSTravelContract {
  Id: number;
  Number: string; // Contract number defined by travel agency
  ContractDate: string;
  ContractorName: string;
  ContractorIdentificationNumber: string;
  ContractorDateOfBirth: string;
  ContractorEmailAddress: string;
  TravelStartDate: string;
  TravelEndDate: string;
  DeparturePlace: string;
  DestinationPlace: string;
  TravelContractValueInCurrency: number;
  TravelContractValueCurrencyId: number;
  NumberOfPassengers: number;
  PolicyId: number;
  InsuranceCompanyId: number;
  TravelAgencyId: number;
  DepartureCountryId: number;
  DestinationCountryId: number;
  ContractStatusId?: number;
  Passengers: UOSPassenger[];
  TravelRoutePoints?: UOSTravelRoutePoint[];
}

class UOSService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  /**
   * Generates a Bearer token using credentials
   */
  async login(credentials: UOSCredentials): Promise<string> {
    try {
      const response = await fetch(`${UOS_API_BASE_URL}CreateToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`UOS Login failed: ${response.statusText}`);
      }

      const token = await response.text();
      this.token = token.replace(/"/g, '');
      // Tokens usually last for a few hours. We could parse JWT to be precise.
      this.tokenExpiry = Date.now() + 3600 * 1000; 
      
      return this.token;
    } catch (error) {
      console.error('UOS Service Error (Login):', error);
      throw error;
    }
  }

  /**
   * Check if token is still valid
   */
  private isTokenValid(): boolean {
    return !!this.token && !!this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  /**
   * Generic request wrapper with auto-login or token handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('UOS Service: Not authenticated. Call login() first.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    const response = await fetch(`${UOS_API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.token = null;
      throw new Error('UOS Service: Unauthorized. Token might have expired.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`UOS API Error [${endpoint}]: ${response.statusText} - ${errorText}`);
    }

    if (response.status === 204) return {} as T;

    return await response.json();
  }

  // ============ CODEBOOKS ============

  async getCountries(): Promise<UOSCountry[]> {
    return this.request<UOSCountry[]>('GetCountries');
  }

  async getCurrencies(): Promise<UOSCurrency[]> {
    return this.request<UOSCurrency[]>('GetCurrencies');
  }

  // ============ POLICIES ============

  async getPolicies(filter: any = {}): Promise<UOSPolicy[]> {
    return this.request<UOSPolicy[]>('GetPolicies', {
      method: 'POST',
      body: JSON.stringify(filter),
    });
  }

  // ============ TRAVEL CONTRACTS ============

  /**
   * Saves a travel contract and potentially issues an insurance policy
   */
  async saveTravelContract(contract: Partial<UOSTravelContract>): Promise<UOSTravelContract> {
    return this.request<UOSTravelContract>('SaveTravelContract', {
      method: 'POST',
      body: JSON.stringify(contract),
    });
  }

  /**
   * Get specific travel contract by ID
   */
  async getTravelContract(id: number): Promise<UOSTravelContract> {
    return this.request<UOSTravelContract>(`GetTravelContract/${id}`);
  }

  /**
   * Helper to map our application data to UOS structure
   */
  mapToUOSContract(appData: any): Partial<UOSTravelContract> {
    const today = new Date().toISOString().split('T')[0];
    
    // Default passenger if none provided
    const passengers: UOSPassenger[] = (appData.passengers || []).map((p: any) => ({
        Name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Putnik',
        IdentificationNumber: p.jmbg || ''
    }));

    if (passengers.length === 0) {
        passengers.push({ Name: 'Glavni Putnik', IdentificationNumber: '' });
    }

    return {
      Number: `TC-${Date.now()}`,
      ContractDate: today,
      ContractorName: `${appData.customer?.firstName || ''} ${appData.customer?.lastName || ''}`.trim() || 'Klijent',
      ContractorEmailAddress: appData.customer?.email || '',
      ContractorIdentificationNumber: appData.customer?.jmbg || '',
      ContractorDateOfBirth: appData.customer?.dateOfBirth || '1990-01-01',
      
      TravelStartDate: appData.departureDate || today,
      TravelEndDate: appData.returnDate || today,
      
      DeparturePlace: appData.departurePlace || 'Beograd',
      DestinationPlace: appData.destinationPlace || 'Inostranstvo',
      
      TravelContractValueInCurrency: appData.totalPrice || 0,
      TravelContractValueCurrencyId: appData.currencyId || 1, // Default to EUR or RSD based on codebook
      
      NumberOfPassengers: passengers.length,
      Passengers: passengers,
      
      // Default IDs/Placeholders
      TravelAgencyId: 16, 
      InsuranceCompanyId: 3,
      DepartureCountryId: 181, // Srbija
      DestinationCountryId: appData.destinationCountryId || 82, // Grčka (dummy)
      
      TravelRoutePoints: [
        {
            FromDate: appData.departureDate || today,
            ToDate: appData.returnDate || today,
            Place: appData.destinationPlace || 'Inostranstvo',
            CountryId: appData.destinationCountryId || 82
        }
      ]
    };
  }
}

export const uosService = new UOSService();
export default uosService;
