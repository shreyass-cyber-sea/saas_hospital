import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { InvoiceStatus, AppointmentStatus, TransactionType } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(from?: string, to?: string) {
    const start = from
      ? dayjs(from).startOf('day').toDate()
      : dayjs().subtract(30, 'day').startOf('day').toDate();
    const end = to ? dayjs(to).endOf('day').toDate() : new Date();
    return { start, end };
  }

  // ── Revenue: Daily ──────────────────────────────────────────────────────────
  async getRevenueDaily(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
        status: { not: InvoiceStatus.CANCELLED },
      },
      select: {
        createdAt: true,
        grandTotal: true,
        paidAmount: true,
        pendingAmount: true,
      },
    });

    const grouped: Record<string, { date: string; totalRevenue: number; collected: number; pending: number; totalInvoices: number }> = {};
    for (const inv of invoices) {
      const day = dayjs(inv.createdAt).format('YYYY-MM-DD');
      if (!grouped[day]) {
        grouped[day] = { date: day, totalRevenue: 0, collected: 0, pending: 0, totalInvoices: 0 };
      }
      grouped[day].totalRevenue += inv.grandTotal;
      grouped[day].collected += inv.paidAmount;
      grouped[day].pending += inv.pendingAmount;
      grouped[day].totalInvoices += 1;
    }

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── Revenue: Monthly ────────────────────────────────────────────────────────
  async getRevenueMonthly(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
        status: { not: InvoiceStatus.CANCELLED },
      },
      select: {
        createdAt: true,
        grandTotal: true,
        paidAmount: true,
        pendingAmount: true,
      },
    });

    const grouped: Record<string, { month: number; year: number; totalRevenue: number; collected: number; pending: number }> = {};
    for (const inv of invoices) {
      const key = `${dayjs(inv.createdAt).year()}-${dayjs(inv.createdAt).month()}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: dayjs(inv.createdAt).month() + 1,
          year: dayjs(inv.createdAt).year(),
          totalRevenue: 0,
          collected: 0,
          pending: 0,
        };
      }
      grouped[key].totalRevenue += inv.grandTotal;
      grouped[key].collected += inv.paidAmount;
      grouped[key].pending += inv.pendingAmount;
    }

    return Object.values(grouped).sort((a, b) => a.year - b.year || a.month - b.month);
  }

  // ── Revenue: By Doctor ──────────────────────────────────────────────────────
  async getRevenueByDoctor(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
        status: InvoiceStatus.PAID,
      },
      select: {
        doctorId: true,
        grandTotal: true,
        patientId: true,
        id: true,
      },
    });

    const grouped: Record<string, { doctorId: string; doctorName: string; totalRevenue: number; patientIds: Set<string>; totalInvoices: number }> = {};
    for (const inv of invoices) {
      if (!grouped[inv.doctorId]) {
        grouped[inv.doctorId] = { doctorId: inv.doctorId, doctorName: '', totalRevenue: 0, patientIds: new Set(), totalInvoices: 0 };
      }
      grouped[inv.doctorId].totalRevenue += inv.grandTotal;
      grouped[inv.doctorId].patientIds.add(inv.patientId);
      grouped[inv.doctorId].totalInvoices += 1;
    }

    // Fetch doctor names
    const doctorIds = Object.keys(grouped);
    if (doctorIds.length > 0) {
      const doctors = await this.prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true },
      });
      for (const doc of doctors) {
        if (grouped[doc.id]) {
          grouped[doc.id].doctorName = doc.name;
        }
      }
    }

    return Object.values(grouped).map(({ patientIds, ...rest }) => ({
      ...rest,
      totalPatients: patientIds.size,
    }));
  }

  // ── Appointments: Summary ───────────────────────────────────────────────────
  async getAppointmentsSummary(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
      },
      select: { status: true },
    });

    const summary: Record<string, number> = { total: appointments.length };
    for (const appt of appointments) {
      const key = appt.status.toLowerCase();
      summary[key] = (summary[key] || 0) + 1;
    }
    return summary;
  }

  // ── Appointments: No-Show ───────────────────────────────────────────────────
  async getNoShowAppointments(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
        status: AppointmentStatus.NO_SHOW,
      },
      include: {
        patient: { select: { name: true, phone: true, patientId: true } },
        doctor: { select: { name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // ── Patients: Growth ───────────────────────────────────────────────────────
  async getPatientGrowth(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    const patients = await this.prisma.patient.findMany({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true },
    });

    const grouped: Record<string, { month: number; year: number; newPatients: number }> = {};
    for (const p of patients) {
      const key = `${dayjs(p.createdAt).year()}-${dayjs(p.createdAt).month()}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: dayjs(p.createdAt).month() + 1,
          year: dayjs(p.createdAt).year(),
          newPatients: 0,
        };
      }
      grouped[key].newPatients += 1;
    }

    return Object.values(grouped).sort((a, b) => a.year - b.year || a.month - b.month);
  }

  // ── Patients: Pending Payments ─────────────────────────────────────────────
  async getPendingPayments(tenantId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        pendingAmount: { gt: 0 },
        status: { not: InvoiceStatus.CANCELLED },
      },
      select: {
        patientId: true,
        pendingAmount: true,
      },
    });

    const grouped: Record<string, { patientId: string; name: string; phone: string; totalPending: number; invoiceCount: number }> = {};
    for (const inv of invoices) {
      if (!grouped[inv.patientId]) {
        grouped[inv.patientId] = { patientId: inv.patientId, name: '', phone: '', totalPending: 0, invoiceCount: 0 };
      }
      grouped[inv.patientId].totalPending += inv.pendingAmount;
      grouped[inv.patientId].invoiceCount += 1;
    }

    // Fetch patient details
    const patientIds = Object.keys(grouped);
    if (patientIds.length > 0) {
      const patients = await this.prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, name: true, phone: true, patientId: true },
      });
      for (const pat of patients) {
        if (grouped[pat.id]) {
          grouped[pat.id].name = pat.name;
          grouped[pat.id].phone = pat.phone;
          grouped[pat.id].patientId = pat.patientId;
        }
      }
    }

    return Object.values(grouped).sort((a, b) => b.totalPending - a.totalPending);
  }

  // ── Inventory: Expenses ────────────────────────────────────────────────────
  async getInventoryExpenses(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    const transactions = await this.prisma.stockTransaction.findMany({
      where: {
        tenantId,
        type: TransactionType.PURCHASE,
        createdAt: { gte: start, lte: end },
      },
      include: {
        item: { select: { category: true } },
      },
    });

    const grouped: Record<string, { category: string; totalSpent: number; itemCount: number }> = {};
    for (const tx of transactions) {
      const cat = tx.item.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = { category: cat, totalSpent: 0, itemCount: 0 };
      grouped[cat].totalSpent += tx.totalCost;
    }

    return Object.values(grouped).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // ── Chairs: Utilization ────────────────────────────────────────────────────
  // Note: chairId field was not in the Prisma schema but was referenced in MongoDB
  // This will use appointment duration if available, otherwise estimate
  async getChairUtilization(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: start, lte: end },
        status: AppointmentStatus.COMPLETED,
      },
      select: { id: true, startTime: true, endTime: true, doctorId: true },
    });

    // Since we don't have chair tracking in the schema, use doctor as a proxy
    const grouped: Record<string, { chairId: string; totalAppointments: number; totalMinutes: number }> = {};
    for (const appt of appointments) {
      const chairId = appt.doctorId; // Using doctor as proxy for chair
      if (!grouped[chairId]) grouped[chairId] = { chairId, totalAppointments: 0, totalMinutes: 0 };
      grouped[chairId].totalAppointments += 1;
      // Estimate duration from start/end times
      if (appt.startTime && appt.endTime) {
        const [startH, startM] = appt.startTime.split(':').map(Number);
        const [endH, endM] = appt.endTime.split(':').map(Number);
        const mins = (endH * 60 + endM) - (startH * 60 + startM);
        grouped[chairId].totalMinutes += mins > 0 ? mins : 30;
      } else {
        grouped[chairId].totalMinutes += 30; // Default 30 min
      }
    }

    const daysInRange = Math.max(1, dayjs(end).diff(dayjs(start), 'day'));
    const availableMinutes = daysInRange * 11 * 60; // 11 hours/day

    return Object.values(grouped).map((g) => ({
      chairId: g.chairId,
      totalAppointments: g.totalAppointments,
      totalHours: Math.round((g.totalMinutes / 60) * 100) / 100,
      utilizationPercent: Math.round(((g.totalMinutes / availableMinutes) * 100) * 10) / 10,
    }));
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboard(tenantId: string) {
    const now = new Date();
    const todayStart = dayjs(now).startOf('day').toDate();
    const todayEnd   = dayjs(now).endOf('day').toDate();
    const monthStart = dayjs(now).startOf('month').toDate();
    const sevenDaysAgo = dayjs(now).subtract(6, 'day').startOf('day').toDate();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // All 12 queries run in parallel over a single pooled connection batch
    const [
      todayRevenueAgg,
      todayAppts,
      todayNewPatients,
      monthRevenueAgg,
      monthAppts,
      monthNewPatients,
      totalPatients,
      pendingAgg,
      lowStockItems,
      pendingLabCases,
      revenueChartInvoices,
      appointmentsByStatus,
    ] = await Promise.all([
      // Today revenue — aggregate avoids fetching all rows to JS
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { not: InvoiceStatus.CANCELLED },
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.appointment.count({
        where: { tenantId, date: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.patient.count({
        where: { tenantId, createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      // Month revenue — aggregate
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          createdAt: { gte: monthStart },
          status: { not: InvoiceStatus.CANCELLED },
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.appointment.count({
        where: { tenantId, date: { gte: monthStart } },
      }),
      this.prisma.patient.count({
        where: { tenantId, createdAt: { gte: monthStart } },
      }),
      this.prisma.patient.count({ where: { tenantId } }),
      // Pending payments — aggregate instead of fetching all rows
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          pendingAmount: { gt: 0 },
          status: { not: InvoiceStatus.CANCELLED },
        },
        _sum: { pendingAmount: true },
      }),
      // ✅ Fixed: use raw SQL for column comparison (currentStock < minimumStock)
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "InventoryItem"
        WHERE "tenantId" = ${tenantId}
          AND "isActive" = true
          AND "currentStock" < "minimumStock"
      `,
      this.prisma.labCase.count({
        where: {
          tenantId,
          status: { in: ['SENT', 'IN_PROGRESS'] },
        },
      }),
      // 7-day revenue chart — only fetch what we need
      this.prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: { gte: sevenDaysAgo, lte: todayEnd },
          status: { not: InvoiceStatus.CANCELLED },
        },
        select: { createdAt: true, paidAmount: true },
      }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { tenantId, date: { gte: monthStart } },
        _count: { status: true },
      }),
    ]);

    const todayRevenue = todayRevenueAgg._sum.paidAmount ?? 0;
    const monthRevenue = monthRevenueAgg._sum.paidAmount ?? 0;
    const pendingTotal = pendingAgg._sum.pendingAmount ?? 0;
    const lowStockCount = Number((lowStockItems as [{ count: bigint }])[0]?.count ?? 0);

    // Build 7-day chart
    const revenueByDate: Record<string, number> = {};
    for (const inv of revenueChartInvoices) {
      const day = dayjs(inv.createdAt).format('YYYY-MM-DD');
      revenueByDate[day] = (revenueByDate[day] || 0) + inv.paidAmount;
    }

    const revenueChart = Array.from({ length: 7 }, (_, i) => {
      const d = dayjs(now).subtract(6 - i, 'day');
      return {
        name: dayNames[d.day()],
        revenue: revenueByDate[d.format('YYYY-MM-DD')] ?? 0,
      };
    });

    const apptStatusMap = appointmentsByStatus.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    return {
      todayRevenue,
      todayAppointments: todayAppts,
      todayNewPatients,
      monthRevenue,
      monthAppointments: monthAppts,
      monthNewPatients,
      totalPatients,
      pendingPaymentsTotal: pendingTotal,
      lowStockCount,
      pendingLabCases,
      revenueChart,
      appointmentsByStatus: apptStatusMap,
    };
  }
}