#!/bin/bash

# Supabase Edge Functions Deployment Script
# Usage: ./deploy-functions.sh [function-name]

set -e

echo "🚀 Olympic Hub - Email Functions Deployment"
echo "==========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "🔐 Login with: supabase login"
    exit 1
fi

# Function to deploy a single function
deploy_function() {
    local func_name=$1
    echo ""
    echo "📤 Deploying $func_name..."
    
    if supabase functions deploy "$func_name"; then
        echo "✅ $func_name deployed successfully"
    else
        echo "❌ Failed to deploy $func_name"
        return 1
    fi
}

# If specific function is provided, deploy only that
if [ $# -eq 1 ]; then
    deploy_function "$1"
    echo ""
    echo "✨ Deployment complete!"
    exit 0
fi

# Otherwise, deploy all email functions
echo ""
echo "📋 Deploying all email functions..."

FUNCTIONS=(
    "send-email"
    "fetch-emails"
    "test-email-connection"
)

FAILED=()

for func in "${FUNCTIONS[@]}"; do
    if ! deploy_function "$func"; then
        FAILED+=("$func")
    fi
done

echo ""
echo "==========================================="

if [ ${#FAILED[@]} -eq 0 ]; then
    echo "✅ All functions deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test functions with: supabase functions logs <function-name>"
    echo "   2. Configure email accounts in Olympic Hub"
    echo "   3. Send your first email!"
else
    echo "⚠️  Some functions failed to deploy:"
    for func in "${FAILED[@]}"; do
        echo "   - $func"
    done
    exit 1
fi
