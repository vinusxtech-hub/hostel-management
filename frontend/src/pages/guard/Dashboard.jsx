import { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  XCircle,
  User,
  Building,
  Home,
  BookOpen,
  Phone,
  Clock,
  Shield,
  AlertCircle,
  Camera,
  CameraOff,
  RefreshCw,
  Search,
} from "lucide-react";

export const GuardDashboard = () => {
  const [manualToken, setManualToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null); // null | { valid, student, approvedBy, approvedAt, expiresAt, reason }
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const { error: showError } = useToast();

  // Countdown for QR validity
  useEffect(() => {
    if (!result?.valid || !result?.expiresAt) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(result.expiresAt) - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [result]);

  const verifyToken = async (token) => {
    const t = token.trim();
    if (!t) {
      showError("Please enter or scan a QR code token");
      return;
    }
    setVerifying(true);
    setResult(null);
    try {
      const data = await api.guard.verifyQr(t);
      // Normalize into expected shape
      const normalized = {
        valid: data.valid || false,
        reason: data.error || data.reason || '',
        student: data.valid ? {
          name: data.studentName || 'Unknown',
          room: data.room || 'N/A',
          building: data.building || '',
          department: data.department || 'N/A',
          phone: data.phone || 'N/A',
          hostelSection: data.hostelSection || '',
        } : null,
        approvedBy: data.valid ? {
          name: data.approvedBy || 'Staff',
          role: data.approvedByRole || 'staff',
        } : null,
        approvedAt: data.approvedAt || null,
        expiresAt: data.expiresAt || null,
      };
      setResult(normalized);
    } catch (err) {
      setResult({ valid: false, reason: err.message || "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    verifyToken(manualToken);
  };

  // Camera QR scanning via BarcodeDetector API (where available), fallback info
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Use BarcodeDetector if supported
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              stopCamera();
              setManualToken(codes[0].rawValue);
              verifyToken(codes[0].rawValue);
            }
          } catch {
            // Ignore detection errors
          }
        }, 500);
      }
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  };

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), []);

  const formatTime = (secs) => {
    if (secs <= 0) return "Expired";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDateTime = (dt) => {
    if (!dt) return "N/A";
    return new Date(dt).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-500/30 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Guard Scanner</h1>
        <p className="text-slate-500 mt-1">Scan or enter a QR token to verify student leave passes</p>
      </div>

      {/* Camera Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-slate-800">Camera Scanner</span>
          </div>
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              cameraActive
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            }`}
          >
            {cameraActive ? (
              <>
                <CameraOff className="w-4 h-4" /> Stop Camera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" /> Start Camera
              </>
            )}
          </button>
        </div>
        <div className="relative bg-slate-950 aspect-video flex items-center justify-center">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg" />
                  {/* Scan line */}
                  <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-indigo-400 opacity-80 animate-pulse" />
                </div>
                <p className="absolute bottom-4 text-white/70 text-sm font-medium">
                  {window.BarcodeDetector ? "Detecting QR Code..." : "Position QR code within frame"}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                <ScanLine className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400 font-medium">Camera is off</p>
              <p className="text-slate-600 text-sm mt-1">Click "Start Camera" to scan a QR code</p>
            </div>
          )}
        </div>
        {cameraError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-t border-red-100">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{cameraError}</p>
          </div>
        )}
        {!window.BarcodeDetector && cameraActive && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-t border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Auto-detection unavailable in this browser. Please enter the QR token manually below.
            </p>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <QrCode className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-slate-800">Manual Token Entry</span>
        </div>
        <form onSubmit={handleManualVerify} className="p-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste or type QR code token..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || !manualToken.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
            >
              {verifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ScanLine className="w-4 h-4" />
              )}
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>

      {/* Verification Result */}
      {result && (
        <div
          className={`rounded-2xl border-2 overflow-hidden shadow-lg transition-all animate-fade-in ${
            result.valid
              ? "border-emerald-300 bg-emerald-50/60"
              : "border-red-300 bg-red-50/60"
          }`}
        >
          {/* Status Banner */}
          <div
            className={`flex items-center gap-4 p-5 ${
              result.valid
                ? "bg-gradient-to-r from-emerald-500 to-green-600"
                : "bg-gradient-to-r from-red-500 to-rose-600"
            }`}
          >
            <div className="p-2 bg-white/20 rounded-full">
              {result.valid ? (
                <CheckCircle2 className="w-8 h-8 text-white" />
              ) : (
                <XCircle className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-bold text-xl">
                {result.valid ? "PASS VALID" : "PASS INVALID"}
              </p>
              <p className="text-white/80 text-sm mt-0.5">
                {result.valid
                  ? "Student is authorized to leave the hostel"
                  : result.reason || "This pass cannot be verified"}
              </p>
            </div>
          </div>

          {result.valid && result.student && (
            <div className="p-5 space-y-4">
              {/* QR Validity Timer */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  timeLeft > 300
                    ? "bg-green-50 border-green-200"
                    : timeLeft > 0
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock
                    className={`w-4 h-4 ${
                      timeLeft > 300
                        ? "text-green-600"
                        : timeLeft > 0
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      timeLeft > 300
                        ? "text-green-700"
                        : timeLeft > 0
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}
                  >
                    {timeLeft > 0 ? `Pass expires in ${formatTime(timeLeft)}` : "Pass has expired"}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    timeLeft > 300
                      ? "bg-green-100 text-green-700"
                      : timeLeft > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {timeLeft > 0 ? "ACTIVE" : "EXPIRED"}
                </span>
              </div>

              {/* Student Details */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Student Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: User, label: "Name", value: result.student.name },
                    { icon: Home, label: "Room", value: result.student.room },
                    { icon: Building, label: "Building", value: `Building ${result.student.building || "N/A"}` },
                    { icon: BookOpen, label: "Department", value: result.student.department || "N/A" },
                    { icon: Phone, label: "Phone", value: result.student.phone || "N/A" },
                    {
                      icon: Shield,
                      label: "Section",
                      value: result.student.hostelSection === "boys" ? "Boys Hostel" : result.student.hostelSection === "girls" ? "Girls Hostel" : result.student.hostelSection || "N/A",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="p-1.5 bg-indigo-50 rounded-lg">
                        <item.icon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.label}</p>
                        <p className="text-sm text-slate-800 font-medium truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Details */}
              {result.approvedBy && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Approval Details</p>
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {result.approvedBy.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{result.approvedBy.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{result.approvedBy.role}</p>
                      </div>
                      <span className="ml-auto px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        APPROVED
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        Approved at <strong>{formatDateTime(result.approvedAt)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={() => { setResult(null); setManualToken(""); }}
                className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Scan Another Pass
              </button>
            </div>
          )}

          {!result.valid && (
            <div className="p-5">
              <button
                onClick={() => { setResult(null); setManualToken(""); }}
                className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
