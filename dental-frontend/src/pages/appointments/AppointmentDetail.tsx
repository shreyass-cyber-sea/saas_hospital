import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppointment, useUpdateAppointmentStatus, useCancelAppointment } from '../../hooks/useAppointments';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:  'bg-blue-100 text-blue-800',
  CONFIRMED:  'bg-emerald-100 text-emerald-800',
  IN_PROGRESS:'bg-amber-100 text-amber-800',
  COMPLETED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
  NO_SHOW:    'bg-slate-100 text-slate-600',
};

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  SCHEDULED:  [
    { label: 'Confirm',     next: 'CONFIRMED',   color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { label: 'Cancel',      next: 'CANCELLED',   color: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'No Show',     next: 'NO_SHOW',     color: 'bg-slate-500 hover:bg-slate-600 text-white' },
  ],
  CONFIRMED:  [
    { label: 'Start',       next: 'IN_PROGRESS', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
    { label: 'Cancel',      next: 'CANCELLED',   color: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'No Show',     next: 'NO_SHOW',     color: 'bg-slate-500 hover:bg-slate-600 text-white' },
  ],
  IN_PROGRESS:[
    { label: 'Complete',    next: 'COMPLETED',   color: 'bg-green-600 hover:bg-green-700 text-white' },
  ],
  COMPLETED:  [],
  CANCELLED:  [],
  NO_SHOW:    [],
};

export function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: appt, isLoading, isError } = useAppointment(id!);
  const updateStatus = useUpdateAppointmentStatus(id!);
  const cancelMutation = useCancelAppointment();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !appt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 text-lg">Appointment not found.</p>
        <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline text-sm">
          ← Go Back
        </button>
      </div>
    );
  }

  const status: string = appt.status ?? 'SCHEDULED';
  const actions = STATUS_ACTIONS[status] ?? [];

  const handleStatusChange = (next: string) => {
    if (next === 'CANCELLED') {
      setShowCancelModal(true);
      return;
    }
    updateStatus.mutate({ status: next });
  };

  const handleCancel = () => {
    cancelMutation.mutate({ id: id!, reason: cancelReason }, {
      onSuccess: () => {
        setShowCancelModal(false);
        navigate('/appointments');
      },
    });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2"
          >
            ← Back to Appointments
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Details</h1>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600'}`}>
          {status.replace('_', ' ')}
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">

        {/* Patient & Doctor */}
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient</p>
            {appt.patient ? (
              <Link
                to={`/patients/${appt.patient.id}`}
                className="text-indigo-600 font-semibold hover:underline text-lg"
              >
                {appt.patient.name}
              </Link>
            ) : (
              <p className="text-slate-800 font-semibold text-lg">—</p>
            )}
            {appt.patient?.phone && (
              <p className="text-slate-500 text-sm mt-0.5">{appt.patient.phone}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Doctor</p>
            <p className="text-slate-800 font-semibold text-lg">{appt.doctor?.name ?? '—'}</p>
            {appt.doctor?.email && <p className="text-slate-500 text-sm mt-0.5">{appt.doctor.email}</p>}
          </div>
        </div>

        {/* Date / Time / Token */}
        <div className="p-6 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</p>
            <p className="text-slate-800 font-medium">{formatDate(appt.date)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Time</p>
            <p className="text-slate-800 font-medium">
              {appt.startTime ?? '—'}{appt.endTime ? ` – ${appt.endTime}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Token #</p>
            <p className="text-slate-800 font-medium">{appt.tokenNumber ?? '—'}</p>
          </div>
        </div>

        {/* Type & Chief Complaint */}
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Type</p>
            <p className="text-slate-800">{appt.type ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</p>
            <p className="text-slate-800">{appt.chiefComplaint ?? '—'}</p>
          </div>
        </div>

        {/* Cancel Reason (if cancelled) */}
        {appt.cancelledReason && (
          <div className="p-6">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Cancellation Reason</p>
            <p className="text-slate-700">{appt.cancelledReason}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((a) => (
            <button
              key={a.next}
              onClick={() => handleStatusChange(a.next)}
              disabled={updateStatus.isPending}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${a.color} disabled:opacity-60`}
            >
              {updateStatus.isPending ? 'Saving…' : a.label}
            </button>
          ))}
        </div>
      )}

      {/* View Patient Notes Link */}
      {appt.patient?.id && (
        <Link
          to={`/patients/${appt.patient.id}/notes`}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          📋 View Patient Clinical Notes →
        </Link>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Cancel Appointment</h3>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              rows={3}
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
