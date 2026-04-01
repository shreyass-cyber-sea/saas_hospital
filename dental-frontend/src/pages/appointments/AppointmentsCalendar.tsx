import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import {
    Plus, X, Loader2, Calendar as CalendarIcon,
    User, Stethoscope, CheckCircle2, AlertCircle,
    Sparkles, Camera, Image as ImageIcon, Search, MessageCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { useCalendarAppointments, useCreateAppointment, useAvailableSlots } from '../../hooks/useAppointments';
import { useAuthStore } from '../../hooks/useAuthStore';
import api from '../../lib/api';
import { useUploadFile } from '../../hooks/useStorage';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarEvent {
    id?: string;
    title: string;
    start: Date;
    end: Date;
    resource: string;
    status?: string;
    patientName?: string;
    doctorName?: string;
    type?: string;
    chiefComplaint?: string;
    notes?: string;
    phone?: string;
    email?: string;
    chairId?: string;
    photoUrl?: string;
    tokenNumber?: number;
    rawAppointment?: any;
}


interface Doctor {
    _id: string;
    name: string;
    email: string;
    role: string;
    doctorProfile?: {
        specialization?: string;
        color?: string;
    };
}

interface AppointmentDetail {
    _id: string;
    patientId: { _id: string; name: string; phone: string; email?: string; photoUrl?: string };
    doctorId: { _id: string; name: string };
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
    chiefComplaint?: string;
    notes?: string;
    duration: number;
    tokenNumber?: number;
}

interface BookingSuccess {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    type: string;
    tokenNumber?: number;
    emailSent: boolean;
    patientEmail?: string;
}

const APPOINTMENT_TYPES: Record<string, string> = {
    CONSULTATION: 'Consultation',
    NEW_PATIENT: 'New Patient',
    FOLLOW_UP: 'Follow Up',
    PROCEDURE: 'Procedure',
    EMERGENCY: 'Emergency',
};

// Clinic chairs — each with a distinct color for the calendar
const CLINIC_CHAIRS: { id: string; name: string; color: string; light: string }[] = [
    { id: 'CHAIR-1', name: 'Chair 1 — Main Surgery', color: '#1e40af', light: '#dbeafe' },
    { id: 'CHAIR-2', name: 'Chair 2 — Hygiene',      color: '#7c3aed', light: '#ede9fe' },
    { id: 'CHAIR-3', name: 'Chair 3 — Orthodontics', color: '#db2777', light: '#fce7f3' },
    { id: 'CHAIR-4', name: 'Chair 4 — Paediatric',   color: '#d97706', light: '#fef3c7' },
    { id: 'CHAIR-5', name: 'Chair 5 — Implants',     color: '#2563eb', light: '#dbeafe' },
];

export function AppointmentsCalendar() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetail | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);

    // Form state — patient selection
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedPatientName, setSelectedPatientName] = useState<string>('');
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
    const [isSearchingPatients, setIsSearchingPatients] = useState(false);
    const [isExistingPatientMode, setIsExistingPatientMode] = useState(false);
    const prefilledPatientId = searchParams.get('patient');

    // Form state — new patient details
    const [newPatientName, setNewPatientName] = useState('');
    const [newPatientPhone, setNewPatientPhone] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [selectedDoctorObj, setSelectedDoctorObj] = useState<Doctor | null>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedChair, setSelectedChair] = useState<string>('');
    const [appointmentType, setAppointmentType] = useState<string>('CONSULTATION');
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [notes, setNotes] = useState('');
    const [patientEmail, setPatientEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [isCameraInitializing, setIsCameraInitializing] = useState(false);
    const [troubleshootMode, setTroubleshootMode] = useState(false);
    const [shutterFlash, setShutterFlash] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const uploadFile = useUploadFile();

    // Patient search effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (patientSearchQuery.trim().length >= 2) {
                setIsSearchingPatients(true);
                try {
                    const res = await api.get('/patients/search', { params: { q: patientSearchQuery } });
                    setPatientSearchResults(Array.isArray(res.data) ? res.data : (res.data?.data || []));
                } catch (error) {
                    console.error('Patient search failed:', error);
                } finally {
                    setIsSearchingPatients(false);
                }
            } else {
                setPatientSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [patientSearchQuery]);

    // Robust video element binding
    useEffect(() => {
        const video = videoRef.current;
        if (showCamera && stream && video) {
            if (video.srcObject !== stream) {
                video.srcObject = stream;
            }
            const tryPlay = async () => {
                try {
                    await video.play();
                } catch (err) {
                    console.error("Auto-play failed:", err);
                }
            };
            tryPlay();
        }
    }, [showCamera, stream, videoRef.current]);

    // Request camera when showCamera is toggled ON
    useEffect(() => {
        let isMounted = true;
        if (showCamera && !stream) {
            setIsCameraInitializing(true);
            setBookingError(null);
            setTroubleshootMode(false);

            const initCamera = async () => {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'user' } 
                    });
                    
                    if (!isMounted) {
                        mediaStream.getTracks().forEach(t => t.stop());
                        return;
                    }

                    const videoTrack = mediaStream.getVideoTracks()[0];
                    if (videoTrack) {
                        if (videoTrack.muted) {
                            setBookingError("Your laptop's camera is physically blocked or disabled in privacy settings.");
                            setTroubleshootMode(true);
                        }
                    }

                    setStream(mediaStream);
                    streamRef.current = mediaStream;
                    setIsCameraInitializing(false);
                } catch (err: any) {
                    setIsCameraInitializing(false);
                    console.error("Camera access error:", err);
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setBookingError("Camera Access Blocked: Please allow camera access in your browser.");
                    } else {
                        setBookingError(`Webcam Error: ${err.message}`);
                    }
                    setTroubleshootMode(true);
                }
            };
            initCamera();
        }
        return () => { isMounted = false; };
    }, [showCamera, stream]);

    const { token } = useAuthStore();

    // Pre-fill patient from ?patient= URL param
    useEffect(() => {
        if (prefilledPatientId && token) {
            api.get(`/patients/${prefilledPatientId}`).then(res => {
                const p = res.data?.data || res.data;
                if (p) {
                    setSelectedPatientId(p._id);
                    setSelectedPatientName(p.name);
                    setPatientEmail(p.email || '');
                    setIsExistingPatientMode(true);
                    setIsBookingDialogOpen(true);
                    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                }
            }).catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefilledPatientId, token]);

    const { startDate, endDate } = useMemo(() => {
        const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, [date]);

    const { data: appointments = [] } = useCalendarAppointments(startDate, endDate);
    const createAppointment = useCreateAppointment();

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/users/doctors');
                const doctorList = Array.isArray(res.data) ? res.data : (res.data.data || []);
                setDoctors(doctorList);
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            }
        };
        if (token) fetchDoctors();
    }, [token]);

    const { data: slotData } = useAvailableSlots(selectedDoctor, selectedDate || '', 30);
    const availableSlots: string[] = slotData?.available || [];
    const bookedSlots: string[] = slotData?.booked || [];

    const events: CalendarEvent[] = useMemo(() => {
        return appointments.map((appt: any) => {
            const apptDate = new Date(appt.date);
            const [startHour, startMin] = (appt.startTime as string).split(':');
            const [endHour, endMin] = (appt.endTime as string).split(':');
            const start = new Date(apptDate);
            start.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
            const end = new Date(apptDate);
            end.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
            const patient = appt.patientId;
            const doctor = appt.doctorId;
            const patientName = patient?.name || 'Unknown Patient';
            const doctorName = doctor?.name || 'Unknown Doctor';
            const type = (appt.type as string) || 'Appointment';
            return {
                id: appt._id,
                title: `${type} - ${patientName}`,
                start, end,
                resource: doctorName,
                status: appt.status,
                patientName, doctorName, type,
                chiefComplaint: appt.chiefComplaint,
                notes: appt.notes,
                phone: patient?.phone,
                email: patient?.email,
                chairId: appt.chairId,
                photoUrl: patient?.photoUrl,
                tokenNumber: appt.tokenNumber,
                rawAppointment: appt,
            };
        });
    }, [appointments]);

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedDate(format(start, 'yyyy-MM-dd'));
        setIsBookingDialogOpen(true);
        resetForm();
    };

    const handleSelectEvent = async (event: CalendarEvent) => {
        if (!event.id) return;
        if (event.rawAppointment) {
            setSelectedAppointment(event.rawAppointment);
        } else {
            setSelectedAppointment({
                _id: event.id || '',
                patientId: { _id: '', name: event.patientName || '', phone: event.phone || '', email: event.email, photoUrl: event.photoUrl },
                doctorId: { _id: '', name: event.doctorName || '' },
                date: format(event.start, 'yyyy-MM-dd'),
                startTime: format(event.start, 'HH:mm'),
                endTime: format(event.end, 'HH:mm'),
                status: event.status || 'SCHEDULED',
                type: event.type || 'CONSULTATION',
                chiefComplaint: event.chiefComplaint,
                notes: event.notes,
                duration: 30,
                tokenNumber: event.tokenNumber,
            });
        }
        setIsDetailDialogOpen(true);
        try {
            const res = await api.get(`/appointments/${event.id}`);
            const apptData = res.data?.data || res.data;
            setSelectedAppointment(prev => prev ? { ...prev, ...apptData } : apptData);
        } catch {}
    };

    const resetForm = () => {
        setSelectedPatientId(null);
        setSelectedPatientName('');
        setPatientSearchQuery('');
        setPatientSearchResults([]);
        setIsExistingPatientMode(false);
        setNewPatientName('');
        setNewPatientPhone('');
        setSelectedDoctor('');
        setSelectedDoctorObj(null);
        setSelectedTime('');
        setSelectedChair('');
        setAppointmentType('CONSULTATION');
        setChiefComplaint('');
        setNotes('');
        setPatientEmail('');
        setBookingSuccess(null);
        setBookingError(null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setShowCamera(false);
        stopCamera();
    };

    const startCamera = () => {
        setBookingError(null);
        setTroubleshootMode(false);
        setShowCamera(true);
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                setShutterFlash(true);
                setTimeout(() => setShutterFlash(false), 150);
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "patient_photo.jpg", { type: "image/jpeg" });
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                        stopCamera();
                        setShowCamera(false);
                    }
                }, 'image/jpeg');
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
        setIsCameraInitializing(false);
    };

    const handleDoctorChange = (doctorId: string) => {
        setSelectedDoctor(doctorId);
        const doc = doctors.find(d => d._id === doctorId) || null;
        setSelectedDoctorObj(doc);
        setSelectedTime('');
    };

    const patientReady = selectedPatientId || (newPatientName.trim().length >= 2 && newPatientPhone.trim().length >= 6);

    const handleSubmit = async () => {
        if (!patientReady || !selectedDoctor || !selectedDate || !selectedTime) {
            setBookingError('Please fill in all required fields.');
            return;
        }
        setBookingError(null);
        setIsSubmitting(true);
        try {
            let patientId = selectedPatientId;
            let finalPatientName = selectedPatientName;
            let finalPatientEmail = patientEmail.trim();

            if (!patientId) {
                let photoUrl = '';
                if (photoFile) {
                    const uploadRes = await uploadFile.mutateAsync({ file: photoFile, folder: 'patients' });
                    photoUrl = uploadRes.fileUrl;
                }
                const newPatRes = await api.post('/patients', {
                    name: newPatientName.trim(),
                    phone: newPatientPhone.trim(),
                    email: finalPatientEmail || undefined,
                    photoUrl: photoUrl || undefined,
                });
                const created = newPatRes.data?.data || newPatRes.data;
                patientId = created._id;
                finalPatientName = created.name;
            }

            const [hours, minutes] = selectedTime.split(':');
            const startDateTime = new Date();
            startDateTime.setHours(parseInt(hours), parseInt(minutes));
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
            const endTime = format(endDateTime, 'HH:mm');

            await createAppointment.mutateAsync({
                patientId,
                doctorId: selectedDoctor,
                date: selectedDate,
                startTime: selectedTime,
                endTime,
                type: appointmentType,
                chiefComplaint,
                notes,
                duration: 30,
                ...(selectedChair ? { chairId: selectedChair } : {}),
            });

            setBookingSuccess({
                patientName: finalPatientName,
                doctorName: selectedDoctorObj?.name || '',
                date: selectedDate,
                time: selectedTime,
                type: appointmentType,
                emailSent: !!finalPatientEmail,
                patientEmail: finalPatientEmail,
            });
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to create appointment.';
            setBookingError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            case 'NO_SHOW': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CONFIRMED': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'RESCHEDULED': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <PageWrapper
            title="Appointments"
            description="Manage your clinic's schedule and bookings."
            action={
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                        resetForm();
                        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                        setIsBookingDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" /> New Appointment
                </Button>
            }
        >
            <Dialog open={isBookingDialogOpen} onOpenChange={(open) => {
                if (!open) resetForm();
                setIsBookingDialogOpen(open);
            }}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-[520px] max-h-[92vh] overflow-hidden p-0 gap-0 flex flex-col">
                    {bookingSuccess ? (
                        <div className="flex flex-col items-center text-center p-8 gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-9 w-9 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Appointment Confirmed!</h2>
                                <p className="text-sm text-gray-500 mt-1">Your booking has been successfully created.</p>
                            </div>
                            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 text-left space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Patient</p>
                                        <p className="font-semibold text-gray-900">{bookingSuccess.patientName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <Stethoscope className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Doctor</p>
                                        <p className="font-semibold text-gray-900">{bookingSuccess.doctorName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <CalendarIcon className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Date & Time</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(bookingSuccess.date), 'EEEE, MMMM d, yyyy')} at {bookingSuccess.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full pt-2">
                                <Button variant="outline" className="flex-1" onClick={resetForm}>Book Another</Button>
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setIsBookingDialogOpen(false)}>Done</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" />
                                        Book New Appointment
                                    </DialogTitle>
                                    <p className="text-blue-100 text-sm mt-1">
                                        {selectedDate ? `📅 ${format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}` : 'Schedule a new patient visit'}
                                    </p>
                                </DialogHeader>
                            </div>

                            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                                {bookingError && (
                                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 font-medium">{bookingError}</p>
                                        <button onClick={() => setBookingError(null)} className="ml-auto text-red-400 hover:text-red-600">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                                            <Label className="text-sm font-semibold text-gray-700">Patient Details <span className="text-red-500">*</span></Label>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-xs text-blue-600 h-7 px-2 hover:bg-blue-50"
                                            onClick={() => {
                                                setIsExistingPatientMode(!isExistingPatientMode);
                                                setSelectedPatientId(null);
                                                setSelectedPatientName('');
                                                setNewPatientName('');
                                                setNewPatientPhone('');
                                            }}
                                        >
                                            {isExistingPatientMode ? 'Enter New Patient' : 'Select Existing Patient'}
                                        </Button>
                                    </div>

                                    {isExistingPatientMode ? (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="Search patient by name or phone..."
                                                    value={patientSearchQuery}
                                                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                                                    className="pl-9 bg-gray-50 border-gray-200"
                                                />
                                                {isSearchingPatients && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-blue-600" />}
                                            </div>

                                            {patientSearchResults.length > 0 && !selectedPatientId && (
                                                <Card className="border-blue-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                                    <div className="divide-y divide-gray-100">
                                                        {patientSearchResults.map((p) => (
                                                            <div 
                                                                key={p._id} 
                                                                className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                                                                onClick={() => {
                                                                    setSelectedPatientId(p._id);
                                                                    setSelectedPatientName(p.name);
                                                                    setPatientEmail(p.email || '');
                                                                    setPatientSearchQuery('');
                                                                    setPatientSearchResults([]);
                                                                }}
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                                                                    <p className="text-xs text-gray-500">{p.phone}</p>
                                                                </div>
                                                                <Badge variant="outline" className="text-[10px] bg-white">ID: PT-{p.patientId}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Card>
                                            )}

                                            {selectedPatientId && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                                            {selectedPatientName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-blue-900 text-sm">{selectedPatientName}</p>
                                                            <p className="text-xs text-blue-600">Selected Patient</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatientId(null)} className="h-7 w-7 p-0 text-blue-400 hover:text-red-500">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-gray-700">Full Name <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        placeholder="Patient full name"
                                                        value={newPatientName}
                                                        onChange={(e) => setNewPatientName(e.target.value)}
                                                        className="bg-gray-50 border-gray-200"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs font-medium text-gray-700">Phone <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        placeholder="Mobile number"
                                                        value={newPatientPhone}
                                                        onChange={(e) => setNewPatientPhone(e.target.value)}
                                                        className="bg-gray-50 border-gray-200"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium text-gray-700">Email (optional)</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="patient@example.com"
                                                    value={patientEmail}
                                                    onChange={(e) => setPatientEmail(e.target.value)}
                                                    className="bg-gray-50 border-gray-200"
                                                />
                                            </div>
                                            <div className="space-y-2 pt-2">
                                                <Label className="text-xs font-medium text-gray-700">Patient Photo</Label>
                                                <div className="flex flex-col gap-3">
                                                    {photoPreview ? (
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-blue-100 shadow-md">
                                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Button size="sm" variant="outline" onClick={startCamera} className="text-xs h-8">Retake</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="text-xs h-8 text-red-500">Remove</Button>
                                                            </div>
                                                        </div>
                                                    ) : showCamera ? (
                                                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                                                            {shutterFlash && <div className="absolute inset-0 bg-white z-50 animate-in fade-in duration-75" />}
                                                            {isCameraInitializing && (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
                                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                                    <p className="text-xs">Initializing...</p>
                                                                </div>
                                                            )}
                                                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                                                <Button size="sm" onClick={takePhoto} className="bg-blue-600 rounded-full h-10 w-10 p-0"><Camera className="h-5 w-5" /></Button>
                                                                <Button size="sm" variant="outline" onClick={() => { stopCamera(); setShowCamera(false); }} className="bg-white/90">Cancel</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" onClick={startCamera} className="flex-1 border-dashed border-2"><Camera className="h-4 w-4 mr-2" /> Webcam</Button>
                                                            <input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
                                                            }} />
                                                            <Button variant="outline" size="sm" onClick={() => document.getElementById('photo-upload')?.click()} className="flex-1 border-dashed border-2"><ImageIcon className="h-4 w-4 mr-2" /> Upload</Button>
                                                        </div>
                                                    )}
                                                    <canvas ref={canvasRef} className="hidden" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Select Doctor <span className="text-red-500">*</span></Label>
                                    <Select value={selectedDoctor} onValueChange={handleDoctorChange}>
                                        <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue placeholder="Choose a doctor..." /></SelectTrigger>
                                        <SelectContent>
                                            {doctors.map((doctor) => (
                                                <SelectItem key={doctor._id} value={doctor._id}>{doctor.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Date <span className="text-red-500">*</span></Label>
                                        <Input type="date" value={selectedDate || ''} onChange={(e) => setSelectedDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} className="bg-gray-50 border-gray-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700">Time <span className="text-red-500">*</span></Label>
                                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                                            <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue placeholder="Select Time" /></SelectTrigger>
                                            <SelectContent>
                                                {availableSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Appointment Type</Label>
                                    <Select value={appointmentType} onValueChange={setAppointmentType}>
                                        <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(APPOINTMENT_TYPES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 bg-white">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-bold" onClick={handleSubmit} disabled={isSubmitting || !patientReady || !selectedDoctor || !selectedDate || !selectedTime}>
                                    {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Booking...</> : <><CheckCircle2 className="mr-2 h-5 w-5" /> Confirm Appointment</>}
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Card><CardContent className="p-6">
                <div className="h-[700px]">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={view}
                        onView={(newView) => setView(newView)}
                        date={date}
                        onNavigate={(newDate) => setDate(newDate)}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        selectable
                        style={{ height: '100%' }}
                        eventPropGetter={(event: any) => {
                            const chair = CLINIC_CHAIRS.find(c => c.id === event.chairId);
                            let backgroundColor = chair ? chair.color : '#3b82f6';
                            return { style: { backgroundColor, border: 'none', borderRadius: '4px' } };
                        }}
                    />
                </div>
            </CardContent></Card>

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
                    {selectedAppointment && (
                        <div className="flex flex-col">
                            <div className="bg-blue-600 p-6 text-white">
                                <h2 className="text-xl font-bold">{selectedAppointment.patientId.name}</h2>
                                <p className="text-blue-100">{format(new Date(selectedAppointment.date), 'PPPP')}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">{selectedAppointment.patientId.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-semibold">{selectedAppointment.patientId.name}</p>
                                        <p className="text-sm text-gray-500">{selectedAppointment.patientId.phone}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div><p className="text-xs text-gray-400 uppercase">Doctor</p><p className="font-medium text-sm">Dr. {selectedAppointment.doctorId.name}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase">Time</p><p className="font-medium text-sm">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase">Type</p><p className="font-medium text-sm">{selectedAppointment.type}</p></div>
                                    <div><p className="text-xs text-gray-400 uppercase">Status</p><p className="font-medium text-sm">{selectedAppointment.status}</p></div>
                                </div>
                                {selectedAppointment.chiefComplaint && (
                                    <div className="pt-2">
                                        <p className="text-xs text-gray-400 uppercase">Chief Complaint</p>
                                        <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selectedAppointment.chiefComplaint}</p>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => {
                                            const phone = selectedAppointment.patientId.phone.replace(/\D/g, '');
                                            const dateFormatted = format(new Date(selectedAppointment.date), 'PPPP');
                                            const message = `Hello ${selectedAppointment.patientId.name},\n\nThis is a reminder for your dental appointment.\n👨‍⚕️ Doctor: Dr. ${selectedAppointment.doctorId.name}\n📅 Date: ${dateFormatted}\n⏰ Time: ${selectedAppointment.startTime} - ${selectedAppointment.endTime}\n🩺 Type: ${selectedAppointment.type}\n\nPlease arrive 10 minutes early.`;
                                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                    >
                                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                    </Button>
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => {
                                            setIsDetailDialogOpen(false);
                                            navigate(`/patients/${selectedAppointment.patientId._id}`);
                                        }}
                                    >
                                        <User className="mr-2 h-4 w-4" /> View Patient
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
