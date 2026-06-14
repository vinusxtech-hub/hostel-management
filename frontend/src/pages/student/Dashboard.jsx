import { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useToast } from "../../hooks/useToast";
import { CardSkeleton } from "../../components/Skeleton";
import { MapView } from "../../components/MapView";
import { Modal } from "../../components/Modal";
import { useGeolocation } from "../../hooks/useGeolocation";
import { api } from "../../services/api";
import { MapPin, Clock, CheckCircle, AlertCircle, MapPinOff, RefreshCw, Timer, Lock, QrCode, User, Shield, Calendar } from "lucide-react";

// Helper: parse "HH:MM" into total minutes since midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper: format seconds into MM:SS or HH:MM:SS
const formatCountdown = (totalSeconds) => {
  if (totalSeconds <= 0) return "00:00";
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [settings, setSettings] = useState(null);
  const [timeInfo, setTimeInfo] = useState({ isOpen: false, countdown: 0, progress: 0 });
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [activeLeavePass, setActiveLeavePass] = useState(null);
  const [leavePassTimeLeft, setLeavePassTimeLeft] = useState(null);
  const { location, error: geoError, isLoading: geoLoading, refreshLocation } = useGeolocation(
    settings?.campusLatitude,
    settings?.campusLongitude,
    settings?.geofenceRadius
  );
  const { success, error } = useToast();
  const isInsideCampus = location?.type === "Inside";
  const campusStatusMessage = isInsideCampus
    ? "Inside SISTec campus area"
    : "Outside SISTec campus area";

  // Compute window status and countdown every second
  const computeTimeInfo = useCallback(() => {
    if (!settings) return;
    const checkInMin = parseTimeToMinutes(settings.checkInTime);
    const cutoffMin = parseTimeToMinutes(settings.cutoffTime);

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    // Determine total window length in minutes (handle overnight)
    let windowLength;
    if (cutoffMin > checkInMin) {
      windowLength = cutoffMin - checkInMin;
    } else {
      windowLength = (1440 - checkInMin) + cutoffMin;
    }

    // Check if currently open
    let isOpen;
    if (cutoffMin > checkInMin) {
      isOpen = currentMin >= checkInMin && currentMin <= cutoffMin;
    } else {
      isOpen = currentMin >= checkInMin || currentMin <= cutoffMin;
    }

    // Compute remaining seconds until cutoff
    let remainingSec = 0;
    if (isOpen) {
      const cutoffSec = cutoffMin * 60;
      if (cutoffMin > checkInMin) {
        remainingSec = cutoffSec - currentSec;
      } else {
        // Overnight: if we're past checkIn, remaining = (1440*60 - currentSec) + cutoffSec
        if (currentMin >= checkInMin) {
          remainingSec = (1440 * 60 - currentSec) + cutoffSec;
        } else {
          remainingSec = cutoffSec - currentSec;
        }
      }
    }

    // Compute how many minutes have elapsed in the window
    let elapsedMin = 0;
    if (isOpen) {
      if (cutoffMin > checkInMin) {
        elapsedMin = currentMin - checkInMin;
      } else {
        if (currentMin >= checkInMin) {
          elapsedMin = currentMin - checkInMin;
        } else {
          elapsedMin = (1440 - checkInMin) + currentMin;
        }
      }
    }

    const progress = windowLength > 0 ? Math.min((elapsedMin / windowLength) * 100, 100) : 0;

    setTimeInfo({ isOpen, countdown: Math.max(0, remainingSec), progress });
  }, [settings]);

  useEffect(() => {
    setIsLoading(false);
    const loadSettings = async () => {
      try {
        const data = await api.student.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();

    // Load active leave pass
    const loadLeaves = async () => {
      try {
        const leaves = await api.student.getLeaves();
        const now = Date.now();
        const THREE_HOURS = 3 * 60 * 60 * 1000;
        const activPass = leaves?.find(
          (l) => l.status === 'Approved' && l.approvedAt && (now - new Date(l.approvedAt).getTime()) <= THREE_HOURS
        );
        setActiveLeavePass(activPass || null);
      } catch (err) {
        console.error('Failed to load leaves:', err);
      }
    };
    loadLeaves();
  }, []);

  // Tick countdown every second
  useEffect(() => {
    computeTimeInfo();
    const interval = setInterval(computeTimeInfo, 1000);
    return () => clearInterval(interval);
  }, [computeTimeInfo]);

  // Leave pass countdown
  useEffect(() => {
    if (!activeLeavePass?.approvedAt) { setLeavePassTimeLeft(null); return; }
    const THREE_HOURS_SEC = 3 * 3600;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(activeLeavePass.approvedAt).getTime()) / 1000);
      const remaining = Math.max(0, THREE_HOURS_SEC - elapsed);
      setLeavePassTimeLeft(remaining);
      if (remaining === 0) setActiveLeavePass(null);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [activeLeavePass]);

  useEffect(() => {
    if (geoError) {
      setShowLocationPrompt(true);
    } else {
      setShowLocationPrompt(false);
    }
  }, [geoError]);

  const handleMarkAttendance = async () => {
    if (!location) {
      error("Location not available");
      return;
    }
    if (!isInsideCampus) {
      error("You are outside the SISTec campus area. Move closer to mark attendance.");
      return;
    }

    setIsMarkingAttendance(true);
    try {
      const result = await api.student.markAttendance({
        latitude: location.latitude,
        longitude: location.longitude
      });
      setAttendanceStatus(result);
      success(`Attendance marked as ${result.status}!`);
    } catch (err) {
      error(err.message);
      setAttendanceStatus({ status: "Rejected", message: err.message });
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  if (geoLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Modal
        isOpen={showLocationPrompt && !!geoError}
        onClose={() => setShowLocationPrompt(false)}
        title="Turn On Location"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="rounded-full bg-amber-100 p-2">
              <MapPinOff className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Location is required to use student attendance.
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Please turn on your device location and allow browser access, then try again.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {geoError}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowLocationPrompt(false)}>
              Not Now
            </Button>
            <Button onClick={refreshLocation}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="animate-slide-in-down">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-2 text-lg">Welcome back! Here's your attendance overview.</p>
      </div>

      {location && !geoError && (
        <div className="animate-slide-in-up rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-primary-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Campus Area Check
              </p>
              <h2 className={`mt-2 text-2xl font-bold ${isInsideCampus ? "text-green-700" : "text-red-700"}`}>
                {campusStatusMessage}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Live geofence status based on your current device location.
              </p>
            </div>
            <div className={`rounded-2xl p-3 ${isInsideCampus ? "bg-green-100" : "bg-red-100"}`}>
              {isInsideCampus ? (
                <MapPin className="h-7 w-7 text-green-600" />
              ) : (
                <MapPinOff className="h-7 w-7 text-red-600" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* GPS Error Banner */}
      {geoError && (
        <div className="animate-slide-in-up bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{geoError}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={refreshLocation}>
            <RefreshCw className="w-4 h-4 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Status Row — compact 2-col */}
      <div className="grid grid-cols-2 gap-4 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        {/* Geolocation pill */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Geolocation</p>
              <h3 className={`text-lg font-bold mt-0.5 ${isInsideCampus ? 'text-green-700' : 'text-red-700'}`}>
                {location ? (isInsideCampus ? '✓ Inside Campus' : '✗ Outside Campus') : 'Detecting...'}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isInsideCampus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isInsideCampus ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                  {location?.distanceDisplay ? `${location.distanceDisplay} from center` : 'Calculating...'}
                </div>
                {settings?.geofenceRadius && (
                  <span className="text-xs text-slate-400">±{settings.geofenceRadius}m</span>
                )}
              </div>
            </div>
            {isInsideCampus ? (
              <div className="p-2.5 bg-green-100/60 rounded-xl flex-shrink-0">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="p-2.5 bg-red-100/60 rounded-xl flex-shrink-0">
                <MapPinOff className="w-6 h-6 text-red-600" />
              </div>
            )}
          </div>
        </Card>

        {/* Today's Attendance pill */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Today's Attendance</p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {attendanceStatus?.status || 'Not Marked'}
              </h3>
              {attendanceStatus?.time && (
                <p className="text-xs text-slate-500 mt-1.5">Marked at <strong>{attendanceStatus.time}</strong></p>
              )}
            </div>
            {attendanceStatus?.status === 'Present' ? (
              <div className="p-2.5 bg-green-100/50 rounded-xl flex-shrink-0"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            ) : attendanceStatus?.status === 'Late' ? (
              <div className="p-2.5 bg-yellow-100/50 rounded-xl flex-shrink-0"><Clock className="w-6 h-6 text-yellow-600" /></div>
            ) : (
              <div className="p-2.5 bg-slate-100/50 rounded-xl flex-shrink-0"><AlertCircle className="w-6 h-6 text-slate-400" /></div>
            )}
          </div>
        </Card>
      </div>

      {/* Full-Width Live Location Map */}
      <div className="animate-slide-in-up" style={{ animationDelay: '150ms' }}>
        <Card className="p-0 overflow-hidden">
          {/* Map header bar */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Live Location Map</p>
            </div>
            <div className="flex items-center gap-4">
              {location && (
                <span className="text-xs font-mono text-slate-400">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                  Campus Center
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Your Location
                </div>
              </div>
            </div>
          </div>
          {/* Map — full width, tall */}
          <MapView
            userLat={location?.latitude}
            userLng={location?.longitude}
            campusLat={settings?.campusLatitude}
            campusLng={settings?.campusLongitude}
            radiusMeters={settings?.geofenceRadius}
            distance={location?.distanceDisplay}
            isInside={location?.type === 'Inside'}
            showGeofence={false}
            className="h-[420px] w-full"
          />
        </Card>
      </div>


      {/* Attendance Time Window */}
      <div className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
        <Card className={`relative overflow-hidden group ${timeInfo.isOpen ? 'border-green-200' : 'border-red-200'}`}>
          <div className={`absolute inset-0 ${timeInfo.isOpen ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50' : 'bg-gradient-to-r from-red-50/30 to-slate-50/30'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          <div className="relative z-10">
            {/* Title + Live Status Badge */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Attendance Time Window</p>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${timeInfo.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className={`w-2 h-2 rounded-full ${timeInfo.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {timeInfo.isOpen ? 'OPEN' : 'CLOSED'}
              </div>
            </div>

            {/* Time Slots */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-600">Check-in Opens</p>
                <p className="text-2xl font-bold text-primary-700">{settings?.checkInTime ?? "—"}</p>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div>
                <p className="text-sm text-slate-600">Window Closes</p>
                <p className="text-2xl font-bold text-indigo-700">{settings?.cutoffTime ?? "—"}</p>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div>
                <p className="text-sm text-slate-600">Geofence</p>
                <p className="text-2xl font-bold text-emerald-700">{settings ? `${settings.geofenceRadius}m` : "—"}</p>
              </div>
            </div>

            {/* Progress Bar + Countdown */}
            {timeInfo.isOpen ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Remaining</span>
                    <span className="text-sm font-bold text-primary-700 font-mono tabular-nums">{formatCountdown(timeInfo.countdown)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${100 - timeInfo.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
                  <Timer className="w-5 h-5 flex-shrink-0" />
                  <span>Attendance window is <strong>open</strong>. You have <strong>{formatCountdown(timeInfo.countdown)}</strong> left to mark your attendance.</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
                <Lock className="w-5 h-5 flex-shrink-0" />
                <span>Attendance window is <strong>closed</strong>. It opens daily at <strong>{settings?.checkInTime ?? "—"}</strong> and closes at <strong>{settings?.cutoffTime ?? "—"}</strong>.</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Mark Attendance Button */}
      <div className="flex items-center gap-4 animate-slide-in-up" style={{ animationDelay: '400ms' }}>
        <Button
          onClick={handleMarkAttendance}
          isLoading={isMarkingAttendance}
          disabled={!location || !isInsideCampus || !!geoError || !timeInfo.isOpen}
          size="lg"
          className={`text-base shadow-xl ${timeInfo.isOpen ? 'shadow-primary-500/20' : 'shadow-slate-300/20 !bg-slate-400 cursor-not-allowed'}`}
        >
          {!timeInfo.isOpen ? (
            <><Lock className="w-5 h-5 mr-2" /> Window Closed</>
          ) : isMarkingAttendance ? (
            "Marking..."
          ) : geoError ? (
            "Location Unavailable"
          ) : !isInsideCampus ? (
            "Outside Campus"
          ) : (
            <><CheckCircle className="w-5 h-5 mr-2" /> Mark Attendance</>
          )}
        </Button>
        <Button variant="secondary" size="lg" onClick={refreshLocation}>
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>

      {/* Active Leave Pass with QR Code */}
      {activeLeavePass && leavePassTimeLeft > 0 && (
        <div className="animate-zoom-in">
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Active Leave Pass</p>
                <p className="text-white/80 text-sm">Present this QR to the guard at the gate</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white font-mono font-bold text-lg">{formatCountdown(leavePassTimeLeft)}</p>
                <p className="text-white/70 text-xs">remaining</p>
              </div>
            </div>

            <div className="p-5 flex flex-col sm:flex-row gap-6 items-center">
              {/* QR Code */}
              <div className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-md border border-emerald-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeLeavePass.id)}&color=10b981&bgcolor=ffffff`}
                  alt="Leave Pass QR Code"
                  className="w-44 h-44 rounded-lg"
                />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-emerald-100">
                    <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Reason</p>
                      <p className="text-xs text-slate-800 font-medium truncate">{activeLeavePass.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-emerald-100">
                    <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Type</p>
                      <p className="text-xs text-slate-800 font-medium">{activeLeavePass.type || 'Leave'}</p>
                    </div>
                  </div>
                </div>

                {activeLeavePass.approvedByName && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {activeLeavePass.approvedByName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Approved by</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeLeavePass.approvedByName || 'Staff'}
                        <span className="ml-1.5 text-xs font-normal text-slate-500 capitalize">({activeLeavePass.approvedByRole})</span>
                      </p>
                    </div>
                    <span className="ml-auto px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">APPROVED</span>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium">⚠️ This QR code is valid for 3 hours from approval time. Guard will scan at the gate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Result */}
      {attendanceStatus && (
        <div className="animate-zoom-in">
          <Card className={attendanceStatus.status === "Rejected" ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"}>
            <div className="flex items-center gap-4">
              {attendanceStatus.status === "Present" && (
                <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="w-8 h-8 text-green-600" /></div>
              )}
              {attendanceStatus.status === "Late" && (
                <div className="p-3 bg-yellow-100 rounded-full"><Clock className="w-8 h-8 text-yellow-600" /></div>
              )}
              {attendanceStatus.status === "Rejected" && (
                <div className="p-3 bg-red-100 rounded-full"><AlertCircle className="w-8 h-8 text-red-600" /></div>
              )}
              <div>
                <p className="font-bold text-lg text-slate-900">
                  {attendanceStatus.status === "Rejected" ? attendanceStatus.message : `Attendance marked as ${attendanceStatus.status}`}
                </p>
                {attendanceStatus.time && (
                  <p className="text-sm text-slate-600 font-medium">Marked at {attendanceStatus.time}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
