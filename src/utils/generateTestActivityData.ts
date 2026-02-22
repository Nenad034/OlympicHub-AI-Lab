/**
 * Activity Tracker - Test Data Generator
 * Generates sample activity data for testing the Daily Activity Report
 */

// Simulate activity tracking
const generateTestData = () => {
    console.log('🧪 Generating test activity data...');

    // Helper to generate random date within today
    const getRandomTimeToday = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
        const end = new Date();
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Generate activity logs
    const activities = [];
    const today = new Date().toISOString().split('T')[0];

    // Sample activities
    const sampleActivities = [
        { type: 'login', module: 'auth', action: 'Nenad logged in', user: 'Nenad', userId: 'user-nenad', status: 'success' },
        { type: 'search', module: 'reservation', action: 'Searched hotels in Paris: 45 results', user: 'Nenad', userId: 'user-nenad', status: 'success' },
        { type: 'create', module: 'reservation', action: 'Created reservation RES-2026-001', user: 'Nenad', userId: 'user-nenad', status: 'success' },
        { type: 'ai_chat', module: 'ai_chat', action: 'AI Chat request (1234 tokens)', user: 'Nenad', userId: 'user-nenad', status: 'success' },
        { type: 'email', module: 'email', action: 'Email sent to client@example.com', user: 'Nenad', userId: 'user-nenad', status: 'success' },
        { type: 'document', module: 'document', action: 'Generated Voucher (PDF)', user: 'Nenad', userId: 'user-nenad', status: 'success' },
        { type: 'import', module: 'production', action: 'Imported 15 hotels from Solvex', user: 'Nenad', userId: 'user-nenad', status: 'success' },
        { type: 'api_call', module: 'system', action: 'API call to Gemini/gemini-2.0-flash', user: 'System', userId: 'system', status: 'success' },
        { type: 'update', module: 'reservation', action: 'Updated reservation RES-2026-001', user: 'Marko', userId: 'user-marko', status: 'success' },
        { type: 'search', module: 'reservation', action: 'Searched hotels in Rome: 32 results', user: 'Marko', userId: 'user-marko', status: 'success' },
        { type: 'error', module: 'system', action: 'API timeout error', user: 'System', userId: 'system', status: 'error' },
        { type: 'ai_chat', module: 'ai_chat', action: 'AI Chat request (890 tokens)', user: 'Jelena', userId: 'user-jelena', status: 'success' },

        // ClickToTravel Web activities
        { type: 'create', module: 'reservation', action: 'New inquiry from website: Greece package', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
        { type: 'create', module: 'reservation', action: 'Contact form submission: Request for group travel', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
        { type: 'search', module: 'reservation', action: 'Website search: Hotels in Athens', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
        { type: 'create', module: 'reservation', action: 'Online reservation request: RES-WEB-001', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
        { type: 'email', module: 'email', action: 'Automated confirmation email sent', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
        { type: 'search', module: 'reservation', action: 'Website search: Last minute deals', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
        { type: 'create', module: 'reservation', action: 'Newsletter subscription: new@example.com', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
        { type: 'view', module: 'reservation', action: 'Hotel details viewed: Hotel Acropolis', user: 'ClickToTravel Web', userId: 'clicktotravel-website', status: 'success' },
    ];

    // Generate 50 random activities
    for (let i = 0; i < 50; i++) {
        const sample = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];
        const timestamp = getRandomTimeToday().toISOString();

        activities.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp,
            userId: sample.userId,
            userName: sample.user,
            activityType: sample.type,
            module: sample.module,
            action: sample.action,
            status: sample.status,
            details: sample.type === 'ai_chat' ? { tokens: Math.floor(Math.random() * 2000) + 500 } : {}
        });
    }

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Save to localStorage
    localStorage.setItem('activity_logs', JSON.stringify(activities));
    console.log(`✅ Generated ${activities.length} test activities`);

    // Generate daily stats
    const stats = {
        [today]: {
            date: today,
            totalActivities: activities.length,
            activeUsers: 4, // Nenad, Marko, Jelena, ClickToTravel Web
            reservations: {
                total: 12,
                byStatus: {
                    active: { count: 5, people: 18, revenue: 4500 },
                    reserved: { count: 4, people: 12, revenue: 3200 },
                    cancelled: { count: 1, people: 2, revenue: 450 },
                    completed: { count: 1, people: 4, revenue: 1200 },
                    pending: { count: 1, people: 3, revenue: 800 }
                }
            },
            aiUsage: {
                requests: 15,
                tokens: 18450,
                cost: 1.38
            },
            apiCalls: {
                total: 28,
                byProvider: {
                    'Gemini': 20,
                    'Solvex': 5,
                    'Supabase': 3
                }
            },
            errors: 2,
            warnings: 5
        }
    };

    localStorage.setItem('daily_stats', JSON.stringify(stats));
    console.log(`✅ Generated daily stats for ${today}`);

    console.log('🎉 Test data generation complete!');
    console.log('📊 You can now view the Daily Activity Report in Settings');
};

// Auto-run when script is loaded
if (typeof window !== 'undefined') {
    console.log('🚀 Activity Tracker Test Data Generator loaded');
    console.log('💡 Run generateTestData() to create sample data');

    // Make function globally available
    (window as any).generateTestData = generateTestData;

    // Auto-generate on first load if no data exists
    if (!localStorage.getItem('activity_logs')) {
        console.log('📝 No existing data found. Auto-generating test data...');
        generateTestData();
    }
}

export { generateTestData };
