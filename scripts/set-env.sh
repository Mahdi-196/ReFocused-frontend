#!/bin/bash

# Environment Setup Script for ReFocused
# This script helps set the NEXT_PUBLIC_APP_ENV variable for different environments

set_env() {
    local env=$1
    
    case $env in
        "dev"|"development")
            export NEXT_PUBLIC_APP_ENV=development
            echo "✅ Environment set to: development"
            echo "🔧 Console logs will be visible"
            echo "🔧 Dev tools will be enabled"
            ;;
        "prod"|"production")
            export NEXT_PUBLIC_APP_ENV=production
            echo "🚀 Environment set to: production"
            echo "🚫 Console logs will be hidden"
            echo "🚫 Dev tools will be disabled"
            ;;
        "staging")
            export NEXT_PUBLIC_APP_ENV=staging
            echo "🔄 Environment set to: staging"
            echo "⚠️  Console logs will be limited"
            echo "⚠️  Dev tools will be disabled"
            ;;
        *)
            echo "❌ Invalid environment: $env"
            echo "Usage: source scripts/set-env.sh [dev|prod|staging]"
            echo "Examples:"
            echo "  source scripts/set-env.sh dev      # Development mode"
            echo "  source scripts/set-env.sh prod     # Production mode"
            echo "  source scripts/set-env.sh staging  # Staging mode"
            return 1
            ;;
    esac
    
    echo ""
    echo "Current environment variables:"
    echo "  NEXT_PUBLIC_APP_ENV: $NEXT_PUBLIC_APP_ENV"
    echo "  NODE_ENV: $NODE_ENV"
    echo ""
    echo "To start the development server:"
    echo "  yarn dev"
    echo ""
    echo "To build for production:"
    echo "  yarn build"
}

# Check if environment argument is provided
if [ $# -eq 0 ]; then
    echo "❌ No environment specified"
    echo "Usage: source scripts/set-env.sh [dev|prod|staging]"
    exit 1
fi

# Set the environment
set_env "$1"
