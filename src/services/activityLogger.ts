/**
 * Activity Logger Helper
 * Convenient functions for logging common activities
 */

import { activityTracker, type ActivityModule, type ActivityType, type ActivityStatus } from './activityTracker';

export class ActivityLogger {
    /**
     * Log user login
     */
    static logLogin(userId: string, userName: string, ipAddress?: string): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'login',
            module: 'auth',
            action: `${userName} logged in`,
            ipAddress,
            userAgent: navigator.userAgent,
            status: 'success'
        });
    }

    /**
     * Log user logout
     */
    static logLogout(userId: string, userName: string): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'logout',
            module: 'auth',
            action: `${userName} logged out`,
            status: 'success'
        });
    }

    /**
     * Log reservation creation
     */
    static logReservationCreate(
        userId: string,
        userName: string,
        resCode: string,
        status: 'active' | 'reserved' | 'cancelled' | 'completed' | 'pending',
        people: number,
        revenue: number
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'create',
            module: 'reservation',
            action: `Created reservation ${resCode}`,
            details: { resCode, status, people, revenue },
            status: 'success'
        });

        // Update reservation stats
        activityTracker.updateReservationStats(status, people, revenue);
    }

    /**
     * Log reservation update
     */
    static logReservationUpdate(
        userId: string,
        userName: string,
        resCode: string,
        changes: any
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'update',
            module: 'reservation',
            action: `Updated reservation ${resCode}`,
            details: { resCode, changes },
            status: 'success'
        });
    }

    /**
     * Log hotel search
     */
    static logHotelSearch(
        userId: string,
        userName: string,
        searchParams: any,
        resultsCount: number
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'search',
            module: 'reservation',
            action: `Searched hotels: ${resultsCount} results`,
            details: { searchParams, resultsCount },
            status: 'success'
        });
    }

    /**
     * Log AI chat interaction
     */
    static logAIChat(
        userId: string,
        userName: string,
        prompt: string,
        tokens: number,
        model: string
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'ai_chat',
            module: 'ai_chat',
            action: `AI Chat request (${tokens} tokens)`,
            details: {
                prompt: prompt.substring(0, 100) + '...',
                tokens,
                model
            },
            status: 'success'
        });
    }

    /**
     * Log email sent
     */
    static logEmailSent(
        userId: string,
        userName: string,
        to: string,
        subject: string,
        success: boolean
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'email',
            module: 'email',
            action: `Email sent to ${to}`,
            details: { to, subject },
            status: success ? 'success' : 'error'
        });
    }

    /**
     * Log document generation
     */
    static logDocumentGeneration(
        userId: string,
        userName: string,
        documentType: string,
        format: 'PDF' | 'HTML' | 'Excel',
        resCode?: string
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'document',
            module: 'document',
            action: `Generated ${documentType} (${format})`,
            details: { documentType, format, resCode },
            status: 'success'
        });
    }

    /**
     * Log hotel import
     */
    static logHotelImport(
        userId: string,
        userName: string,
        source: string,
        count: number,
        success: boolean
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'import',
            module: 'production',
            action: `Imported ${count} hotels from ${source}`,
            details: { source, count },
            status: success ? 'success' : 'error'
        });
    }

    /**
     * Log API call
     */
    static logAPICall(
        provider: string,
        endpoint: string,
        durationMs: number,
        success: boolean,
        error?: string
    ): void {
        activityTracker.logActivity({
            activityType: 'api_call',
            module: 'system',
            action: `API call to ${provider}/${endpoint}`,
            details: { provider, endpoint, error },
            durationMs,
            status: success ? 'success' : 'error'
        });
    }

    /**
     * Log error
     */
    static logError(
        module: ActivityModule,
        action: string,
        error: any,
        userId?: string,
        userName?: string
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'error',
            module,
            action,
            details: {
                error: error.message || error.toString(),
                stack: error.stack
            },
            status: 'error'
        });
    }

    /**
     * Log system event
     */
    static logSystemEvent(
        action: string,
        details?: any,
        status: ActivityStatus = 'info'
    ): void {
        activityTracker.logActivity({
            activityType: 'system',
            module: 'system',
            action,
            details,
            status
        });
    }

    /**
     * Log data export
     */
    static logExport(
        userId: string,
        userName: string,
        exportType: string,
        format: string,
        recordCount: number
    ): void {
        activityTracker.logActivity({
            userId,
            userName,
            activityType: 'export',
            module: 'system',
            action: `Exported ${recordCount} ${exportType} records (${format})`,
            details: { exportType, format, recordCount },
            status: 'success'
        });
    }

    /**
     * Log website inquiry (Olympic Sajt)
     */
    static logWebsiteInquiry(
        inquiryType: string,
        details: any
    ): void {
        activityTracker.logActivity({
            userId: 'olympic-website',
            userName: 'Olympic Sajt',
            activityType: 'create',
            module: 'reservation',
            action: `New inquiry from website: ${inquiryType}`,
            details,
            status: 'success'
        });
    }

    /**
     * Log website contact form submission (Olympic Sajt)
     */
    static logWebsiteContact(
        name: string,
        email: string,
        subject: string
    ): void {
        activityTracker.logActivity({
            userId: 'olympic-website',
            userName: 'Olympic Sajt',
            activityType: 'create',
            module: 'reservation',
            action: `Contact form submission: ${subject}`,
            details: { name, email, subject },
            status: 'success'
        });
    }

    /**
     * Log website search (Olympic Sajt)
     */
    static logWebsiteSearch(
        searchQuery: string,
        resultsCount: number
    ): void {
        activityTracker.logActivity({
            userId: 'olympic-website',
            userName: 'Olympic Sajt',
            activityType: 'search',
            module: 'reservation',
            action: `Website search: ${searchQuery}`,
            details: { searchQuery, resultsCount },
            status: 'success'
        });
    }

    /**
     * Log website reservation request (Olympic Sajt)
     */
    static logWebsiteReservation(
        resCode: string,
        destination: string,
        people: number
    ): void {
        activityTracker.logActivity({
            userId: 'olympic-website',
            userName: 'Olympic Sajt',
            activityType: 'create',
            module: 'reservation',
            action: `Online reservation request: ${resCode}`,
            details: { resCode, destination, people },
            status: 'success'
        });
    }

    /**
     * Log newsletter subscription (Olympic Sajt)
     */
    static logNewsletterSubscription(
        email: string
    ): void {
        activityTracker.logActivity({
            userId: 'olympic-website',
            userName: 'Olympic Sajt',
            activityType: 'create',
            module: 'reservation',
            action: `Newsletter subscription: ${email}`,
            details: { email },
            status: 'success'
        });
    }

    /**
     * Log hotel view (Olympic Sajt)
     */
    static logWebsiteHotelView(
        hotelName: string,
        hotelId: string
    ): void {
        activityTracker.logActivity({
            userId: 'olympic-website',
            userName: 'Olympic Sajt',
            activityType: 'view',
            module: 'reservation',
            action: `Hotel details viewed: ${hotelName}`,
            details: { hotelName, hotelId },
            status: 'success'
        });
    }
}

export default ActivityLogger;
