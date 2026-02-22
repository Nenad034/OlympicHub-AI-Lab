/**
 * Test script to verify AI Quota Tracking
 * This simulates an AI call and checks if quota is being tracked
 */

import { aiUsageService } from './src/services/aiUsageService';

console.log('🧪 Testing AI Quota Tracking System\n');

// Simulate some AI usage
console.log('1️⃣ Recording test usage for Gemini...');
aiUsageService.recordUsage('gemini', 1500);

console.log('\n2️⃣ Recording more usage for Gemini...');
aiUsageService.recordUsage('gemini', 2300);

console.log('\n3️⃣ Getting current usage stats...');
const geminiUsage = aiUsageService.getUsage('gemini');
console.log('Gemini Usage:', geminiUsage);

console.log('\n4️⃣ Recording usage for OpenAI...');
aiUsageService.recordUsage('openai', 1200);

const openaiUsage = aiUsageService.getUsage('openai');
console.log('OpenAI Usage:', openaiUsage);

console.log('\n✅ Test complete! Check localStorage for ai_quota_* keys');
console.log('💡 Open the app and navigate to Settings > AI Quota to see the dashboard');
