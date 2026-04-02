import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { usePatient, usePatientNotes, useAddClinicalNote } from '../../hooks/usePatients';

interface NoteFormData {
  chiefComplaint: string;
  findings: string;
  diagnosis: string;
  treatmentPlan: string;
  [key: string]: unknown;
}

const EMPTY_FORM: NoteFormData = {
  chiefComplaint: '',
  findings: '',
  diagnosis: '',
  treatmentPlan: '',
};

function NoteCard({ note }: { note: any }) {
  const [expanded, setExpanded] = useState(false);
  const date = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shrink-0">
            {note.doctor?.name?.[0] ?? 'D'}
          </span>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {note.chiefComplaint || 'Clinical Visit'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Dr. {note.doctor?.name ?? 'Unknown'} · {date}
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          {note.chiefComplaint && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</p>
              <p className="text-slate-700 text-sm">{note.chiefComplaint}</p>
            </div>
          )}
          {note.findings && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Findings</p>
              <p className="text-slate-700 text-sm">{note.findings}</p>
            </div>
          )}
          {note.diagnosis && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
              <p className="text-slate-700 text-sm">{note.diagnosis}</p>
            </div>
          )}
          {note.treatmentPlan && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Treatment Plan</p>
              <p className="text-slate-700 text-sm">{note.treatmentPlan}</p>
            </div>
          )}
          {note.vitals && Object.keys(note.vitals).length > 0 && (
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vitals</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(note.vitals).map(([k, v]) => (
                  <span key={k} className="bg-slate-100 text-slate-700 text-xs rounded-lg px-3 py-1.5">
                    <span className="font-medium capitalize">{k}:</span> {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(note.prescriptions) && note.prescriptions.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prescriptions</p>
              <div className="space-y-1.5">
                {note.prescriptions.map((rx: any, i: number) => (
                  <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-800">
                    <span className="font-semibold">{rx.medicine}</span>
                    {rx.dosage && ` · ${rx.dosage}`}
                    {rx.frequency && ` · ${rx.frequency}`}
                    {rx.duration && ` · ${rx.duration}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PatientNotes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient } = usePatient(id!);
  const { data: notes = [], isLoading } = usePatientNotes(id!);
  const addNote = useAddClinicalNote(id!);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NoteFormData>(EMPTY_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNote.mutate(form, {
      onSuccess: () => {
        setForm(EMPTY_FORM);
        setShowForm(false);
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(`/patients/${id}`)}
            className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2"
          >
            ← Back to Patient Profile
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Notes</h1>
          {patient?.name && (
            <p className="text-slate-500 text-sm mt-0.5">
              Patient: <Link to={`/patients/${id}`} className="text-indigo-600 hover:underline">{patient.name}</Link>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Note
        </button>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-2xl">📋</div>
          <p className="text-slate-500 font-medium">No clinical notes yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-indigo-600 text-sm hover:underline"
          >
            Add the first note
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...notes].reverse().map((note: any) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">New Clinical Note</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {(
                [
                  { key: 'chiefComplaint', label: 'Chief Complaint' },
                  { key: 'findings', label: 'Clinical Findings' },
                  { key: 'diagnosis', label: 'Diagnosis' },
                  { key: 'treatmentPlan', label: 'Treatment Plan' },
                ] as const
              ).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder={`Enter ${label.toLowerCase()}…`}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addNote.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {addNote.isPending ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
