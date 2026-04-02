import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useLabCases,
  useCreateLabCase,
  useUpdateLabCase,
} from '../../hooks/useInventory';
import { usePatients } from '../../hooks/usePatients';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LabCase {
  id: string;
  caseType: string;
  description?: string;
  shade?: string;
  labName?: string;
  sentDate: string;
  expectedDate?: string;
  deliveredDate?: string;
  status: string;
  cost: number;
  notes?: string;
  patient?: { id: string; name: string };
  doctor?: { id: string; name: string };
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  SENT:        'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RECEIVED:    'bg-green-100 text-green-700',
  REMADE:      'bg-red-100 text-red-700',
};

const STATUS_NEXT: Record<string, string | null> = {
  SENT:        'IN_PROGRESS',
  IN_PROGRESS: 'RECEIVED',
  RECEIVED:    null,
  REMADE:      null,
};

const CASE_TYPES = ['crown', 'bridge', 'denture', 'aligner', 'other'];
const ALL_STATUSES = ['', 'SENT', 'IN_PROGRESS', 'RECEIVED', 'REMADE'];

// ─── Empty Form ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  caseType: 'crown',
  description: '',
  shade: '',
  labName: '',
  expectedDate: '',
  cost: '',
  notes: '',
  patientId: '',
};

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateLabCaseModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const createMutation = useCreateLabCase();
  const { data: patients = [] } = usePatients({ limit: 100 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        ...form,
        cost: parseFloat(form.cost) || 0,
        patientId: form.patientId || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">New Lab Case</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Case Type *</label>
              <select
                required
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.caseType}
                onChange={(e) => setForm((f) => ({ ...f, caseType: e.target.value }))}
              >
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lab Name</label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. City Dental Lab"
                value={form.labName}
                onChange={(e) => setForm((f) => ({ ...f, labName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shade</label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. A2"
                value={form.shade}
                onChange={(e) => setForm((f) => ({ ...f, shade: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Return Date</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.expectedDate}
                onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient (optional)</label>
              <select
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.patientId}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">— None —</option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Additional details…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Internal notes…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Lab Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Lab Case Row ─────────────────────────────────────────────────────────────
function LabCaseRow({ labCase }: { labCase: LabCase }) {
  const navigate = useNavigate();
  const updateMutation = useUpdateLabCase(labCase.id);
  const nextStatus = STATUS_NEXT[labCase.status];

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleAdvance = () => {
    if (!nextStatus) return;
    const extra = nextStatus === 'RECEIVED' ? { deliveredDate: new Date().toISOString() } : {};
    updateMutation.mutate({ status: nextStatus, ...extra });
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-5 py-3.5">
        <p className="font-medium text-slate-800 capitalize">{labCase.caseType}</p>
        {labCase.shade && <p className="text-xs text-slate-400 mt-0.5">Shade: {labCase.shade}</p>}
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-600">{labCase.labName || '—'}</td>
      <td className="px-5 py-3.5">
        {labCase.patient ? (
          <button
            onClick={() => navigate(`/patients/${labCase.patient!.id}`)}
            className="text-sm text-indigo-600 hover:underline"
          >
            {labCase.patient.name}
          </button>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-600">{fmt(labCase.sentDate)}</td>
      <td className="px-5 py-3.5 text-sm text-slate-600">
        {labCase.expectedDate ? fmt(labCase.expectedDate) : '—'}
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            STATUS_STYLES[labCase.status] ?? 'bg-slate-100 text-slate-500'
          }`}
        >
          {labCase.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-700 font-medium">
        ₹{labCase.cost.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
      </td>
      <td className="px-5 py-3.5">
        {nextStatus && (
          <button
            onClick={handleAdvance}
            disabled={updateMutation.isPending}
            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {updateMutation.isPending ? '…' : `→ ${nextStatus.replace('_', ' ')}`}
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function LabCases() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: labCases = [], isLoading, isError } = useLabCases({ status: statusFilter || undefined });

  const stats = {
    total: labCases.length,
    sent: labCases.filter((c: LabCase) => c.status === 'SENT').length,
    inProgress: labCases.filter((c: LabCase) => c.status === 'IN_PROGRESS').length,
    received: labCases.filter((c: LabCase) => c.status === 'RECEIVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Cases</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track dental lab work sent out and returned</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Lab Case
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Sent',       value: stats.sent,       color: 'bg-blue-50 text-blue-700' },
          { label: 'In Progress',value: stats.inProgress, color: 'bg-amber-50 text-amber-700' },
          { label: 'Received',   value: stats.received,   color: 'bg-green-50 text-green-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 font-medium">Filter by status:</span>
        <div className="flex gap-2 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            Failed to load lab cases. Please try again.
          </div>
        ) : labCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-2xl">🦷</div>
            <p className="text-slate-500 font-medium">No lab cases found</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-indigo-600 text-sm hover:underline"
            >
              Create the first one
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Type / Shade', 'Lab', 'Patient', 'Sent', 'Expected', 'Status', 'Cost', 'Action'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labCases.map((lc: LabCase) => (
                  <LabCaseRow key={lc.id} labCase={lc} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateLabCaseModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
