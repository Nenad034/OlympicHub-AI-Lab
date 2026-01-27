/**
 * API Helper Functions
 * Timeout, Retry, Error Handling
 */

export interface FetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Fetch sa timeout-om
 */
export const fetchWithTimeout = async (
    url: string,
    options: FetchOptions = {}
): Promise<Response> => {
    const { timeout = 5000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }

        throw error;
    }
};

/**
 * Fetch sa retry logikom
 * Integrisano sa AI Monitor-om
 */
export const fetchWithRetry = async (
    url: string,
    options: FetchOptions = {}
): Promise<Response> => {
    const {
        retries = 3,
        retryDelay = 1000,
        onRetry,
        ...fetchOptions
    } = options;

    let lastError: Error;
    let currentDelay = retryDelay;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, fetchOptions);

            // Retry samo na server greške (5xx)
            if (response.status >= 500 && response.status < 600) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            // Uspešan zahtev
            return response;

        } catch (error: any) {
            lastError = error;

            // 🤖 AI Monitor Integration: Prijavi grešku
            try {
                const { aiMonitor } = await import('../services/aiMonitor');
                const statusCode = error.message.match(/\d{3}/)?.[0];
                aiMonitor.handleError(url, statusCode ? parseInt(statusCode) : 0, error);
            } catch (monitorError) {
                // Ignoriši greške u monitoru da ne blokiramo glavni flow
                console.warn('AI Monitor error:', monitorError);
            }

            // Ako je poslednji pokušaj, baci grešku
            if (attempt === retries) {
                break;
            }

            // Loguj retry
            console.warn(
                `🔄 Retry attempt ${attempt + 1}/${retries} for ${url}`,
                `Reason: ${error.message}`,
                `Waiting ${currentDelay}ms...`
            );

            // Callback za retry
            if (onRetry) {
                onRetry(attempt + 1, error);
            }

            // Čekaj pre sledećeg pokušaja
            await new Promise(resolve => setTimeout(resolve, currentDelay));

            // Exponential backoff (1s, 2s, 4s, 8s)
            currentDelay *= 2;
        }
    }

    throw lastError!;
};

/**
 * Fetch sa timeout-om i retry-em (kombinovano)
 */
export const fetchWithTimeoutAndRetry = async (
    url: string,
    options: FetchOptions = {}
): Promise<Response> => {
    return fetchWithRetry(url, {
        timeout: 5000,
        retries: 3,
        retryDelay: 1000,
        ...options
    });
};

/**
 * API Error klasa
 */
export class APIError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: any,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'APIError';
    }
}

/**
 * Parse API response sa error handling-om
 */
export const parseAPIResponse = async <T>(response: Response): Promise<T> => {
    const contentType = response.headers.get('content-type');

    // JSON response
    if (contentType?.includes('application/json')) {
        const data = await response.json();

        if (!response.ok) {
            throw new APIError(
                data.error || data.message || `HTTP ${response.status}`,
                response.status,
                data
            );
        }

        return data;
    }

    // Text response
    if (contentType?.includes('text/')) {
        const text = await response.text();

        if (!response.ok) {
            throw new APIError(
                text || `HTTP ${response.status}`,
                response.status,
                text
            );
        }

        return text as any;
    }

    // Nepoznat format
    if (!response.ok) {
        throw new APIError(
            `HTTP ${response.status} ${response.statusText}`,
            response.status
        );
    }

    return response as any;
};

/**
 * Kompletna API funkcija sa svim feature-ima
 */
export const apiRequest = async <T>(
    url: string,
    options: FetchOptions = {}
): Promise<T> => {
    try {
        const response = await fetchWithTimeoutAndRetry(url, options);
        return await parseAPIResponse<T>(response);
    } catch (error: any) {
        // Loguj grešku
        console.error('❌ API Request Failed:', {
            url,
            error: error.message,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString()
        });

        // Re-throw sa dodatnim kontekstom
        if (error instanceof APIError) {
            throw error;
        }

        throw new APIError(
            error.message || 'Unknown error',
            undefined,
            undefined,
            error
        );
    }
};

/**
 * GET request helper
 */
export const get = <T>(url: string, options: FetchOptions = {}): Promise<T> => {
    return apiRequest<T>(url, {
        ...options,
        method: 'GET'
    });
};

/**
 * POST request helper
 */
export const post = <T>(
    url: string,
    body: any,
    options: FetchOptions = {}
): Promise<T> => {
    return apiRequest<T>(url, {
        ...options,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(body)
    });
};

/**
 * PUT request helper
 */
export const put = <T>(
    url: string,
    body: any,
    options: FetchOptions = {}
): Promise<T> => {
    return apiRequest<T>(url, {
        ...options,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(body)
    });
};

/**
 * PATCH request helper
 */
export const patch = <T>(
    url: string,
    body: any,
    options: FetchOptions = {}
): Promise<T> => {
    return apiRequest<T>(url, {
        ...options,
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(body)
    });
};

/**
 * DELETE request helper
 */
export const del = <T>(url: string, options: FetchOptions = {}): Promise<T> => {
    return apiRequest<T>(url, {
        ...options,
        method: 'DELETE'
    });
};

/**
 * Batch requests sa concurrency control
 */
export const batchRequests = async <T>(
    requests: (() => Promise<T>)[],
    concurrency: number = 5
): Promise<T[]> => {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const request of requests) {
        const promise = request().then(result => {
            results.push(result);
        });

        executing.push(promise);

        if (executing.length >= concurrency) {
            await Promise.race(executing);
            executing.splice(executing.findIndex(p => p === promise), 1);
        }
    }

    await Promise.all(executing);
    return results;
};

/**
 * Circuit Breaker Pattern
 */
export class CircuitBreaker {
    private failureCount = 0;
    private successCount = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private nextAttempt = Date.now();

    constructor(
        private threshold: number = 5,
        private timeout: number = 60000,
        private resetTimeout: number = 30000
    ) { }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }

            this.state = 'HALF_OPEN';
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failureCount = 0;

        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            console.log('✅ Circuit breaker CLOSED');
        }
    }

    private onFailure() {
        this.failureCount++;

        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
            console.error(`🔴 Circuit breaker OPEN (${this.failureCount} failures)`);
        }
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt) : null
        };
    }

    reset() {
        this.failureCount = 0;
        this.state = 'CLOSED';
        console.log('🔄 Circuit breaker RESET');
    }
}

// Export singleton circuit breaker
export const apiCircuitBreaker = new CircuitBreaker(5, 60000);
