// Script to setup WhatsApp phone number mapping
// Usage: node scripts/setup-whatsapp-mapping.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex > 0) {
        const key = line.substring(0, separatorIndex).trim();
        const value = line.substring(separatorIndex + 1).trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const WATI_PHONE_NUMBER = process.env.WATI_PHONE_NUMBER || '9035521614';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

async function setupMapping() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Define schemas
    const tenantSchema = new mongoose.Schema({}, { strict: false });
    const mappingSchema = new mongoose.Schema({
      whatsappPhoneNumberId: String,
      tenantId: mongoose.Schema.Types.ObjectId,
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    }, { collection: 'wa_phone_mappings' });
    
    const Tenant = mongoose.model('Tenant', tenantSchema, 'tenants');
    const Mapping = mongoose.model('WhatsAppPhoneMapping', mappingSchema, 'wa_phone_mappings');
    
    // Find the first tenant
    const tenant = await Tenant.findOne();
    
    if (!tenant) {
      console.error('❌ No tenant found in database!');
      console.log('Please create a tenant first.');
      process.exit(1);
    }
    
    console.log(`Found tenant: ${tenant.name || tenant.clinicName} (${tenant._id})`);
    
    // Check if mapping already exists
    const existingMapping = await Mapping.findOne({
      whatsappPhoneNumberId: WATI_PHONE_NUMBER
    });
    
    if (existingMapping) {
      console.log(`✅ Mapping already exists for ${WATI_PHONE_NUMBER}`);
      console.log(`   Tenant ID: ${existingMapping.tenantId}`);
      console.log(`   Active: ${existingMapping.isActive}`);
    } else {
      // Create mapping
      const newMapping = new Mapping({
        whatsappPhoneNumberId: WATI_PHONE_NUMBER,
        tenantId: tenant._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newMapping.save();
      
      console.log(`✅ Created WhatsApp phone mapping:`);
      console.log(`   Phone Number ID: ${WATI_PHONE_NUMBER}`);
      console.log(`   Tenant ID: ${tenant._id}`);
      console.log(`   Mapping ID: ${newMapping._id}`);
    }
    
    console.log('\n🎉 WhatsApp is now ready! Try sending "hi" to your WhatsApp number.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setupMapping();
