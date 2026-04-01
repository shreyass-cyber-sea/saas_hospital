# WATI Account Setup Guide

## Step 1: Create WATI Account
- Go to https://app.wati.io/
- Click "Start Free Trial" or "Sign Up"
- Fill in your business details (name, email, phone number)
- Verify your email

## Step 2: Setup WhatsApp Business Number
- After login, add your WhatsApp business phone number
- Verify the number via WhatsApp (you'll receive a verification code)
- Complete the business profile setup

## Step 3: Get API Credentials
1. Go to Settings → API Setup
2. Find your **Endpoint URL** - typically: `https://api.wati.io/tools/{your-api-token}/sendMessage`
3. Find your **API Token** - copy it securely (this is your WATI_ACCESS_TOKEN)
4. Note your **WhatsApp Phone Number** (without + sign, e.g., 1234567890)

## Step 4: Configure Webhook (for receiving messages)
- In WATI dashboard, go to Settings → Webhook
- Set webhook URL to: `https://your-domain.com/whatsapp/webhook`
- Note the WATI verify token if provided

## Required Environment Variables
After getting credentials, you'll need these for your .env file:
```
WATI_ACCESS_TOKEN=your_api_token_here
WATI_PHONE_NUMBER=your_whatsapp_number_without_plus
WATI_ENDPOINT_URL=https://api.wati.io/tools/{token}/sendMessage
```
