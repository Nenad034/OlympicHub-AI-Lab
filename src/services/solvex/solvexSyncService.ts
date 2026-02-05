import { supabase } from '../../supabaseClient';
import { getReservation } from './solvexBookingService';

/**
 * Syncs all active Solvex reservations in the system
 */
export async function syncAllSolvexReservations() {
    console.log('[Solvex Sync] Starting global status check...');

    // 1. Fetch active reservations from Supabase that are from Solvex
    const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('provider', 'solvex')
        .not('status', 'eq', 'cancelled'); // Don't check cancelled ones to save API hits

    if (error) {
        console.error('[Solvex Sync] Error fetching reservations:', error);
        return { success: false, error };
    }

    if (!reservations || reservations.length === 0) {
        console.log('[Solvex Sync] No active Solvex reservations found.');
        return { success: true, count: 0 };
    }

    let changedCount = 0;

    for (const res of reservations) {
        // Solvex booking_id is required
        if (!res.booking_id) continue;

        const result = await getReservation(res.booking_id);
        if (result.success && result.data) {
            const externalStatus = result.data.Status; // e.g., 'Confirmed', 'Canceled'
            const externalId = result.data.ID; // The actual dgKey

            // Compare with current status (db stores simple status, but we can check dossier too)
            const oldStatus = res.guests_data?.solvexStatus || res.status;

            if (externalStatus !== oldStatus) {
                console.log(`[Solvex Sync] Status changed for ${res.cis_code}: ${oldStatus} -> ${externalStatus}`);

                // Update reservation in DB
                const updatedGuestsData = {
                    ...(res.guests_data || {}),
                    solvexStatus: externalStatus,
                    solvexKey: externalId
                };

                // Map external status to internal status
                let internalStatus = res.status;
                if (externalStatus === 'Canceled') internalStatus = 'cancelled';
                if (externalStatus === 'Confirmed' || externalStatus === 'Active') internalStatus = 'confirmed';

                await supabase
                    .from('reservations')
                    .update({
                        status: internalStatus,
                        guests_data: updatedGuestsData
                    })
                    .eq('id', res.id);

                // Create notification
                await createSolvexNotification({
                    message: `Status rezervacije ${res.ref_code} (${res.customer_name}) je promenjen iz ${oldStatus} u ${externalStatus}.`,
                    type: 'status_change',
                    reservation_id: res.id,
                    cis_code: res.cis_code,
                    old_status: oldStatus,
                    new_status: externalStatus
                });

                changedCount++;
            }
        }

        // Suptilna pauza da ne preopteretimo API
        await new Promise(r => setTimeout(r, 500));
    }

    return { success: true, count: reservations.length, changed: changedCount };
}

/**
 * Creates a notification in Supabase
 */
async function createSolvexNotification(params: {
    message: string;
    type: string;
    reservation_id: string;
    cis_code: string;
    old_status: string;
    new_status: string;
}) {
    try {
        const { error } = await supabase
            .from('solvex_notifications')
            .insert([{
                ...params,
                is_read: false,
                created_at: new Date().toISOString()
            }]);

        if (error) console.error('[Solvex Sync] Error creating notification:', error);
    } catch (e) {
        console.error('[Solvex Sync] Notification failed:', e);
    }
}

/**
 * Marks a notification as read/acknowledged
 */
export async function acknowledgeNotification(notificationId: string, operatorName: string) {
    const { error } = await supabase
        .from('solvex_notifications')
        .update({
            is_read: true,
            acknowledged_by: operatorName,
            acknowledged_at: new Date().toISOString()
        })
        .eq('id', notificationId);

    return { success: !error, error };
}

/**
 * Fetches unread notifications
 */
export async function getUnreadNotifications() {
    const { data, error } = await supabase
        .from('solvex_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    return { success: !error, data, error };
}
