# Person 3: Testing Prompt for Antigravity

**Instructions:**
Person 3, you can test **SECOND** (or at the same time as Person 2) as long as Person 1 verifies that the frontend dashboard is accessible.

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
"I am Person 3. My responsibility is the Operations Modules (Billing, Inventory, and Analytics/Reports).
I have installed the dependencies (`npm install`) and the frontend/backend servers are running locally. 
I want you to verify the following frontend workflows:
1. Navigate to `/billing/invoices` and check if the layout renders without errors.
2. Open the 'New Invoice' form and verify that the complex dynamic line-item calculations (price, quantity, tax, discounts) are strictly typed and functioning without crashing.
3. Open the Inventory pages (`/inventory/stock` and `/inventory/lab-cases`) and verify the DataTables render and the 'Transaction Modal' opens.
4. Navigate to `/reports` and verify that the Recharts components (RevenueChart, AppointmentPieChart, and ChairUtilizationBars) load successfully without layout shifts.
Please document any UI crashes or TypeScript errors you find during these steps."
