👤 PERSON 4 — Frontend + WhatsApp + AI
Next.js App + WhatsApp Automation + Gemini Integration

🛠 Person 4 Manual Setup:

Install Node.js 20+ → nodejs.org
Create frontend project:

bash   npx create-next-app@latest dental-frontend --typescript --tailwind --eslint --app
   cd dental-frontend

Init shadcn/ui:

bash   npx shadcn@latest init
   # Choose: Default style, Slate color, CSS variables: yes

Add shadcn components:

bash   npx shadcn@latest add button input label card table badge dialog sheet calendar select textarea form toast avatar dropdown-menu tabs progress skeleton alert separator scroll-area

Install additional packages:

bash   npm install @tanstack/react-query axios react-hook-form @hookform/resolvers zod date-fns react-big-calendar @types/react-big-calendar dayjs recharts lucide-react next-themes zustand jwt-decode
```
6. Create `.env.local`:
```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_APP_NAME=DentalCloud

For backend WhatsApp module — clone backend repo separately:

bash   git clone <dental-backend-repo> dental-backend-p4
   cd dental-backend-p4
   git checkout -b feat/person4-automation
   npm install @google/generative-ai
```
8. **ngrok for WhatsApp webhook testing:**
   - Install ngrok: [ngrok.com/download](https://ngrok.com/download)
   - After backend runs: `ngrok http 3001`
   - Copy HTTPS URL → set as webhook in Meta Developer Console
   - Webhook path: `https://xxxx.ngrok.io/whatsapp/webhook`
   - Verify Token: value of `WHATSAPP_VERIFY_TOKEN` from .env

---
👤 PERSON 1 — Backend Foundation
Auth + Tenant + Users + Project Scaffold + DevOps
🛠 Person 1 Manual Setup:
Install Node.js 20+ → nodejs.org
Install NestJS CLI globally: npm i -g @nestjs/cli
Install Docker Desktop → docker.com
mkdir dental-backend && cd dental-backend
Place .env and gcp-key.json in root
After building: push to dental-backend repo on feat/person1-foundation branch
Notify Person 2 and Person 3 when scaffold is pushed — they depend on your base


👤 PERSON 3 — Backend Business Modules
Billing + Inventory + Reports + Analytics
🛠 Person 3 Manual Setup:
Install Node.js 20+ and NestJS CLI: npm i -g @nestjs/cli
Wait for Person 1 to push their branch → git clone <dental-backend-repo>
git checkout main && git pull
git checkout -b feat/person3-business
Place .env and gcp-key.json in project root
npm install
Install your new packages (listed in prompt)
You will import PatientsService from Person 2's module — but since you're on a separate branch, mock it first with an interface, and integrate when branches merge



👤 PERSON 2 — Backend Clinical Modules
Appointments + Patients + Clinical Notes + File Storage
🛠 Person 2 Manual Setup:
Install Node.js 20+ and NestJS CLI: npm i -g @nestjs/cli
Wait for Person 1 to push their branch → then: git clone <dental-backend-repo>
git checkout main && git pull
git checkout -b feat/person2-clinical
Place .env and gcp-key.json in project root
npm install to get Person 1's dependencies
Install your new packages (listed in prompt below)
Install Google Cloud CLI: cloud.google.com/sdk
gcloud auth activate-service-account --key-file=gcp-key.json
gcloud config set project dental-clinic-saas
Verify bucket: gsutil ls gs://dental-saas-uploads

👤 PERSON 4 — Frontend + WhatsApp + AI
Next.js App + WhatsApp Automation + Gemini Integration

🛠 Person 4 Manual Setup:

Install Node.js 20+ → nodejs.org
Create frontend project:

bash   npx create-next-app@latest dental-frontend --typescript --tailwind --eslint --app
   cd dental-frontend

Init shadcn/ui:

bash   npx shadcn@latest init
   # Choose: Default style, Slate color, CSS variables: yes

Add shadcn components:

bash   npx shadcn@latest add button input label card table badge dialog sheet calendar select textarea form toast avatar dropdown-menu tabs progress skeleton alert separator scroll-area

Install additional packages:

bash   npm install @tanstack/react-query axios react-hook-form @hookform/resolvers zod date-fns react-big-calendar @types/react-big-calendar dayjs recharts lucide-react next-themes zustand jwt-decode
```
6. Create `.env.local`:
```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_APP_NAME=DentalCloud

For backend WhatsApp module — clone backend repo separately:

bash   git clone <dental-backend-repo> dental-backend-p4
   cd dental-backend-p4
   git checkout -b feat/person4-automation
   npm install @google/generative-ai
```
8. **ngrok for WhatsApp webhook testing:**
   - Install ngrok: [ngrok.com/download](https://ngrok.com/download)
   - After backend runs: `ngrok http 3001`
   - Copy HTTPS URL → set as webhook in Meta Developer Console
   - Webhook path: `https://xxxx.ngrok.io/whatsapp/webhook`
   - Verify Token: value of `WHATSAPP_VERIFY_TOKEN` from .env

---
