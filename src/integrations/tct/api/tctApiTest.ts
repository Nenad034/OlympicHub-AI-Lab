/**
 * TCT API Automated Test Suite
 * Automatski testira sve endpointe i prikazuje detaljne rezultate
 */

import { tctApi } from './tctApi';

export interface TestResult {
    endpoint: string;
    status: 'success' | 'error' | 'pending';
    duration: number;
    request?: any;
    response?: any;
    error?: string;
}

export class TCTApiTester {
    private results: TestResult[] = [];
    private startTime: number = 0;

    /**
     * Pokreće sve testove i vraća rezultate
     */
    async runAllTests(): Promise<TestResult[]> {
        console.log('🧪 Starting TCT API Test Suite...');
        this.results = [];
        this.startTime = Date.now();

        // Test 1: Connection
        await this.testConnection();

        // Test 2: Static Data
        await this.testNationalities();
        await this.testGeography();
        await this.testAirports();
        await this.testHotelCategories();
        await this.testMealPlans();

        // Test 3: Hotel Information
        await this.testHotelInformation();

        // Test 4: Hotel Search (Sync)
        await this.testHotelSearchSync();

        // Test 5: Package Departures
        await this.testPackageDepartures();

        const totalDuration = Date.now() - this.startTime;
        console.log(`✅ Test Suite Completed in ${totalDuration}ms`);

        return this.results;
    }

    /**
     * Helper funkcija za izvršavanje testa
     */
    private async executeTest(
        endpoint: string,
        testFn: () => Promise<any>,
        requestData?: any
    ): Promise<void> {
        const startTime = Date.now();

        try {
            console.log(`🔍 Testing: ${endpoint}...`);
            const response = await testFn();
            const duration = Date.now() - startTime;

            this.results.push({
                endpoint,
                status: response.success ? 'success' : 'error',
                duration,
                request: requestData,
                response: response.data,
                error: response.error || undefined,
            });

            if (response.success) {
                console.log(`✅ ${endpoint} - OK (${duration}ms)`);
            } else {
                console.error(`❌ ${endpoint} - FAILED: ${response.error}`);
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.results.push({
                endpoint,
                status: 'error',
                duration,
                request: requestData,
                error: errorMessage,
            });

            console.error(`❌ ${endpoint} - ERROR: ${errorMessage}`);
        }
    }

    // ============ Individual Tests ============

    private async testConnection() {
        await this.executeTest('Connection Test', () => tctApi.testConnection());
    }

    private async testNationalities() {
        await this.executeTest('Get Nationalities', () => tctApi.getNationalities());
    }

    private async testGeography() {
        await this.executeTest('Get Geography', () => tctApi.getGeography());
    }

    private async testAirports() {
        await this.executeTest('Get Airports', () => tctApi.getAirports());
    }

    private async testHotelCategories() {
        await this.executeTest('Get Hotel Categories', () => tctApi.getHotelCategories());
    }

    private async testMealPlans() {
        await this.executeTest('Get Meal Plans', () => tctApi.getHotelMealPlans());
    }

    private async testHotelInformation() {
        const params = {
            city: 'Hurghada',
            limit: 10,
            detail: 'basic' as const,
        };

        await this.executeTest(
            'Get Hotel Information',
            () => tctApi.getHotelInformation(params),
            params
        );
    }

    private async testHotelSearchSync() {
        const params = {
            search_type: 'city' as const,
            location: '647126', // Hurghada
            checkin: '2026-02-15',
            checkout: '2026-02-22',
            rooms: [{ adults: 2, children: 0 }],
            currency: 'EUR',
            nationality: '324667', // Serbia
            residence: '324667',
        };

        await this.executeTest(
            'Hotel Search (Sync)',
            () => tctApi.searchHotelsSync(params),
            params
        );
    }

    private async testPackageDepartures() {
        await this.executeTest(
            'Get Package Departures',
            () => tctApi.getPackageDepartures('all')
        );
    }

    /**
     * Vraća summary rezultata
     */
    getSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'success').length;
        const failed = this.results.filter(r => r.status === 'error').length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        return {
            total,
            passed,
            failed,
            successRate: total > 0 ? (passed / total) * 100 : 0,
            totalDuration,
            averageDuration: total > 0 ? totalDuration / total : 0,
        };
    }

    /**
     * Prikazuje detaljan izveštaj
     */
    printReport() {
        const summary = this.getSummary();

        console.log('\n' + '='.repeat(60));
        console.log('📊 TCT API TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${summary.total}`);
        console.log(`✅ Passed: ${summary.passed}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log(`Success Rate: ${summary.successRate.toFixed(2)}%`);
        console.log(`Total Duration: ${summary.totalDuration}ms`);
        console.log(`Average Duration: ${summary.averageDuration.toFixed(2)}ms`);
        console.log('='.repeat(60) + '\n');

        // Detalji za svaki test
        this.results.forEach((result, index) => {
            const icon = result.status === 'success' ? '✅' : '❌';
            console.log(`${index + 1}. ${icon} ${result.endpoint} (${result.duration}ms)`);

            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }

            if (result.request) {
                console.log(`   Request:`, result.request);
            }
        });
    }
}

// Export singleton instance
export const tctApiTester = new TCTApiTester();

// Export convenience function
export async function runTCTTests(): Promise<TestResult[]> {
    const results = await tctApiTester.runAllTests();
    tctApiTester.printReport();
    return results;
}
