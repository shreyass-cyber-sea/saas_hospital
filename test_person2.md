# Person 2: Testing Prompt for Antigravity

**Instructions:**
Person 2, you can test **SECOND** (or at the same time as Person 3) as long as Person 1 verifies that the frontend dashboard is accessible.

**Setup Requirements:**
Before testing, make sure you have Node.js 20+ installed. Then, install dependencies and start the servers:

1. **Backend:**
   ```bash
   cd dental-backend
   npm install
   npm run start:dev
   ```
2. **Frontend:**
   ```bash
   cd dental-frontend
   npm install
   npm run dev
   ```

*(Note: The `.env` file containing the MongoDB connection is already included in this repository, so you don't need to configure the database yourself).*

**Copy and paste the prompt below to Antigravity to start your testing:**

***

**Prompt for Antigravity:**
"I am Person 2. My responsibility is the Clinical Modules (Patients, Appointments, and Clinical Notes).
I have installed the dependencies (`npm install`) and the frontend/backend servers are running locally. 
I want you to verify the following frontend components and workflows:
1. Navigate to the Patients Directory `/patients`. Verify the UI renders without errors.
2. Open the Patient Registration form (`/patients/new`) and verify the Zod form validation is working (e.g. required fields block submission).
3. Navigate to the Appointments page (`/appointments`) and confirm that both the Calendar view (`react-big-calendar`) and the List view tabs are rendering properly.
4. Try to open the 'New Appointment' slide-over form and confirm it opens correctly.
Please document any UI crashes or TypeScript errors you find during these steps."
