const { PrismaClient, Role, Gender, AppointmentStatus, InvoiceStatus, PaymentMode } = require('@prisma/client');

const prisma = new PrismaClient();

const SAMPLE = {
  doctors: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Dr. Aanya Sharma',
      email: 'dr.aanya.sample@smileclinic.demo',
      phone: '+91 90000 00001',
      profile: {
        specialization: 'Orthodontics',
        specializations: ['Orthodontics'],
        experience: 6,
        consultationFee: 700,
      },
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Dr. Rohan Mehta',
      email: 'dr.rohan.sample@smileclinic.demo',
      phone: '+91 90000 00002',
      profile: {
        specialization: 'Endodontics',
        specializations: ['Endodontics'],
        experience: 9,
        consultationFee: 900,
      },
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Dr. Isha Verma',
      email: 'dr.isha.sample@smileclinic.demo',
      phone: '+91 90000 00003',
      profile: {
        specialization: 'Pediatric Dentistry',
        specializations: ['Pediatric Dentistry'],
        experience: 5,
        consultationFee: 650,
      },
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Dr. Kunal Rao',
      email: 'dr.kunal.sample@smileclinic.demo',
      phone: '+91 90000 00004',
      profile: {
        specialization: 'Oral Surgery',
        specializations: ['Oral Surgery'],
        experience: 11,
        consultationFee: 1200,
      },
    },
  ],
  patients: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      patientId: 'SMP-PAT-001',
      name: 'Neha Kapoor',
      email: 'neha.kapoor.demo@example.com',
      phone: '+91 98111 11111',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1994-07-14'),
      address: 'Bandra West, Mumbai',
      bloodGroup: 'B+',
      medicalHistory: ['Mild sensitivity', 'Seasonal allergies'],
      emergencyContact: {
        name: 'Rohit Kapoor',
        relation: 'Spouse',
        phone: '+91 98222 22222',
      },
      totalVisits: 3,
      lastVisit: new Date(),
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      patientId: 'SMP-PAT-002',
      name: 'Arjun Nair',
      email: 'arjun.nair.demo@example.com',
      phone: '+91 98333 33333',
      gender: Gender.MALE,
      dateOfBirth: new Date('1988-03-22'),
      address: 'Powai, Mumbai',
      bloodGroup: 'O+',
      medicalHistory: ['Diabetes'],
      emergencyContact: {
        name: 'Maya Nair',
        relation: 'Sister',
        phone: '+91 98444 44444',
      },
      totalVisits: 2,
      lastVisit: new Date(),
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      patientId: 'SMP-PAT-003',
      name: 'Sara Fernandes',
      email: 'sara.fernandes.demo@example.com',
      phone: '+91 98555 55555',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2001-11-05'),
      address: 'Andheri East, Mumbai',
      bloodGroup: 'A+',
      medicalHistory: ['Braces history'],
      emergencyContact: {
        name: 'Helen Fernandes',
        relation: 'Mother',
        phone: '+91 98666 66666',
      },
      totalVisits: 1,
      lastVisit: new Date(),
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      patientId: 'SMP-PAT-004',
      name: 'Vikram Desai',
      email: 'vikram.desai.demo@example.com',
      phone: '+91 98777 77777',
      gender: Gender.MALE,
      dateOfBirth: new Date('1979-09-18'),
      address: 'Thane West, Mumbai',
      bloodGroup: 'AB+',
      medicalHistory: ['Hypertension'],
      emergencyContact: {
        name: 'Nisha Desai',
        relation: 'Wife',
        phone: '+91 98888 88888',
      },
      totalVisits: 4,
      lastVisit: new Date(),
    },
  ],
  procedures: [
    {
      id: '55555555-5555-4555-8555-555555555551',
      name: 'Dental Cleaning',
      code: 'PROC-CLEAN',
      category: 'General',
      defaultPrice: 1200,
      defaultDuration: 30,
    },
    {
      id: '55555555-5555-4555-8555-555555555552',
      name: 'Root Canal Treatment',
      code: 'PROC-RCT',
      category: 'Endodontics',
      defaultPrice: 6500,
      defaultDuration: 90,
    },
    {
      id: '55555555-5555-4555-8555-555555555553',
      name: 'Teeth Whitening',
      code: 'PROC-WHITE',
      category: 'Cosmetic',
      defaultPrice: 8500,
      defaultDuration: 60,
    },
    {
      id: '55555555-5555-4555-8555-555555555554',
      name: 'Braces Consultation',
      code: 'PROC-BRACES',
      category: 'Orthodontics',
      defaultPrice: 1500,
      defaultDuration: 45,
    },
  ],
};

