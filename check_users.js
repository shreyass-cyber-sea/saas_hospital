const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, './dental-backend/.env') });

async function checkUsers() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found in .env');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const users = await db.collection('users').find({}).toArray();
        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`User: ${u.name}, Email: ${u.email}, Role: ${u.role}, HasProfile: ${!!u.doctorProfile}, Tenant: ${u.tenantId}, IsActive: ${u.isActive}`);
        });

        const doctors = await db.collection('users').find({
            isActive: true,
            $or: [
                { role: 'DOCTOR' },
                { role: 'ADMIN' },
            ],
        }).toArray();
        console.log('Doctors found by query:', doctors.length);
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

checkUsers();
