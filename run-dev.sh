#!/bin/bash

# Azure AD B2C Configuration
# Update these placeholders with your real values
export AZURE_AD_B2C_CLIENT_ID="{{CLIENT_ID}}"
export AZURE_AD_B2C_CLIENT_SECRET="{{CLIENT_SECRET}}"
export AZURE_AD_B2C_INSTANCE="https://example.b2clogin.com"
export AZURE_AD_B2C_DOMAIN="example.onmicrosoft.com"
export AZURE_AD_B2C_USER_FLOW="{{USER_FLOW}}"
# export AZURE_AD_B2C_TENANT_ID="your-tenant-id-guid" # Optional if DOMAIN is provided
export AZURE_AD_B2C_REDIRECT_URI="{{redirect_uri}}" # Optional: Explicit redirect URI

# Authentication Cookie Configuration
# export AUTH_COOKIE_PASSWORD="at-least-32-characters-long-secret-password"
export AUTH_COOKIE_SECURE="false" # Set to false for local HTTP development

# Application Configuration
export PORT=7154
export NODE_ENV="development"

# Run the application
npm run dev
