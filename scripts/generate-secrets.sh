#!/bin/bash

# Whistle App - Secure Key Generation Script
# Run this script to generate secure encryption keys and JWT secrets
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Whistle App Security Key Generation"
echo "====================================="

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl is required but not installed."
    echo "   Install openssl and try again."
    exit 1
fi

# Generate encryption key (32 bytes = 256 bits)
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "✅ Generated 256-bit encryption key"

# Generate JWT secret (32 bytes = 256 bits) 
JWT_SECRET=$(openssl rand -hex 32)
echo "✅ Generated 256-bit JWT secret"

# Generate secure admin password (24 characters)
ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
echo "✅ Generated secure admin password"

# Create .env file from template
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env from template"
else
    echo "❌ Warning: .env.example not found, creating basic .env"
    cat > .env << EOF
# Generated environment variables
NODE_ENV=development
PORT=8080
EOF
fi

# Update .env with generated secrets
cat >> .env << EOF

# === GENERATED SECURITY KEYS ===
# Generated on: $(date)
ENCRYPTION_KEY=${ENCRYPTION_KEY}
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# === EMAIL CONFIGURATION ===
# Set these manually:
# EMAIL_USER=your_email@gmail.com
# EMAIL_APP_PASSWORD=your_gmail_app_password

# === CORS SETTINGS ===
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo ""
echo "🎉 Security keys generated successfully!"
echo ""
echo "📋 Your admin credentials:"
echo "   Username: admin"
echo "   Password: ${ADMIN_PASSWORD}"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. The .env file contains sensitive information"
echo "   2. Never commit .env files to version control"
echo "   3. Store admin credentials securely"
echo "   4. Rotate keys regularly (see SECURITY.md)"
echo ""
echo "📧 Next steps:"
echo "   1. Set EMAIL_USER and EMAIL_APP_PASSWORD in .env"
echo "   2. Review and update ALLOWED_ORIGINS for production"
echo "   3. Read SECURITY.md for key rotation procedures"
echo ""
echo "🚀 Run 'npm run dev' to start the application"
