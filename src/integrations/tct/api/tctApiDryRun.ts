/**
 * TCT API Dry Run Mode
 * Prikazuje šta bi se poslalo bez stvarnog slanja zahteva
 */

export interface DryRunResult {
    endpoint: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    wouldSend: boolean;
    timestamp: string;
}

class TCTApiDryRun {
    private enabled: boolean = false;
    private results: DryRunResult[] = [];

    /**
     * Omogući/onemogući dry run mode
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (enabled) {
            console.log('🔍 DRY RUN MODE ENABLED - No actual API calls will be made');
            console.log('📋 All requests will be logged but not sent');
        } else {
            console.log('✅ DRY RUN MODE DISABLED - Normal API calls resumed');
        }
    }

    /**
     * Proveri da li je dry run omogućen
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Loguj šta bi se poslalo
     */
    logWouldSend(
        endpoint: string,
        method: string,
        url: string,
        headers: Record<string, string>,
        body?: any
    ): DryRunResult {
        const result: DryRunResult = {
            endpoint,
            method,
            url,
            headers: this.sanitizeHeaders(headers),
            body: body ? this.parseBody(body) : undefined,
            wouldSend: true,
            timestamp: new Date().toISOString(),
        };

        this.results.push(result);

        console.group(`🔍 DRY RUN: ${endpoint}`);
        console.log('⚠️ THIS REQUEST WOULD BE SENT (but is not being sent)');
        console.log('🕐 Timestamp:', result.timestamp);
        console.log('📋 Method:', method);
        console.log('🔗 URL:', url);
        console.log('📦 Headers:', result.headers);
        if (result.body) {
            console.log('📄 Body:', result.body);
        }
        console.log('');
        console.log('💡 To actually send this request, disable Dry Run mode:');
        console.log('   tctDryRun.setEnabled(false)');
        console.groupEnd();

        return result;
    }

    /**
     * Sanitizuj headers (sakrij osetljive podatke)
     */
    private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
        const sanitized = { ...headers };

        // Sakrij Authorization header
        if (sanitized['Authorization']) {
            sanitized['Authorization'] = '***HIDDEN***';
        }

        return sanitized;
    }

    /**
     * Parse body
     */
    private parseBody(body: any): any {
        if (typeof body === 'string') {
            try {
                return JSON.parse(body);
            } catch {
                return body;
            }
        }
        return body;
    }

    /**
     * Dobavi sve dry run rezultate
     */
    getResults(): DryRunResult[] {
        return [...this.results];
    }

    /**
     * Očisti rezultate
     */
    clearResults() {
        this.results = [];
        console.log('🗑️ Dry Run results cleared');
    }

    /**
     * Prikaži summary
     */
    printSummary() {
        const total = this.results.length;

        console.log('\n' + '='.repeat(60));
        console.log('🔍 DRY RUN SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Requests Intercepted: ${total}`);
        console.log('');

        if (total > 0) {
            console.log('📋 Requests that would have been sent:');
            this.results.forEach((result, index) => {
                console.log(`${index + 1}. [${result.method}] ${result.endpoint}`);
                console.log(`   URL: ${result.url}`);
                if (result.body) {
                    console.log(`   Body:`, result.body);
                }
            });
        } else {
            console.log('No requests intercepted yet.');
        }

        console.log('='.repeat(60) + '\n');
    }

    /**
     * Export rezultata u JSON
     */
    exportResults(): string {
        return JSON.stringify(this.results, null, 2);
    }

    /**
     * Generiši mock response za dry run
     */
    generateMockResponse(endpoint: string): any {
        return {
            success: true,
            data: {
                message: `DRY RUN: This is a mock response for ${endpoint}`,
                timestamp: new Date().toISOString(),
                note: 'No actual API call was made',
            },
            error: null,
        };
    }
}

// Export singleton instance
export const tctDryRun = new TCTApiDryRun();

// Export helper function za dry run wrapper
export async function dryRunFetch(
    endpoint: string,
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    if (tctDryRun.isEnabled()) {
        // Loguj šta bi se poslalo
        const headers: Record<string, string> = {};
        if (options.headers) {
            if (options.headers instanceof Headers) {
                options.headers.forEach((value, key) => {
                    headers[key] = value;
                });
            } else {
                Object.assign(headers, options.headers);
            }
        }

        tctDryRun.logWouldSend(
            endpoint,
            options.method || 'GET',
            url,
            headers,
            options.body
        );

        // Vrati mock response
        const mockResponse = tctDryRun.generateMockResponse(endpoint);
        return new Response(JSON.stringify(mockResponse), {
            status: 200,
            statusText: 'OK (DRY RUN)',
            headers: {
                'Content-Type': 'application/json',
                'X-Dry-Run': 'true',
            },
        });
    }

    // Ako dry run nije omogućen, pošalji pravi zahtev
    return fetch(url, options);
}
