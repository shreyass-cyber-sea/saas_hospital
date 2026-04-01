import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from '../billing/invoice.schema';
import { Appointment } from '../appointments/appointment.schema';
import { Patient } from '../patients/patient.schema';
import { StockTransaction } from '../inventory/inventory.schema';
import { InventoryItem } from '../inventory/inventory.schema';
import { LabCase } from '../inventory/inventory.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<any>,
    @InjectModel(Appointment.name) private appointmentModel: Model<any>,
    @InjectModel(Patient.name) private patientModel: Model<any>,
    @InjectModel(StockTransaction.name) private stockTxModel: Model<any>,
    @InjectModel(InventoryItem.name) private inventoryItemModel: Model<any>,
    @InjectModel(LabCase.name) private labCaseModel: Model<any>,
  ) {}

  private getDateRange(from?: string, to?: string) {
    const start = from
      ? new Date(from)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = to ? new Date(to + 'T23:59:59') : new Date();
    return { start, end };
  }

  // ── Revenue: Daily ──────────────────────────────────────────────────────────
  async getRevenueDaily(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    return this.invoiceModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'CANCELLED' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalRevenue: { $sum: '$grandTotal' },
          collected: { $sum: '$paidAmount' },
          pending: { $sum: '$pendingAmount' },
          totalInvoices: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          totalRevenue: 1,
          collected: 1,
          pending: 1,
          totalInvoices: 1,
          _id: 0,
        },
      },
    ]);
  }

  // ── Revenue: Monthly ────────────────────────────────────────────────────────
  async getRevenueMonthly(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    return this.invoiceModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'CANCELLED' },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          totalRevenue: { $sum: '$grandTotal' },
          collected: { $sum: '$paidAmount' },
          pending: { $sum: '$pendingAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          totalRevenue: 1,
          collected: 1,
          pending: 1,
          _id: 0,
        },
      },
    ]);
  }

  // ── Revenue: By Doctor ──────────────────────────────────────────────────────
  async getRevenueByDoctor(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    return this.invoiceModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          createdAt: { $gte: start, $lte: end },
          status: 'PAID',
        },
      },
      {
        $group: {
          _id: '$doctorId',
          totalRevenue: { $sum: '$grandTotal' },
          totalPatients: { $addToSet: '$patientId' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          doctorId: '$_id',
          doctorName: '$doctor.name',
          totalRevenue: 1,
          totalPatients: { $size: '$totalPatients' },
          totalInvoices: 1,
          _id: 0,
        },
      },
    ]);
  }

  // ── Appointments: Summary ───────────────────────────────────────────────────
  async getAppointmentsSummary(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    const data = await this.appointmentModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary: Record<string, number> = { total: 0 };
    for (const row of data) {
      summary[row._id.toLowerCase()] = row.count;
      summary.total += row.count;
    }
    return summary;
  }

  // ── Appointments: No-Show ───────────────────────────────────────────────────
  async getNoShowAppointments(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    return this.appointmentModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        date: { $gte: start, $lte: end },
        status: 'NO_SHOW',
      })
      .populate('patientId', 'name phone patientId')
      .populate('doctorId', 'name email')
      .sort({ date: -1 });
  }

  // ── Patients: Growth ───────────────────────────────────────────────────────
  async getPatientGrowth(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    return this.patientModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          newPatients: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          newPatients: 1,
          _id: 0,
        },
      },
    ]);
  }

  // ── Patients: Pending Payments ─────────────────────────────────────────────
  async getPendingPayments(tenantId: string) {
    return this.invoiceModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          pendingAmount: { $gt: 0 },
          status: { $ne: 'CANCELLED' },
        },
      },
      {
        $group: {
          _id: '$patientId',
          totalPending: { $sum: '$pendingAmount' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: '_id',
          as: 'patient',
        },
      },
      { $unwind: '$patient' },
      {
        $project: {
          patientId: '$patient.patientId',
          name: '$patient.name',
          phone: '$patient.phone',
          totalPending: 1,
          invoiceCount: 1,
          _id: 0,
        },
      },
      { $sort: { totalPending: -1 } },
    ]);
  }

  // ── Inventory: Expenses ────────────────────────────────────────────────────
  async getInventoryExpenses(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    return this.stockTxModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          type: 'PURCHASE',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: 'inventoryitems',
          localField: 'itemId',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: '$item' },
      {
        $group: {
          _id: '$item.category',
          totalSpent: { $sum: '$totalCost' },
          itemCount: { $addToSet: '$itemId' },
        },
      },
      {
        $project: {
          category: '$_id',
          totalSpent: 1,
          itemCount: { $size: '$itemCount' },
          _id: 0,
        },
      },
      { $sort: { totalSpent: -1 } },
    ]);
  }

  // ── Chairs: Utilization ────────────────────────────────────────────────────
  async getChairUtilization(tenantId: string, from?: string, to?: string) {
    const { start, end } = this.getDateRange(from, to);
    return this.appointmentModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          date: { $gte: start, $lte: end },
          chairId: { $exists: true, $ne: null },
          status: 'COMPLETED',
        },
      },
      {
        $group: {
          _id: '$chairId',
          totalAppointments: { $sum: 1 },
          totalMinutes: { $sum: '$duration' },
        },
      },
      {
        $project: {
          chairId: '$_id',
          totalAppointments: 1,
          totalHours: { $round: [{ $divide: ['$totalMinutes', 60] }, 2] },
          // Available hours = working days in range * 11 hours/day
          utilizationPercent: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$totalMinutes', { $multiply: [30, 11, 60] }] },
                  100,
                ],
              },
              1,
            ],
          },
          _id: 0,
        },
      },
    ]);
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboard(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 7-day window for revenue chart
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      [todayRevRow],
      todayAppts,
      todayNewPatients,
      [monthRevRow],
      monthAppts,
      monthNewPatients,
      totalPatients,
      [pendingRow],
      lowStockCount,
      pendingLabCases,
      revenueChartRaw,
      appointmentsByStatusRaw,
    ] = await Promise.all([
      this.invoiceModel.aggregate([
        {
          $match: {
            tenantId: tid,
            createdAt: { $gte: todayStart, $lte: todayEnd },
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      this.appointmentModel.countDocuments({
        tenantId: tid,
        date: { $gte: todayStart, $lte: todayEnd },
      }),
      this.patientModel.countDocuments({
        tenantId: tid,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      this.invoiceModel.aggregate([
        {
          $match: {
            tenantId: tid,
            createdAt: { $gte: monthStart },
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      this.appointmentModel.countDocuments({
        tenantId: tid,
        date: { $gte: monthStart },
      }),
      this.patientModel.countDocuments({
        tenantId: tid,
        createdAt: { $gte: monthStart },
      }),
      this.patientModel.countDocuments({ tenantId: tid }),
      this.invoiceModel.aggregate([
        {
          $match: {
            tenantId: tid,
            pendingAmount: { $gt: 0 },
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: null, total: { $sum: '$pendingAmount' } } },
      ]),
      this.inventoryItemModel.countDocuments({
        tenantId: tid,
        isActive: true,
        $expr: { $lte: ['$currentStock', '$minimumStock'] },
      }),
      this.labCaseModel.countDocuments({
        tenantId: tid,
        status: { $in: ['SENT', 'IN_PROGRESS'] },
      }),
      // 7-day daily revenue chart
      this.invoiceModel.aggregate([
        {
          $match: {
            tenantId: tid,
            createdAt: { $gte: sevenDaysAgo, $lte: todayEnd },
            status: { $ne: 'CANCELLED' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$paidAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Appointments by status (all time for current month)
      this.appointmentModel.aggregate([
        {
          $match: {
            tenantId: tid,
            date: { $gte: monthStart },
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Build 7-day chart with day labels (Mon, Tue, etc.)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDate: Record<string, number> = {};
    for (const row of revenueChartRaw) {
      revenueByDate[row._id] = row.revenue;
    }
    const revenueChart: { name: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revenueChart.push({
        name: dayNames[d.getDay()],
        revenue: revenueByDate[dateStr] ?? 0,
      });
    }

    // Build appointments by status array
    const appointmentsByStatus = appointmentsByStatusRaw.map((row: { _id: string; count: number }) => ({
      status: row._id.replace(/_/g, ' '),
      count: row.count,
    }));

    return {
      todayRevenue: todayRevRow?.total ?? 0,
      todayAppointments: todayAppts,
      todayNewPatients,
      monthRevenue: monthRevRow?.total ?? 0,
      monthAppointments: monthAppts,
      monthNewPatients,
      totalPatients,
      pendingPaymentsTotal: pendingRow?.total ?? 0,
      lowStockCount,
      pendingLabCases,
      revenueChart,
      appointmentsByStatus,
    };
  }
}