function addDays(days, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function isoTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function seedDoctors(tenantId) {
  for (const doctor of SAMPLE.doctors) {
    await prisma.user.upsert({
      where: { email: doctor.email },
      update: {
        name: doctor.name,
        phone: doctor.phone,
        role: Role.DOCTOR,
        isActive: true,
        tenantId,
        doctorProfile: doctor.profile,
      },
      create: {
        id: doctor.id,
        tenantId,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        role: Role.DOCTOR,
        isActive: true,
        doctorProfile: doctor.profile,
      },
    });
  }
}

async function seedPatients(tenantId) {
  for (const patient of SAMPLE.patients) {
    await prisma.patient.upsert({
      where: { patientId: patient.patientId },
      update: {
        tenantId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        address: patient.address,
        bloodGroup: patient.bloodGroup,
        medicalHistory: patient.medicalHistory,
        emergencyContact: patient.emergencyContact,
        totalVisits: patient.totalVisits,
        lastVisit: patient.lastVisit,
      },
      create: {
        id: patient.id,
        tenantId,
        patientId: patient.patientId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        address: patient.address,
        bloodGroup: patient.bloodGroup,
        medicalHistory: patient.medicalHistory,
        emergencyContact: patient.emergencyContact,
        totalVisits: patient.totalVisits,
        lastVisit: patient.lastVisit,
      },
    });
  }
}

async function seedProcedures(tenantId) {
  for (const procedure of SAMPLE.procedures) {
    await prisma.procedure.upsert({
      where: { id: procedure.id },
      update: {
        tenantId,
        name: procedure.name,
        code: procedure.code,
        category: procedure.category,
        defaultPrice: procedure.defaultPrice,
        defaultDuration: procedure.defaultDuration,
        taxable: true,
        isActive: true,
      },
      create: {
        id: procedure.id,
        tenantId,
        name: procedure.name,
        code: procedure.code,
        category: procedure.category,
        defaultPrice: procedure.defaultPrice,
        defaultDuration: procedure.defaultDuration,
        taxable: true,
        isActive: true,
      },
    });
  }
}

async function seedAppointmentsAndNotes(tenantId, adminUserId) {
  const appointments = [
    {
      id: '66666666-6666-4666-8666-666666666661',
      patientId: SAMPLE.patients[0].id,
      doctorId: SAMPLE.doctors[0].id,
      date: addDays(-2, 10, 0),
      status: AppointmentStatus.COMPLETED,
      type: 'Consultation',
      chiefComplaint: 'Tooth sensitivity on cold drinks',
    },
    {
      id: '66666666-6666-4666-8666-666666666662',
      patientId: SAMPLE.patients[1].id,
      doctorId: SAMPLE.doctors[1].id,
      date: addDays(0, 11, 0),
      status: AppointmentStatus.CONFIRMED,
      type: 'Root Canal Review',
      chiefComplaint: 'Pain in lower molar',
    },
    {
      id: '66666666-6666-4666-8666-666666666663',
      patientId: SAMPLE.patients[2].id,
      doctorId: SAMPLE.doctors[2].id,
      date: addDays(1, 15, 30),
      status: AppointmentStatus.SCHEDULED,
      type: 'Pediatric Consultation',
      chiefComplaint: 'Routine dental check-up',
    },
    {
      id: '66666666-6666-4666-8666-666666666664',
      patientId: SAMPLE.patients[3].id,
      doctorId: SAMPLE.doctors[3].id,
      date: addDays(2, 17, 0),
      status: AppointmentStatus.SCHEDULED,
      type: 'Extraction Review',
      chiefComplaint: 'Wisdom tooth pain',
    },
  ];

  for (const appointment of appointments) {
    const startTime = isoTime(appointment.date);
    const endDate = new Date(appointment.date);
    endDate.setMinutes(endDate.getMinutes() + 30);

    await prisma.appointment.upsert({
      where: { id: appointment.id },
      update: {
        tenantId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: appointment.date,
        startTime,
        endTime: isoTime(endDate),
        status: appointment.status,
        type: appointment.type,
        chiefComplaint: appointment.chiefComplaint,
        createdByUserId: adminUserId,
        tokenNumber: 1,
      },
      create: {
        id: appointment.id,
        tenantId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: appointment.date,
        startTime,
        endTime: isoTime(endDate),
        status: appointment.status,
        type: appointment.type,
        chiefComplaint: appointment.chiefComplaint,
        createdByUserId: adminUserId,
        tokenNumber: 1,
      },
    });
  }

  const notes = [
    {
      id: '77777777-7777-4777-8777-777777777771',
      patientId: SAMPLE.patients[0].id,
      doctorId: SAMPLE.doctors[0].id,
      appointmentId: appointments[0].id,
      chiefComplaint: 'Tooth sensitivity on cold drinks',
      findings: 'Mild enamel wear with no visible cavity.',
      diagnosis: 'Dentin hypersensitivity',
      treatmentPlan: 'Desensitizing toothpaste and fluoride application',
      prescriptions: [
        {
          medicine: 'Potassium Nitrate Toothpaste',
          dosage: 'Pea-sized amount',
          frequency: 'Twice daily',
          duration: '30 days',
        },
      ],
    },
    {
      id: '77777777-7777-4777-8777-777777777772',
      patientId: SAMPLE.patients[1].id,
      doctorId: SAMPLE.doctors[1].id,
      appointmentId: appointments[1].id,
      chiefComplaint: 'Pain in lower molar',
      findings: 'Deep caries approaching pulp in tooth 46.',
      diagnosis: 'Irreversible pulpitis',
      treatmentPlan: 'Schedule root canal treatment',
      prescriptions: [
        {
          medicine: 'Ibuprofen 400mg',
          dosage: '1 tablet',
          frequency: 'After meals',
          duration: '3 days',
        },
      ],
    },
  ];

  for (const note of notes) {
    await prisma.clinicalNote.upsert({
      where: { id: note.id },
      update: {
        tenantId,
        patientId: note.patientId,
        doctorId: note.doctorId,
        appointmentId: note.appointmentId,
        chiefComplaint: note.chiefComplaint,
        findings: note.findings,
        diagnosis: note.diagnosis,
        treatmentPlan: note.treatmentPlan,
        prescriptions: note.prescriptions,
        vitals: { bp: '120/80', pulse: 76 },
        clinicalFindings: { seeded: true },
      },
      create: {
        id: note.id,
        tenantId,
        patientId: note.patientId,
        doctorId: note.doctorId,
        appointmentId: note.appointmentId,
        chiefComplaint: note.chiefComplaint,
        findings: note.findings,
        diagnosis: note.diagnosis,
        treatmentPlan: note.treatmentPlan,
        prescriptions: note.prescriptions,
        vitals: { bp: '120/80', pulse: 76 },
        clinicalFindings: { seeded: true },
      },
    });
  }

  await prisma.doctorLeave.upsert({
    where: { id: '88888888-8888-4888-8888-888888888881' },
    update: {
      tenantId,
      doctorId: SAMPLE.doctors[2].id,
      date: addDays(3, 0, 0),
      reason: 'Medical conference',
    },
    create: {
      id: '88888888-8888-4888-8888-888888888881',
      tenantId,
      doctorId: SAMPLE.doctors[2].id,
      date: addDays(3, 0, 0),
      reason: 'Medical conference',
    },
  });
}

async function seedBilling(tenantId, adminUserId) {
  const invoices = [
    {
      id: '99999999-9999-4999-8999-999999999991',
      invoiceNumber: 'SMP-INV-001',
      patientId: SAMPLE.patients[0].id,
      doctorId: SAMPLE.doctors[0].id,
      appointmentId: '66666666-6666-4666-8666-666666666661',
      status: InvoiceStatus.PAID,
      subtotal: 1200,
      totalTax: 216,
      grandTotal: 1416,
      paidAmount: 1416,
      pendingAmount: 0,
      createdAt: addDays(-2, 12, 0),
    },
    {
      id: '99999999-9999-4999-8999-999999999992',
      invoiceNumber: 'SMP-INV-002',
      patientId: SAMPLE.patients[1].id,
      doctorId: SAMPLE.doctors[1].id,
      appointmentId: '66666666-6666-4666-8666-666666666662',
      status: InvoiceStatus.PARTIALLY_PAID,
      subtotal: 6500,
      totalTax: 1170,
      grandTotal: 7670,
      paidAmount: 3000,
      pendingAmount: 4670,
      createdAt: addDays(0, 12, 0),
    },
    {
      id: '99999999-9999-4999-8999-999999999993',
      invoiceNumber: 'SMP-INV-003',
      patientId: SAMPLE.patients[3].id,
      doctorId: SAMPLE.doctors[3].id,
      appointmentId: null,
      status: InvoiceStatus.ISSUED,
      subtotal: 8500,
      totalTax: 1530,
      grandTotal: 10030,
      paidAmount: 0,
      pendingAmount: 10030,
      createdAt: addDays(-1, 16, 0),
    },
  ];

  for (const invoice of invoices) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: invoice.invoiceNumber },
      update: {
        tenantId,
        patientId: invoice.patientId,
        doctorId: invoice.doctorId,
        appointmentId: invoice.appointmentId,
        status: invoice.status,
        subtotal: invoice.subtotal,
        totalDiscount: 0,
        totalTax: invoice.totalTax,
        grandTotal: invoice.grandTotal,
        paidAmount: invoice.paidAmount,
        pendingAmount: invoice.pendingAmount,
        advanceUsed: 0,
        createdByUserId: adminUserId,
        notes: 'Seeded sample invoice',
      },
      create: {
        id: invoice.id,
        tenantId,
        patientId: invoice.patientId,
        doctorId: invoice.doctorId,
        appointmentId: invoice.appointmentId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        subtotal: invoice.subtotal,
        totalDiscount: 0,
        totalTax: invoice.totalTax,
        grandTotal: invoice.grandTotal,
        paidAmount: invoice.paidAmount,
        pendingAmount: invoice.pendingAmount,
        advanceUsed: 0,
        createdByUserId: adminUserId,
        notes: 'Seeded sample invoice',
        createdAt: invoice.createdAt,
      },
    });
  }

  const items = [
    {
      id: '12121212-1212-4121-8121-121212121211',
      invoiceId: invoices[0].id,
      procedureId: SAMPLE.procedures[0].id,
      description: 'Dental Cleaning',
      unitPrice: 1200,
      taxAmount: 216,
      totalAmount: 1416,
    },
    {
      id: '12121212-1212-4121-8121-121212121212',
      invoiceId: invoices[1].id,
      procedureId: SAMPLE.procedures[1].id,
      description: 'Root Canal Treatment',
      unitPrice: 6500,
      taxAmount: 1170,
      totalAmount: 7670,
    },
    {
      id: '12121212-1212-4121-8121-121212121213',
      invoiceId: invoices[2].id,
      procedureId: SAMPLE.procedures[2].id,
      description: 'Teeth Whitening',
      unitPrice: 8500,
      taxAmount: 1530,
      totalAmount: 10030,
    },
  ];

  for (const item of items) {
    await prisma.invoiceItem.upsert({
      where: { id: item.id },
      update: {
        invoiceId: item.invoiceId,
        procedureId: item.procedureId,
        description: item.description,
        quantity: 1,
        unitPrice: item.unitPrice,
        discount: 0,
        discountPercent: 0,
        taxPercent: 18,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount,
      },
      create: {
        id: item.id,
        invoiceId: item.invoiceId,
        procedureId: item.procedureId,
        description: item.description,
        quantity: 1,
        unitPrice: item.unitPrice,
        discount: 0,
        discountPercent: 0,
        taxPercent: 18,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount,
      },
    });
  }

  const payments = [
    {
      id: '13131313-1313-4131-8131-131313131311',
      invoiceId: invoices[0].id,
      amount: 1416,
      mode: PaymentMode.UPI,
      reference: 'UPI-SAMPLE-001',
    },
    {
      id: '13131313-1313-4131-8131-131313131312',
      invoiceId: invoices[1].id,
      amount: 3000,
      mode: PaymentMode.CARD,
      reference: 'CARD-SAMPLE-002',
    },
  ];

  for (const payment of payments) {
    await prisma.invoicePayment.upsert({
      where: { id: payment.id },
      update: {
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        mode: payment.mode,
        reference: payment.reference,
        recordedByUserId: adminUserId,
      },
      create: {
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        mode: payment.mode,
        reference: payment.reference,
        recordedByUserId: adminUserId,
      },
    });
  }

  await prisma.advancePayment.upsert({
    where: { id: '14141414-1414-4141-8141-141414141411' },
    update: {
      tenantId,
      patientId: SAMPLE.patients[2].id,
      amount: 2000,
      balanceAmount: 1500,
      usedAmount: 500,
      mode: PaymentMode.CASH,
      notes: 'Advance retained for braces treatment',
    },
    create: {
      id: '14141414-1414-4141-8141-141414141411',
      tenantId,
      patientId: SAMPLE.patients[2].id,
      amount: 2000,
      balanceAmount: 1500,
      usedAmount: 500,
      mode: PaymentMode.CASH,
      notes: 'Advance retained for braces treatment',
    },
  });
}

