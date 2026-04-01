const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// ============================================================
// RICH SEED — lots of data for one tenant to show UI variations
// Usage: node scripts/seed.js
// ============================================================

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d; };

const seedDatabase = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) { console.error('MONGODB_URI not found'); process.exit(1); }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    console.log('Clearing old data...');
    for (const c of await db.collections()) await c.deleteMany({});
    console.log('✅ Cleared\n');

    // ─── SCHEMAS ────────────────────────────────────────────────────────────────
    const ObjectId = mongoose.Schema.Types.ObjectId;

    const Tenant = mongoose.model('Tenant', new mongoose.Schema({
        name: String, slug: String, subscriptionPlan: { type: String, default: 'PRO' },
        isActive: { type: Boolean, default: true }, contactEmail: String, contactPhone: String,
        settings: { workingHours: [Object], chairs: [Object] }
    }, { timestamps: true }));

    const User = mongoose.model('User', new mongoose.Schema({
        tenantId: ObjectId, name: String, email: String, passwordHash: String,
        phone: String, isActive: { type: Boolean, default: true },
        role: String, doctorProfile: Object
    }, { timestamps: true }));

    const Patient = mongoose.model('Patient', new mongoose.Schema({
        tenantId: ObjectId, patientId: String, name: String, phone: String, email: String,
        dateOfBirth: Date, gender: String, address: Object,
        bloodGroup: String, allergies: [String], medicalHistory: String,
        isActive: { type: Boolean, default: true },
        firstVisit: Date, lastVisit: Date,
        totalVisits: { type: Number, default: 0 },
        whatsappOptIn: { type: Boolean, default: true },
        createdBy: ObjectId
    }, { timestamps: true }));

    const Appointment = mongoose.model('Appointment', new mongoose.Schema({
        tenantId: ObjectId, patientId: ObjectId, doctorId: ObjectId,
        chairId: String, date: Date, startTime: String, endTime: String,
        duration: { type: Number, default: 30 }, status: String, type: String,
        procedures: [String], notes: String, reminderSent: { type: Boolean, default: false },
        createdBy: ObjectId
    }, { timestamps: true }));

    const Procedure = mongoose.model('Procedure', new mongoose.Schema({
        tenantId: ObjectId, name: String, category: String, basePrice: Number,
        duration: Number, description: String, isActive: { type: Boolean, default: true }
    }, { timestamps: true }));

    const LineItem = {
        procedureId: ObjectId, description: String, quantity: { type: Number, default: 1 },
        unitPrice: Number, discount: { type: Number, default: 0 }, discountPercent: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 18 }, taxAmount: Number, totalAmount: Number
    };
    const Invoice = mongoose.model('Invoice', new mongoose.Schema({
        tenantId: ObjectId, invoiceNumber: String, patientId: ObjectId,
        appointmentId: ObjectId, doctorId: ObjectId, lineItems: [LineItem],
        subtotal: { type: Number, default: 0 }, totalDiscount: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 }, grandTotal: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 }, pendingAmount: { type: Number, default: 0 },
        status: { type: String, default: 'DRAFT' },
        payments: [{ amount: Number, mode: String, reference: String, paidAt: { type: Date, default: Date.now }, recordedBy: ObjectId }],
        advanceUsed: { type: Number, default: 0 }, notes: String, pdfUrl: String, createdBy: ObjectId
    }, { timestamps: true }));

    const InventoryItem = mongoose.model('InventoryItem', new mongoose.Schema({
        tenantId: ObjectId, name: String, sku: String, category: String, description: String,
        unit: String, currentStock: Number, minimumStock: Number, unitCost: Number,
        supplier: String, isActive: { type: Boolean, default: true }
    }, { timestamps: true }));

    // Helper: build invoice line items
    const buildLine = (procId, desc, price, taxPct = 18) => {
        const tax = parseFloat((price * taxPct / 100).toFixed(2));
        const total = parseFloat((price + tax).toFixed(2));
        return { procedureId: procId, description: desc, quantity: 1, unitPrice: price, discount: 0, discountPercent: 0, taxPercent: taxPct, taxAmount: tax, totalAmount: total };
    };
    const calcInvoice = (lines) => {
        const subtotal = lines.reduce((s, l) => s + l.unitPrice, 0);
        const totalTax = parseFloat(lines.reduce((s, l) => s + l.taxAmount, 0).toFixed(2));
        const grandTotal = parseFloat(lines.reduce((s, l) => s + l.totalAmount, 0).toFixed(2));
        return { subtotal, totalTax, grandTotal };
    };

    // ─── 1. TENANT ──────────────────────────────────────────────────────────────
    const tenant = await Tenant.create({
        name: 'Smile Center Dental Clinic', slug: 'smile-center', subscriptionPlan: 'PRO', isActive: true,
        contactEmail: 'doctor@smilecenter.com', contactPhone: '+912244556677',
        settings: {
            workingHours: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => ({ day: d, startTime: '09:00', endTime: '19:00', isClosed: false }))
                .concat([{ day: 'Saturday', startTime: '09:00', endTime: '14:00', isClosed: false }, { day: 'Sunday', startTime: '', endTime: '', isClosed: true }]),
            chairs: [{ name: 'Chair 1', isActive: true }, { name: 'Chair 2', isActive: true }, { name: 'Chair 3', isActive: true }, { name: 'Chair 4', isActive: true }]
        }
    });
    console.log('✅ Tenant:', tenant.name);

    // ─── 2. USERS (1 admin/doctor + 2 more doctors + 1 receptionist) ────────────
    const hash = await bcrypt.hash('password123', 10);
    const admin = await User.create({
        tenantId: tenant._id, name: 'Dr. Arjun Mehta', email: 'doctor@smilecenter.com',
        passwordHash: hash, phone: '+919876543210', role: 'ADMIN', isActive: true,
        doctorProfile: { specialization: 'General Dentistry', registrationNumber: 'MH-DEN-2018-001', experience: 8 }
    });
    const doc2 = await User.create({
        tenantId: tenant._id, name: 'Dr. Priya Iyer', email: 'priya@smilecenter.com',
        passwordHash: hash, phone: '+919876543220', role: 'DOCTOR', isActive: true,
        doctorProfile: { specialization: 'Orthodontics', registrationNumber: 'MH-DEN-2019-042', experience: 5 }
    });
    const doc3 = await User.create({
        tenantId: tenant._id, name: 'Dr. Vikram Nair', email: 'vikram@smilecenter.com',
        passwordHash: hash, phone: '+919876543230', role: 'DOCTOR', isActive: true,
        doctorProfile: { specialization: 'Endodontics', registrationNumber: 'MH-DEN-2020-107', experience: 4 }
    });
    await User.create({
        tenantId: tenant._id, name: 'Kavya Sharma', email: 'reception@smilecenter.com',
        passwordHash: hash, phone: '+919876543240', role: 'RECEPTIONIST', isActive: true
    });
    console.log('✅ Users: 3 doctors + 1 receptionist');

    const doctors = [admin, doc2, doc3];

    // ─── 3. PATIENTS (15 patients) ───────────────────────────────────────────────
    const patientData = [
        { name: 'Alice Johnson', phone: '+911234567890', email: 'alice.j@gmail.com', dob: '1990-05-15', gender: 'FEMALE', city: 'Mumbai', blood: 'B+', allergy: ['Penicillin'], history: 'Asthma. Needs extra anesthesia care.', visits: 12, last: 5 },
        { name: 'Rahul Verma', phone: '+910987654321', email: 'rahul.v@gmail.com', dob: '1985-11-22', gender: 'MALE', city: 'Pune', blood: 'O+', allergy: [], history: 'No known conditions.', visits: 6, last: 12 },
        { name: 'Sunita Patel', phone: '+911122334455', email: 'sunita.p@gmail.com', dob: '1975-08-30', gender: 'FEMALE', city: 'Mumbai', blood: 'A+', allergy: ['Latex'], history: 'Diabetic. Monitor BP before any procedure.', visits: 18, last: 2 },
        { name: 'Kiran Desai', phone: '+919988776655', email: 'kiran.d@gmail.com', dob: '1992-03-12', gender: 'MALE', city: 'Thane', blood: 'AB+', allergy: [], history: 'History of jaw pain.', visits: 4, last: 20 },
        { name: 'Meena Krishnan', phone: '+918877665544', email: 'meena.k@gmail.com', dob: '1980-07-04', gender: 'FEMALE', city: 'Mumbai', blood: 'O-', allergy: ['Aspirin'], history: 'Sensitive teeth. Use desensitizing agents.', visits: 9, last: 8 },
        { name: 'Sanjay Gupta', phone: '+917766554433', email: 'sanjay.g@gmail.com', dob: '1970-12-25', gender: 'MALE', city: 'Navi Mumbai', blood: 'A-', allergy: [], history: 'Hypertensive. Monitor BP.', visits: 22, last: 1 },
        { name: 'Pooja Rao', phone: '+916655443322', email: 'pooja.r@gmail.com', dob: '1998-09-18', gender: 'FEMALE', city: 'Mumbai', blood: 'B-', allergy: [], history: 'Mild gum disease. Regular cleanings needed.', visits: 3, last: 25 },
        { name: 'Aditya Kumar', phone: '+915544332211', email: 'aditya.k@gmail.com', dob: '2001-02-14', gender: 'MALE', city: 'Pune', blood: 'O+', allergy: [], history: 'Braces completed 2023.', visits: 15, last: 30 },
        { name: 'Deepa Nambiar', phone: '+914433221100', email: 'deepa.n@gmail.com', dob: '1988-06-09', gender: 'FEMALE', city: 'Mumbai', blood: 'AB-', allergy: ['Ibuprofen'], history: 'Pregnant — avoid X-rays.', visits: 2, last: 15 },
        { name: 'Rohit Sharma', phone: '+913322110099', email: 'rohit.s@gmail.com', dob: '1983-04-01', gender: 'MALE', city: 'Thane', blood: 'B+', allergy: [], history: 'Root canal done on tooth 46.', visits: 8, last: 7 },
        { name: 'Nisha Joshi', phone: '+912211009988', email: 'nisha.j@gmail.com', dob: '1995-10-30', gender: 'FEMALE', city: 'Mumbai', blood: 'A+', allergy: ['Codeine'], history: 'Wisdom tooth removal pending.', visits: 5, last: 10 },
        { name: 'Vijay Menon', phone: '+911100998877', email: 'vijay.m@gmail.com', dob: '1967-01-15', gender: 'MALE', city: 'Pune', blood: 'O+', allergy: [], history: 'Full denture required lower jaw.', visits: 28, last: 3 },
        { name: 'Ritu Agarwal', phone: '+910099887766', email: 'ritu.a@gmail.com', dob: '1993-08-22', gender: 'FEMALE', city: 'Mumbai', blood: 'A-', allergy: [], history: 'Teeth whitening done.', visits: 7, last: 18 },
        { name: 'Farhan Sheikh', phone: '+919988001122', email: 'farhan.s@gmail.com', dob: '1979-05-05', gender: 'MALE', city: 'Navi Mumbai', blood: 'B+', allergy: ['Penicillin'], history: 'Implant on 36.', visits: 11, last: 6 },
        { name: 'Anjali Tiwari', phone: '+918877112233', email: 'anjali.t@gmail.com', dob: '2000-12-01', gender: 'FEMALE', city: 'Mumbai', blood: 'O+', allergy: [], history: 'New patient. First consultation.', visits: 1, last: 0 },
    ];

    const patients = [];
    for (let i = 0; i < patientData.length; i++) {
        const pd = patientData[i];
        const p = await Patient.create({
            tenantId: tenant._id,
            patientId: `SCD-2024-${String(i + 1).padStart(4, '0')}`,
            name: pd.name, phone: pd.phone, email: pd.email,
            dateOfBirth: new Date(pd.dob), gender: pd.gender,
            address: { street: `${randInt(1, 999)} ${rand(['MG Road', 'Park St', 'Link Rd', 'Station Rd'])}`, city: pd.city, pincode: `4${randInt(10000, 99999)}` },
            bloodGroup: pd.blood, allergies: pd.allergy, medicalHistory: pd.history,
            firstVisit: daysAgo(pd.visits * 30), lastVisit: daysAgo(pd.last),
            totalVisits: pd.visits, createdBy: admin._id
        });
        patients.push(p);
    }
    console.log(`✅ Patients: ${patients.length} created`);

    // ─── 4. PROCEDURES ───────────────────────────────────────────────────────────
    const procedureData = [
        { name: 'General Consultation', cat: 'PREVENTIVE', price: 500, dur: 30 },
        { name: 'Dental Cleaning & Scaling', cat: 'PREVENTIVE', price: 1500, dur: 45 },
        { name: 'Fluoride Treatment', cat: 'PREVENTIVE', price: 800, dur: 20 },
        { name: 'Root Canal Treatment', cat: 'RESTORATIVE', price: 8000, dur: 90 },
        { name: 'Composite Filling', cat: 'RESTORATIVE', price: 2500, dur: 45 },
        { name: 'Ceramic Crown', cat: 'RESTORATIVE', price: 12000, dur: 60 },
        { name: 'Dental Implant', cat: 'SURGICAL', price: 35000, dur: 120 },
        { name: 'Tooth Extraction (simple)', cat: 'SURGICAL', price: 1000, dur: 30 },
        { name: 'Surgical Extraction', cat: 'SURGICAL', price: 3500, dur: 60 },
        { name: 'Orthodontic Braces (full)', cat: 'ORTHODONTIC', price: 45000, dur: 60 },
        { name: 'Retainer', cat: 'ORTHODONTIC', price: 5000, dur: 30 },
        { name: 'Teeth Whitening', cat: 'COSMETIC', price: 6000, dur: 60 },
        { name: 'Smile Designing (consult)', cat: 'COSMETIC', price: 1000, dur: 30 },
        { name: 'Night Guard', cat: 'PREVENTIVE', price: 4500, dur: 30 },
        { name: 'Wisdom Tooth Removal', cat: 'SURGICAL', price: 5000, dur: 75 },
    ];
    const procs = [];
    for (const pd of procedureData) {
        procs.push(await Procedure.create({ tenantId: tenant._id, name: pd.name, category: pd.cat, basePrice: pd.price, duration: pd.dur, isActive: true }));
    }
    console.log(`✅ Procedures: ${procs.length} created`);

    // ─── 5. APPOINTMENTS (40 across last 30 days + next 7 days) ──────────────────
    const apptStatuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    const apptTypes = ['CONSULTATION', 'PROCEDURE', 'FOLLOW_UP', 'NEW_PATIENT', 'EMERGENCY'];
    const timeSlots = [['09:00', '09:30'], ['09:30', '10:15'], ['10:00', '10:45'], ['10:30', '11:15'],
    ['11:00', '11:45'], ['11:30', '12:15'], ['14:00', '14:45'], ['14:30', '15:15'],
    ['15:00', '15:45'], ['15:30', '16:15'], ['16:00', '16:45'], ['16:30', '17:15'],
    ['17:00', '17:45'], ['17:30', '18:15']];

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const apptRows = [];
    // Past appointments (last 30 days)
    for (let d = 30; d >= 1; d--) {
        const numAppts = randInt(1, 4);
        for (let a = 0; a < numAppts; a++) {
            const [st, et] = rand(timeSlots);
            const doc = rand(doctors);
            const pat = rand(patients);
            const type = rand(apptTypes);
            const status = d > 1 ? rand(['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']) : rand(['COMPLETED', 'CANCELLED']);
            apptRows.push({
                tenantId: tenant._id, patientId: pat._id, doctorId: doc._id,
                chairId: `Chair ${randInt(1, 4)}`, date: daysAgo(d),
                startTime: st, endTime: et, duration: randInt(20, 90),
                status, type, procedures: [rand(procedureData).name],
                notes: rand(['', 'Patient comfortable', 'Needs follow-up', 'Referred for X-ray', '']),
                createdBy: admin._id
            });
        }
    }
    // Today's appointments (mixed statuses)
    const todayAppts = [
        { pat: patients[0], doc: admin, st: '09:00', et: '09:30', status: 'COMPLETED', type: 'CONSULTATION', proc: 'General Consultation' },
        { pat: patients[5], doc: admin, st: '10:00', et: '10:45', status: 'COMPLETED', type: 'PROCEDURE', proc: 'Root Canal Treatment' },
        { pat: patients[2], doc: doc2, st: '10:30', et: '11:15', status: 'IN_PROGRESS', type: 'PROCEDURE', proc: 'Dental Cleaning & Scaling' },
        { pat: patients[9], doc: doc3, st: '11:00', et: '11:45', status: 'SCHEDULED', type: 'FOLLOW_UP', proc: 'Composite Filling' },
        { pat: patients[4], doc: admin, st: '14:00', et: '14:30', status: 'CONFIRMED', type: 'NEW_PATIENT', proc: 'General Consultation' },
        { pat: patients[11], doc: doc2, st: '15:00', et: '15:45', status: 'SCHEDULED', type: 'PROCEDURE', proc: 'Ceramic Crown' },
        { pat: patients[14], doc: doc3, st: '16:00', et: '16:30', status: 'SCHEDULED', type: 'NEW_PATIENT', proc: 'General Consultation' },
    ];
    for (const ta of todayAppts) {
        apptRows.push({ tenantId: tenant._id, patientId: ta.pat._id, doctorId: ta.doc._id, chairId: `Chair ${randInt(1, 3)}`, date: today, startTime: ta.st, endTime: ta.et, duration: 30, status: ta.status, type: ta.type, procedures: [ta.proc], notes: '', createdBy: admin._id });
    }
    // Future appointments (next 7 days)
    for (let d = 1; d <= 7; d++) {
        const futDate = new Date(today); futDate.setDate(today.getDate() + d);
        const num = randInt(2, 5);
        for (let a = 0; a < num; a++) {
            const [st, et] = rand(timeSlots);
            const doc = rand(doctors);
            const pat = rand(patients);
            apptRows.push({ tenantId: tenant._id, patientId: pat._id, doctorId: doc._id, chairId: `Chair ${randInt(1, 4)}`, date: futDate, startTime: st, endTime: et, duration: randInt(20, 90), status: rand(['SCHEDULED', 'CONFIRMED']), type: rand(apptTypes), procedures: [rand(procedureData).name], notes: '', createdBy: admin._id });
        }
    }
    for (const row of apptRows) await Appointment.create(row);
    console.log(`✅ Appointments: ${apptRows.length} created`);

    // ─── 6. INVOICES (18 invoices with varied statuses) ──────────────────────────
    const invoiceList = [
        // PAID invoices (older)
        { pat: patients[0], doc: admin, p: procs[0], days: 28, paid: 'full', mode: 'UPI', status: 'PAID' },
        { pat: patients[1], doc: admin, p: [procs[1], procs[4]], days: 25, paid: 'full', mode: 'CARD', status: 'PAID' },
        { pat: patients[5], doc: admin, p: procs[3], days: 22, paid: 'full', mode: 'CASH', status: 'PAID' },
        { pat: patients[11], doc: doc2, p: procs[9], days: 20, paid: 'full', mode: 'BANK_TRANSFER', status: 'PAID' },
        { pat: patients[2], doc: admin, p: [procs[1], procs[2]], days: 18, paid: 'full', mode: 'UPI', status: 'PAID' },
        { pat: patients[9], doc: doc3, p: procs[5], days: 15, paid: 'full', mode: 'CARD', status: 'PAID' },
        { pat: patients[4], doc: admin, p: procs[7], days: 14, paid: 'full', mode: 'CASH', status: 'PAID' },
        { pat: patients[3], doc: doc2, p: procs[11], days: 12, paid: 'full', mode: 'UPI', status: 'PAID' },
        // PARTIALLY_PAID
        { pat: patients[0], doc: admin, p: procs[3], days: 10, paid: 'partial', mode: 'CARD', status: 'PARTIALLY_PAID' },
        { pat: patients[13], doc: doc3, p: procs[6], days: 8, paid: 'partial', mode: 'BANK_TRANSFER', status: 'PARTIALLY_PAID' },
        // ISSUED (pending full payment)
        { pat: patients[1], doc: admin, p: [procs[3], procs[5]], days: 7, paid: 'none', mode: null, status: 'ISSUED' },
        { pat: patients[6], doc: doc2, p: procs[14], days: 5, paid: 'none', mode: null, status: 'ISSUED' },
        { pat: patients[10], doc: doc3, p: procs[8], days: 4, paid: 'none', mode: null, status: 'ISSUED' },
        // Recent PAID (this month — for dashboard MTD)
        { pat: patients[5], doc: admin, p: [procs[0], procs[1]], days: 3, paid: 'full', mode: 'UPI', status: 'PAID' },
        { pat: patients[2], doc: doc2, p: procs[4], days: 2, paid: 'full', mode: 'CARD', status: 'PAID' },
        { pat: patients[9], doc: admin, p: procs[7], days: 1, paid: 'full', mode: 'CASH', status: 'PAID' },
        // DRAFT (today)
        { pat: patients[4], doc: admin, p: procs[0], days: 0, paid: 'none', mode: null, status: 'DRAFT' },
        // CANCELLED
        { pat: patients[7], doc: doc3, p: procs[1], days: 6, paid: 'none', mode: null, status: 'CANCELLED' },
    ];

    let invCounter = 1;
    for (const inv of invoiceList) {
        const procList = Array.isArray(inv.p) ? inv.p : [inv.p];
        const lines = procList.map(p => buildLine(p._id, p.name, p.basePrice));
        const { subtotal, totalTax, grandTotal } = calcInvoice(lines);

        let paidAmount = 0, pendingAmount = grandTotal;
        const payments = [];
        const invDate = daysAgo(inv.days);

        if (inv.paid === 'full') {
            paidAmount = grandTotal; pendingAmount = 0;
            payments.push({ amount: grandTotal, mode: inv.mode, paidAt: invDate, recordedBy: admin._id });
        } else if (inv.paid === 'partial') {
            paidAmount = parseFloat((grandTotal * 0.4).toFixed(2));
            pendingAmount = parseFloat((grandTotal - paidAmount).toFixed(2));
            payments.push({ amount: paidAmount, mode: inv.mode, paidAt: invDate, recordedBy: admin._id });
        }

        const created = await Invoice.create({
            tenantId: tenant._id,
            invoiceNumber: `INV-2026-${String(invCounter++).padStart(4, '0')}`,
            patientId: inv.pat._id, doctorId: inv.doc._id, createdBy: admin._id,
            lineItems: lines, subtotal, totalDiscount: 0, totalTax, grandTotal,
            paidAmount, pendingAmount, status: inv.status, payments
        });
        // Set the createdAt to match the days-ago date
        await Invoice.updateOne({ _id: created._id }, { $set: { createdAt: invDate, updatedAt: invDate } });
    }
    console.log(`✅ Invoices: ${invoiceList.length} created`);

    // ─── 7. INVENTORY (20 items, some low stock) ──────────────────────────────────
    const inventoryData = [
        // Consumables - OK
        { name: 'Nitrile Gloves (Medium)', sku: 'NG-MED', cat: 'CONSUMABLES', unit: 'box', curr: 45, min: 10, cost: 350, sup: 'MedSupply Co.' },
        { name: 'Nitrile Gloves (Large)', sku: 'NG-LRG', cat: 'CONSUMABLES', unit: 'box', curr: 30, min: 10, cost: 350, sup: 'MedSupply Co.' },
        { name: 'Dental Syringe 3ml', sku: 'DS-3ML', cat: 'CONSUMABLES', unit: 'pack', curr: 200, min: 50, cost: 120, sup: 'MedSupply Co.' },
        { name: 'Saliva Ejector', sku: 'SE-001', cat: 'CONSUMABLES', unit: 'pack', curr: 150, min: 30, cost: 80, sup: 'Dental Depot' },
        { name: 'Disposable Masks (50pk)', sku: 'DM-050', cat: 'CONSUMABLES', unit: 'pack', curr: 20, min: 5, cost: 220, sup: 'MedSupply Co.' },
        // Consumables - LOW STOCK
        { name: 'Composite Resin (Shade A2)', sku: 'CR-A2', cat: 'MATERIALS', unit: 'syringe', curr: 3, min: 8, cost: 850, sup: 'Dental Products India' },
        { name: 'Composite Resin (Shade B2)', sku: 'CR-B2', cat: 'MATERIALS', unit: 'syringe', curr: 2, min: 8, cost: 850, sup: 'Dental Products India' },
        { name: 'GIC Luting Cement', sku: 'GIC-LUT', cat: 'MATERIALS', unit: 'pack', curr: 1, min: 3, cost: 1200, sup: 'Dental Products India' },
        // Materials - OK
        { name: 'Alginate Impression Mix', sku: 'AIM-001', cat: 'MATERIALS', unit: 'pack', curr: 15, min: 5, cost: 600, sup: 'Dental Products India' },
        { name: 'Zinc Phosphate Cement', sku: 'ZPC-001', cat: 'MATERIALS', unit: 'pack', curr: 10, min: 3, cost: 750, sup: 'Dental Products India' },
        // Equipment - OK
        { name: 'Dental Bur Set (FG)', sku: 'BUR-FG', cat: 'EQUIPMENT', unit: 'set', curr: 8, min: 3, cost: 1500, sup: 'Dental Tools Ltd' },
        { name: 'Dental Bur Set (RA)', sku: 'BUR-RA', cat: 'EQUIPMENT', unit: 'set', curr: 6, min: 3, cost: 1200, sup: 'Dental Tools Ltd' },
        { name: 'Prophy Angle (disposable)', sku: 'PA-001', cat: 'CONSUMABLES', unit: 'pack', curr: 60, min: 20, cost: 280, sup: 'Dental Depot' },
        // Equipment - LOW STOCK
        { name: 'Endodontic Files (21mm)', sku: 'EF-21', cat: 'EQUIPMENT', unit: 'pack', curr: 4, min: 5, cost: 2200, sup: 'Dental Tools Ltd' },
        { name: 'Rubber Dam Kit', sku: 'RD-KIT', cat: 'EQUIPMENT', unit: 'kit', curr: 2, min: 3, cost: 1800, sup: 'Dental Tools Ltd' },
        // Drugs
        { name: 'Lidocaine 2% Cartridges', sku: 'LID-2P', cat: 'DRUGS', unit: 'box', curr: 25, min: 10, cost: 450, sup: 'Pharma Direct' },
        { name: 'Articaine 4% Cartridges', sku: 'ART-4P', cat: 'DRUGS', unit: 'box', curr: 12, min: 8, cost: 580, sup: 'Pharma Direct' },
        // Drugs - LOW STOCK
        { name: 'Metronidazole 400mg', sku: 'METRO-400', cat: 'DRUGS', unit: 'strip', curr: 8, min: 20, cost: 45, sup: 'Pharma Direct' },
        // Sterilization
        { name: 'Sterilization Pouches', sku: 'SP-001', cat: 'CONSUMABLES', unit: 'pack', curr: 200, min: 50, cost: 180, sup: 'MedSupply Co.' },
        { name: 'Autoclave Tape', sku: 'AT-001', cat: 'CONSUMABLES', unit: 'roll', curr: 15, min: 5, cost: 120, sup: 'MedSupply Co.' },
    ];

    for (const item of inventoryData) {
        await InventoryItem.create({
            tenantId: tenant._id, name: item.name, sku: item.sku, category: item.cat,
            unit: item.unit, currentStock: item.curr, minimumStock: item.min,
            unitCost: item.cost, supplier: item.sup, isActive: true
        });
    }
    const lowStockCount = inventoryData.filter(i => i.curr <= i.min).length;
    console.log(`✅ Inventory: ${inventoryData.length} items (${lowStockCount} low stock)`);

    // ─── SUMMARY ─────────────────────────────────────────────────────────────────
    console.log('\n============================================');
    console.log('✅  DATABASE SEEDING COMPLETE  ✅');
    console.log('============================================');
    console.log('Login:     doctor@smilecenter.com / password123');
    console.log(`Patients:  ${patients.length}`);
    console.log(`Appts:     ${apptRows.length} (past + today + future)`);
    console.log(`Invoices:  ${invoiceList.length} (PAID/PARTIAL/ISSUED/DRAFT/CANCELLED)`);
    console.log(`Inventory: ${inventoryData.length} items, ${lowStockCount} low stock`);
    console.log('============================================\n');

    await mongoose.disconnect();
    process.exit(0);
};

seedDatabase().catch(err => { console.error(err); process.exit(1); });
