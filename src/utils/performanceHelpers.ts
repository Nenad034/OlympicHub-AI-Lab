/**
 * Performance Utilities
 * Virtual Scrolling, Chunk Processing, Memory Management
 */

/**
 * Chunk Processing - Procesira velike nizove u chunk-ovima
 */
export const processInChunks = async <T, R>(
    items: T[],
    processor: (item: T) => R | Promise<R>,
    options: {
        chunkSize?: number;
        onProgress?: (processed: number, total: number) => void;
        delayBetweenChunks?: number;
    } = {}
): Promise<R[]> => {
    const {
        chunkSize = 100,
        onProgress,
        delayBetweenChunks = 0
    } = options;

    const results: R[] = [];
    const total = items.length;

    for (let i = 0; i < total; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);

        // Procesira chunk
        const chunkResults = await Promise.all(
            chunk.map(item => processor(item))
        );

        results.push(...chunkResults);

        // Progress callback
        if (onProgress) {
            onProgress(Math.min(i + chunkSize, total), total);
        }

        // Delay između chunk-ova da browser može da "diše"
        if (delayBetweenChunks > 0 && i + chunkSize < total) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
        }
    }

    return results;
};

/**
 * Debounce funkcija
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: any = null;

    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

/**
 * Throttle funkcija
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
};

/**
 * Memoization funkcija
 */
export const memoize = <T extends (...args: any[]) => any>(
    func: T
): T => {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = func(...args);
        cache.set(key, result);

        return result;
    }) as T;
};

/**
 * Lazy Load funkcija
 */
export const lazyLoad = async <T>(
    loader: () => Promise<T>,
    options: {
        delay?: number;
        onLoading?: () => void;
        onLoaded?: (data: T) => void;
        onError?: (error: Error) => void;
    } = {}
): Promise<T> => {
    const { delay = 0, onLoading, onLoaded, onError } = options;

    try {
        if (onLoading) {
            onLoading();
        }

        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        const data = await loader();

        if (onLoaded) {
            onLoaded(data);
        }

        return data;
    } catch (error) {
        if (onError) {
            onError(error as Error);
        }
        throw error;
    }
};

/**
 * Batch Loader - Učitava podatke u batch-ovima
 */
export class BatchLoader<T> {
    private queue: Array<{
        key: string;
        resolve: (value: T) => void;
        reject: (error: Error) => void;
    }> = [];

    private batchTimeout: any = null;

    constructor(
        private batchFn: (keys: string[]) => Promise<T[]>,
        private batchSize: number = 10,
        private batchDelay: number = 10
    ) { }

    load(key: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ key, resolve, reject });

            if (this.queue.length >= this.batchSize) {
                this.processBatch();
            } else if (!this.batchTimeout) {
                this.batchTimeout = setTimeout(() => {
                    this.processBatch();
                }, this.batchDelay);
            }
        });
    }

    private async processBatch() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        const batch = this.queue.splice(0, this.batchSize);

        if (batch.length === 0) {
            return;
        }

        try {
            const keys = batch.map(item => item.key);
            const results = await this.batchFn(keys);

            batch.forEach((item, index) => {
                item.resolve(results[index]);
            });
        } catch (error) {
            batch.forEach(item => {
                item.reject(error as Error);
            });
        }
    }
}

/**
 * Memory Monitor - Prati memory usage
 */
export class MemoryMonitor {
    private measurements: Array<{
        timestamp: number;
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    }> = [];

    measure() {
        if ('memory' in performance) {
            const memory = (performance as any).memory;

            this.measurements.push({
                timestamp: Date.now(),
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            });

            // Drži samo poslednja 100 merenja
            if (this.measurements.length > 100) {
                this.measurements.shift();
            }
        }
    }

    getStats() {
        if (this.measurements.length === 0) {
            return null;
        }

        const latest = this.measurements[this.measurements.length - 1];

        return {
            usedMB: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2),
            totalMB: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2),
            limitMB: (latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
            usagePercent: ((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(2)
        };
    }

    startMonitoring(interval: number = 5000) {
        return setInterval(() => {
            this.measure();
            const stats = this.getStats();

            if (stats) {
                console.log('💾 Memory:', stats);

                // Upozorenje ako je usage > 80%
                if (parseFloat(stats.usagePercent) > 80) {
                    console.warn('⚠️ High memory usage:', stats.usagePercent + '%');
                }
            }
        }, interval);
    }
}

/**
 * Pagination Helper
 */
export class PaginationHelper<T> {
    private currentPage = 1;
    private itemsPerPage: number;
    private totalItems: number;

    constructor(
        private items: T[],
        itemsPerPage: number = 20
    ) {
        this.itemsPerPage = itemsPerPage;
        this.totalItems = items.length;
    }

    getCurrentPage(): T[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.items.slice(start, end);
    }

    nextPage(): T[] {
        if (this.hasNextPage()) {
            this.currentPage++;
        }
        return this.getCurrentPage();
    }

    prevPage(): T[] {
        if (this.hasPrevPage()) {
            this.currentPage--;
        }
        return this.getCurrentPage();
    }

    goToPage(page: number): T[] {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
        }
        return this.getCurrentPage();
    }

    hasNextPage(): boolean {
        return this.currentPage < this.getTotalPages();
    }

    hasPrevPage(): boolean {
        return this.currentPage > 1;
    }

    getTotalPages(): number {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    getPageInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.getTotalPages(),
            itemsPerPage: this.itemsPerPage,
            totalItems: this.totalItems,
            hasNext: this.hasNextPage(),
            hasPrev: this.hasPrevPage()
        };
    }
}

/**
 * Infinite Scroll Helper
 */
export class InfiniteScrollHelper {
    private loading = false;
    private hasMore = true;
    private page = 1;

    constructor(
        private loadMore: (page: number) => Promise<any[]>,
        private threshold: number = 100
    ) {
        this.setupScrollListener();
    }

    private setupScrollListener() {
        window.addEventListener('scroll', this.handleScroll);
    }

    private handleScroll = async () => {
        if (this.loading || !this.hasMore) {
            return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - this.threshold) {
            await this.load();
        }
    };

    async load() {
        if (this.loading || !this.hasMore) {
            return;
        }

        this.loading = true;

        try {
            const items = await this.loadMore(this.page);

            if (items.length === 0) {
                this.hasMore = false;
            } else {
                this.page++;
            }

            return items;
        } finally {
            this.loading = false;
        }
    }

    reset() {
        this.page = 1;
        this.hasMore = true;
        this.loading = false;
    }

    destroy() {
        window.removeEventListener('scroll', this.handleScroll);
    }
}

/**
 * Request Queue - Ograničava broj concurrent zahteva
 */
export class RequestQueue {
    private queue: Array<() => Promise<any>> = [];
    private running = 0;

    constructor(private concurrency: number = 5) { }

    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            this.process();
        });
    }

    private async process() {
        if (this.running >= this.concurrency || this.queue.length === 0) {
            return;
        }

        this.running++;
        const fn = this.queue.shift()!;

        try {
            await fn();
        } finally {
            this.running--;
            this.process();
        }
    }

    getStats() {
        return {
            queued: this.queue.length,
            running: this.running,
            concurrency: this.concurrency
        };
    }
}

// Export singleton instances
export const memoryMonitor = new MemoryMonitor();
export const requestQueue = new RequestQueue(5);