async function seedDocuments(tenantId) {
  const docs = [
    {
      id: '15151515-1515-4151-8151-151515151511',
      patientId: SAMPLE.patients[0].id,
      name: 'Sensitivity Prescription.pdf',
      category: 'prescription',
      fileUrl: 'https://example.com/demo/sensitivity-prescription.pdf',
      fileType: 'application/pdf',
      fileSize: 84231,
      notes: 'Seeded sample document',
    },
    {
      id: '15151515-1515-4151-8151-151515151512',
      patientId: SAMPLE.patients[1].id,
      name: 'IOPA X-Ray.png',
      category: 'xray',
      fileUrl: 'https://example.com/demo/iopa-xray.png',
      fileType: 'image/png',
      fileSize: 124400,
      notes: 'Seeded sample x-ray',
    },
  ];

  for (const doc of docs) {
    await prisma.patientDocument.upsert({
      where: { id: doc.id },
      update: {
        tenantId,
        patientId: doc.patientId,
        name: doc.name,
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        notes: doc.notes,
      },
      create: {
        id: doc.id,
        tenantId,
        patientId: doc.patientId,
        name: doc.name,
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        notes: doc.notes,
      },
    });
  }
}

async function main() {
  const emailArg = process.argv.find((arg) => arg.startsWith('--email='));
  const targetEmail = emailArg ? emailArg.split('=')[1] : 'karthik5kashyapks@gmail.com';

  const admin = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: { tenant: true },
  });

  if (!admin) {
    throw new Error(`No app user found for ${targetEmail}.`);
  }

  if (!admin.tenantId) {
    throw new Error(`User ${targetEmail} is not attached to a tenant.`);
  }

  await seedDoctors(admin.tenantId);
  await seedPatients(admin.tenantId);
  await seedProcedures(admin.tenantId);
  await seedAppointmentsAndNotes(admin.tenantId, admin.id);
  await seedBilling(admin.tenantId, admin.id);
  await seedDocuments(admin.tenantId);

  const [doctorCount, patientCount, appointmentCount, invoiceCount, noteCount] =
    await Promise.all([
      prisma.user.count({ where: { tenantId: admin.tenantId, role: Role.DOCTOR } }),
      prisma.patient.count({ where: { tenantId: admin.tenantId } }),
      prisma.appointment.count({ where: { tenantId: admin.tenantId } }),
      prisma.invoice.count({ where: { tenantId: admin.tenantId } }),
      prisma.clinicalNote.count({ where: { tenantId: admin.tenantId } }),
    ]);

  console.log(`Seeded sample data for ${targetEmail} (${admin.tenant.name})`);
  console.log(`Doctors: ${doctorCount}`);
  console.log(`Patients: ${patientCount}`);
  console.log(`Appointments: ${appointmentCount}`);
  console.log(`Invoices: ${invoiceCount}`);
  console.log(`Clinical notes: ${noteCount}`);
  console.log('Note: sample doctors are app records for scheduling and billing. They are not Supabase auth login accounts.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
