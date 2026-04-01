# Person 4: Testing Prompt for Antigravity

**Instructions:**
Person 4, your testing is entirely restricted to the automated **Backend** Webhooks and AI. Therefore, you can test at any time, parallel to anyone else!

**Setup Requirements:**
Before testing, make sure you have Node.js 20+ installed. Then, install backend dependencies and start the server:

1. **Backend:**
   ```bash
   cd dental-backend
   npm install
   npm run start:dev
   ```

*(Note: Ensure that you configure the `GEMINI_API_KEY` and WhatsApp tokens in `.env` before testing your Webhook integrations).*

**Copy and paste the prompt below to Antigravity to start your testing:**

***

**Prompt for Antigravity:**
"I am Person 4. My responsibility is the WhatsApp Bot and Gemini AI integration. We are testing the backend exclusively. Ensure the backend is running.
1. Check that the `.env` has a `GEMINI_API_KEY` and mock a `POST` request to the `/ai/chat-test` endpoint bypassing the frontend. Print the chatbot's response to ensure it mimics a Dental Clinic Assistant.
2. Verify that the WhatsApp message flows (`flows/booking.flow.ts`, `flows/menu.flow.ts`) have been refactored correctly out of the main service.
3. Check the `bullmq` queue initializations for the reminder and no-show background jobs. Ensure they establish a connection to Redis successfully."
