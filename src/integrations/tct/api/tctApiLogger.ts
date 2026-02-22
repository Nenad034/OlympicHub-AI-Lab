/**
 * TCT API Logger
 * Detaljno loguje sve API pozive - request, response, timing, errors
 */

export interface LogEntry {
    timestamp: string;
    endpoint: string;
    method: string;
    request: {
        url: string;
        headers: Record<string, string>;
        body?: any;
    };
    response?: {
        status: number;
        statusText: string;
        data: any;
        headers: Record<string, string>;
    };
    error?: string;
    duration: number;
}

class TCTApiLogger {
    private logs: LogEntry[] = [];
    private enabled: boolean = true;
    private maxLogs: number = 100;

    /**
     * Omogući/onemogući logging
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        console.log(`📝 TCT API Logging ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    /**
     * Loguj API poziv
     */
    logRequest(endpoint: string, url: string, options: RequestInit = {}): Partial<LogEntry> {
        if (!this.enabled) {
            return {
                timestamp: new Date().toISOString(),
                endpoint,
                method: options.method || 'GET',
            };
        }

        const entry: Partial<LogEntry> = {
            timestamp: new Date().toISOString(),
            endpoint,
            method: options.method || 'GET',
            request: {
                url,
                headers: this.extractHeaders(options.headers),
                body: this.parseBody(options.body),
            },
        };

        console.group(`📤 API Request: ${endpoint}`);
        console.log('🕐 Time:', entry.timestamp);
        console.log('🔗 URL:', url);
        console.log('📋 Method:', entry.method);
        console.log('📦 Headers:', entry.request?.headers);
        if (entry.request?.body) {
            console.log('📄 Body:', entry.request.body);
        }
        console.groupEnd();

        return entry;
    }

    /**
     * Loguj API odgovor
     */
    logResponse(
        entry: Partial<LogEntry>,
        response: Response,
        data: any,
        duration: number
    ) {
        if (!this.enabled) return;

        const completeEntry: LogEntry = {
            ...entry,
            response: {
                status: response.status,
                statusText: response.statusText,
                data,
                headers: this.extractResponseHeaders(response.headers),
            },
            duration,
        } as LogEntry;

        this.addLog(completeEntry);

        const statusIcon = response.ok ? '✅' : '❌';
        console.group(`📥 API Response: ${entry.endpoint} ${statusIcon}`);
        console.log('⏱️ Duration:', `${duration}ms`);
        console.log('📊 Status:', `${response.status} ${response.statusText}`);
        console.log('📦 Headers:', completeEntry.response?.headers);
        console.log('📄 Data:', data);
        console.groupEnd();
    }

    /**
     * Loguj grešku
     */
    logError(entry: Partial<LogEntry>, error: Error, duration: number) {
        if (!this.enabled) return;

        const completeEntry: LogEntry = {
            ...entry,
            error: error.message,
            duration,
        } as LogEntry;

        this.addLog(completeEntry);

        console.group(`❌ API Error: ${entry.endpoint}`);
        console.log('⏱️ Duration:', `${duration}ms`);
        console.error('🚨 Error:', error.message);
        console.error('📚 Stack:', error.stack);
        console.groupEnd();
    }

    /**
     * Dodaj log u istoriju
     */
    private addLog(entry: LogEntry) {
        this.logs.push(entry);

        // Održavaj max broj logova
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    /**
     * Izvuci headers iz RequestInit
     */
    private extractHeaders(headers?: HeadersInit): Record<string, string> {
        if (!headers) return {};

        if (headers instanceof Headers) {
            const result: Record<string, string> = {};
            headers.forEach((value, key) => {
                result[key] = value;
            });
            return result;
        }

        return headers as Record<string, string>;
    }

    /**
     * Izvuci headers iz Response
     */
    private extractResponseHeaders(headers: Headers): Record<string, string> {
        const result: Record<string, string> = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    /**
     * Parse body iz RequestInit
     */
    private parseBody(body?: BodyInit | null): any {
        if (!body) return undefined;

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
     * Dobavi sve logove
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Dobavi logove za određeni endpoint
     */
    getLogsByEndpoint(endpoint: string): LogEntry[] {
        return this.logs.filter(log => log.endpoint === endpoint);
    }

    /**
     * Dobavi neuspele pozive
     */
    getFailedLogs(): LogEntry[] {
        return this.logs.filter(log => log.error || (log.response && !log.response.status.toString().startsWith('2')));
    }

    /**
     * Očisti logove
     */
    clearLogs() {
        this.logs = [];
        console.log('🗑️ TCT API Logs cleared');
    }

    /**
     * Export logova u JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Prikaži statistiku
     */
    printStats() {
        const total = this.logs.length;
        const successful = this.logs.filter(log =>
            log.response && log.response.status >= 200 && log.response.status < 300
        ).length;
        const failed = total - successful;
        const avgDuration = total > 0
            ? this.logs.reduce((sum, log) => sum + log.duration, 0) / total
            : 0;

        console.log('\n' + '='.repeat(60));
        console.log('📊 TCT API LOGGING STATISTICS');
        console.log('='.repeat(60));
        console.log(`Total Requests: ${total}`);
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️ Average Duration: ${avgDuration.toFixed(2)}ms`);
        console.log('='.repeat(60) + '\n');

        // Prikaži top 5 najsporijih poziva
        const slowest = [...this.logs]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);

        if (slowest.length > 0) {
            console.log('🐌 Top 5 Slowest Requests:');
            slowest.forEach((log, index) => {
                console.log(`${index + 1}. ${log.endpoint} - ${log.duration}ms`);
            });
            console.log('');
        }
    }

    /**
     * Loguj generički event (za AI Monitor i druge sisteme)
     */
    logEvent(event: any) {
        if (!this.enabled) {
            return;
        }

        console.log('📝 Event:', event);

        // Dodaj u logs ako ima potrebna polja
        if (event.type && event.timestamp) {
            // Konvertuj event u LogEntry format ako je moguće
            const logEntry: Partial<LogEntry> = {
                timestamp: event.timestamp,
                endpoint: event.endpoint || event.type,
                method: 'EVENT',
                request: {
                    url: event.endpoint || '',
                    headers: {},
                    body: event
                },
                duration: 0
            };

            this.logs.push(logEntry as LogEntry);

            // Drži samo poslednjih maxLogs
            if (this.logs.length > this.maxLogs) {
                this.logs.shift();
            }
        }
    }

    /**
     * Ispisuje sve logove u konzolu
     */
    printLogs() {
        console.log('📋 All API Logs:');
        console.table(this.logs);
    }
}

// Export singleton instance
export const tctApiLogger = new TCTApiLogger();

// Export helper function za wrapping fetch poziva
export async function loggedFetch(
    endpoint: string,
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const startTime = Date.now();
    const logEntry = tctApiLogger.logRequest(endpoint, url, options);

    try {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => null);
        const duration = Date.now() - startTime;

        tctApiLogger.logResponse(logEntry, response, data, duration);

        return response;
    } catch (error) {
        const duration = Date.now() - startTime;
        tctApiLogger.logError(logEntry, error as Error, duration);
        throw error;
    }
}
