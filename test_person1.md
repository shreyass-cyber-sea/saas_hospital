# Person 1: Testing Prompt for Antigravity

**Instructions:**
Person 1, you should ideally test **FIRST**. Since you built the foundation and authentication, if the login or the dashboard structure fails, the other team members will not be able to test their UI workflows.

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
"I am Person 1. My responsibility in this project is the Foundation, Authentication, and Infrastructure layout. 
I have installed the dependencies (`npm install`) and both the Next.js frontend and NestJS backend servers are running locally. 
I want you to verify the following for me:
1. Ensure the auth routing middleware properly blocks unauthenticated users from accessing `/dashboard`.
2. Ensure the mock login flow inside `/login` successfully redirects to the dashboard.
3. Verify that the global layout (`Sidebar` and `Header`) renders without any crashes.
4. Verify that the MongoDB Atlas connection in the backend is stable and not throwing connection errors on boot.
Please document any errors you find."
