# WhatsApp Automation & AI Module (Person 4 Deliverable)

This document covers the WhatsApp Automation module and Gemini AI integrations mapped out by Person 4 for the `dental-backend`.

## Core Libraries Used
- `@google/generative-ai`: For Gemini capabilities (intelligent conversational routing & clinical summarization)
- `@nestjs/bull`: For scheduled reminders and recovery messaging (powered by Redis)
- `axios`: For outbound Meta Graph API requests

## Webhook Setup & Testing
To connect the local backend to real Meta WhatsApp endpoints for dev testing:

1. **Start ngrok**
```bash
# This binds port 3001 to an internet-facing tunnel
ngrok http 3001
```

2. **Configure Meta Developer application**
Log in to your Meta Developer dashboard for your WhatsApp Business Account.
- Go to WhatsApp > Configuration
- Click "Edit" under Webhook
- Callback URL: `https://<your_ngrok_url>/whatsapp/webhook`
- Verify Token: The value inside your `.env` for `WHATSAPP_VERIFY_TOKEN`
- Ensure you subscribe to the `messages` event.

3. **Verify Incoming Payload**
The integration provides a `GET /whatsapp/webhook` to validate Meta's hook connection.
It also exposes `POST /whatsapp/webhook` to asynchronously parse, state-manage, and respond to texts in a fire-and-forget manner.

## Conversation Flow Strategy

The system uses a TTL indexed `wa_sessions` collection. An inactive conversation resets to `IDLE` after 30 minutes.

### Flow Trees

1. **Greeting & Menu (Priority match over state)**
`hello`, `hi`, `menu` -> `SessionState: IDLE` -> Shows options

2. **Booking Flow**
`book` (1)
   -> `SessionState: AWAITING_NAME` (User provides Name)
   -> `SessionState: AWAITING_DATE` (User provides Date, triggers Doctor lookup)
   -> `SessionState: AWAITING_DOCTOR_CHOICE` (User provides Index, triggers Slot lookup)
   -> `SessionState: AWAITING_SLOT` (User provides Index, prompts confirmation)
   -> `SessionState: BOOKING_CONFIRM` (User says Yes, creates Appointment, resets `IDLE`)

3. **Fallback & AI Conversational Logic**
If the state is `IDLE` and no predefined keyword matches, the `WhatsappService` bounces the user's text and session context into the `AiService`. This relies on Gemini 1.5 Flash responding seamlessly with clinic info wrapped tightly by a system prompt.

## Jobs
- **Reminder Job:** BullMQ cron mapped to trigger notifications 1-day prior.
- **Recovery Job:** Triggered near end-of-day for active NO-SHOW appointments.

## Environment References (Add to .env)
```env
WHATSAPP_VERIFY_TOKEN=your_custom_secure_string
WHATSAPP_TOKEN=your_meta_system_user_access_token
GEMINI_API_KEY=your_google_ai_studio_key
REDIS_HOST=localhost
REDIS_PORT=6379
```
