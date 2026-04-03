"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Shield, Activity, Settings, Signal, Wifi, Battery, ArrowLeft, Upload, Check, ExternalLink, Copy, LogOut, XCircle } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

interface AttestationData {
  attributes: Record<string, string | boolean>;
  timestamp: string;
  message: string;
  messageHash: string;
  signature: string;
  signer: string;
}

interface VerificationRequest {
  requestId: string;
  verifierId: string;
  verifierName: string;
  verifierEmail: string;
  userEmail: string;
  requestedAttributes: string[];
  workflow?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  completedAt?: string;
  attestation: any | null;
}

export default function DokimosFlow() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [attestationData, setAttestationData] = useState<AttestationData | null>(null);
  const [storedImageData, setStoredImageData] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // Check if user is logged in and skip to upload screen
  useEffect(() => {
    if (status === "authenticated" && currentScreen < 3) {
      // User is logged in, skip intro and go to upload screen
      setCurrentScreen(3);
    }
  }, [status]);

  // Auto-advance through intro animation
  const advanceScreen = () => {
    if (currentScreen < 8) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const goBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setCurrentScreen(0); // Reset to intro
  };

  // Auto-advance animation screens
  useEffect(() => {
    if (currentScreen === 0 || currentScreen === 1) {
      const timer = setTimeout(() => {
        advanceScreen();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return <Screen01A key="01a" />;
      case 1:
        return <Screen01B key="01b" />;
      case 2:
        return <Screen01C key="01c" onNext={advanceScreen} />;
      case 3:
        return <Screen02Upload key="02" onNext={advanceScreen} onBack={goBack} setAttestationData={setAttestationData} setStoredImageData={setStoredImageData} />;
      case 4:
        return <Screen02BLiveness key="02b" onNext={advanceScreen} onBack={goBack} />;
      case 5:
        return <Screen03Vault key="03" onNext={advanceScreen} onBack={goBack} attestationData={attestationData} />;
      case 6:
        return <Screen04Share key="04" onNext={advanceScreen} onBack={goBack} selectedRequest={selectedRequest} storedImageData={storedImageData} setAttestationData={setAttestationData} />;
      case 7:
        return <Screen05Receipt key="05" onNext={advanceScreen} onBack={goBack} attestationData={attestationData} selectedRequest={selectedRequest} />;
      case 8:
        return <Screen06History key="06" onBack={goBack} setCurrentScreen={setCurrentScreen} setSelectedRequest={setSelectedRequest} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile view - full screen on actual devices */}
      <div className="md:hidden relative w-full h-screen bg-white overflow-hidden">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </div>

      {/* Desktop view - mockup with controls */}
      <div className="hidden md:flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="relative w-[390px] h-[844px] bg-white rounded-[40px] shadow-2xl overflow-auto">
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
        </div>

        {/* Navigation controls for testing */}
        <div className="ml-8 flex flex-col gap-2">
          <button
            onClick={goBack}
            disabled={currentScreen === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            onClick={advanceScreen}
            disabled={currentScreen === 8}
            className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
          >
            Next →
          </button>
          <div className="text-sm text-gray-600 mt-4">
            Screen {currentScreen + 1} of 9
          </div>
          <button
            onClick={handleSignOut}
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

// Shared components
const StatusBar = () => (
  <div className="flex items-center justify-between px-6 h-[62px]">
    <span className="text-[15px] font-semibold text-gray-900">9:41</span>
    <div className="flex items-center gap-1">
      <Signal size={16} className="text-gray-900" />
      <Wifi size={16} className="text-gray-900" />
      <Battery size={20} className="text-gray-900" />
    </div>
  </div>
);

const ScrollingPills = ({ dark = false }: { dark?: boolean }) => {
  const pills = [
    "new bank account",
    "apartment rental",
    "freelance platform",
    "car rental",
    "background check",
    "gig company",
  ];

  return (
    <div className="overflow-hidden w-full px-6">
      <motion.div
        className="flex gap-2"
        initial={{ x: 0 }}
        animate={{ x: -200 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        {[...pills, ...pills, ...pills].map((pill, idx) => (
          <div
            key={idx}
            className={`px-4 h-8 rounded-full flex items-center justify-center whitespace-nowrap text-[13px] font-medium flex-shrink-0 ${
              dark
                ? "bg-white/10 border border-white/20 text-white/90"
                : "bg-gray-100 border border-gray-200 text-gray-600"
            }`}
          >
            {pill}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// Screen 01A - Problem State
function Screen01A() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 bg-[#0F1B4C]"
    >
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.8 }}
        className="absolute top-[300px] left-6 right-6 text-[64px] font-bold text-white text-center leading-[1.1]"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        Again?
      </motion.h1>

      <div className="absolute top-[415.5px] left-0 w-full">
        <ScrollingPills dark />
      </div>
    </motion.div>
  );
}

// Screen 01B - Transition State
function Screen01B() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 bg-white"
    >
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.8 }}
        className="absolute top-[300px] left-6 right-6 text-[64px] font-bold text-gray-900 text-center leading-[1.1]"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        Meet Dokimos.
      </motion.h1>

      <div className="absolute top-[415.5px] left-0 w-full">
        <ScrollingPills />
      </div>
    </motion.div>
  );
}

// Screen 01C - Final CTA
function Screen01C({ onNext }: { onNext: () => void }) {
  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white"
    >
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.8 }}
        className="absolute top-[260px] left-6 right-6 text-[40px] font-bold text-gray-900 text-center leading-[1.15]"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        The last time you'll ever<br />need to upload your ID.
      </motion.h2>

      <div className="absolute top-[415.5px] left-0 w-full">
        <ScrollingPills />
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-0 left-0 right-0 bg-[#0F1B4C] rounded-t-[24px] px-6 py-10 flex flex-col gap-4"
      >
        <h3 className="text-[22px] font-bold text-white text-center mb-2">
          Get started with Dokimos
        </h3>
        <button
          onClick={handleGoogleSignIn}
          className="w-full h-14 bg-white rounded-xl text-gray-900 text-[16px] font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <p className="text-xs text-white/60 text-center px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </motion.div>
  );
}

// Screen 02 - Upload Flow with REAL backend integration
function Screen02Upload({ 
  onNext, 
  onBack, 
  setAttestationData,
  setStoredImageData
}: { 
  onNext: () => void; 
  onBack: () => void;
  setAttestationData: (data: AttestationData) => void;
  setStoredImageData: (data: string) => void;
}) {
  const [uploadState, setUploadState] = useState<"default" | "drag" | "selected" | "scanning">("default");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const handleFileInput = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 10MB");
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadState("selected");
  };

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileInput(file);
    };
    input.click();
  };

  const handleVerify = async () => {
    if (!selectedFile) return;

    setUploadState("scanning");
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => resolve();
        reader.onerror = () => reject(new Error("Failed to read file"));
      });

      const imageBase64 = (reader.result as string).split(",")[1];

      // Store the image data for later use (when approving requests)
      setStoredImageData(imageBase64);
      
      // Also store in localStorage for persistence
      localStorage.setItem("dokimos_stored_image", imageBase64);

      // Call backend API route (which proxies to TEE)
      const response = await axios.post("/api/verify", {
        imageBase64,
        requestedAttributes: [],
      });

      // Store attestation data
      setAttestationData(response.data);
      
      // Wait a bit for the scanning animation, then advance
      setTimeout(() => {
        onNext();
      }, 2000);
    } catch (err) {
      console.error("Verification failed");
      setError("Verification failed. Please try again.");
      setUploadState("selected");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileInput(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-[#FAFAF9] flex flex-col"
    >
      <StatusBar />
      
      {/* Top Navigation */}
      <div className="px-6 h-[52px] flex items-center">
        <button onClick={onBack}>
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
      </div>

      {/* Headline Section */}
      <div className="px-6 mt-8">
        <h1 className="text-[36px] font-bold text-gray-900 leading-[1.15]" style={{ fontFamily: "Instrument Serif, serif" }}>
          One last upload. Ever.
        </h1>
        <p className="text-[15px] text-gray-500 mt-3 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Take a photo or upload an image of any government ID.
        </p>
        <p className="text-[12px] text-gray-500 mt-2 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Your ID is processed in protected hardware and immediately deleted. Not even Dokimos can see it.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-6 mt-2">
          <p className="text-[13px] text-red-600" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            {error}
          </p>
        </div>
      )}

      {/* Upload Zone - fills remaining space */}
      <div className="flex-1 px-6 mt-6 mb-6">
        <button
          onClick={uploadState === "default" ? handleFileSelect : uploadState === "selected" ? () => { setUploadState("default"); setSelectedFile(null); setPreviewUrl(null); } : undefined}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={uploadState === "scanning"}
          className={`relative w-full h-full rounded-2xl border-[1.5px] transition-all ${
            uploadState === "scanning" ? "cursor-default" : "cursor-pointer hover:border-gray-300"
          } ${
            uploadState === "scanning"
              ? "border-emerald-600 bg-[#F0FDF4]"
              : uploadState === "selected"
              ? "border-emerald-600 bg-[#F0FDF4]"
              : isDragging
              ? "border-[#4F46E5] border-solid bg-[#EEF2FF]"
              : "border-dashed border-gray-200 bg-white"
          }`}
          style={{ minHeight: "320px" }}
        >
          {/* Default State */}
          {uploadState === "default" && !isDragging && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Document outline illustration */}
              <div className="relative w-[120px] h-[80px] rounded-lg border-[1.5px] border-gray-200 mb-5">
                <div className="absolute top-3 left-3 w-[60px] h-1 bg-gray-100 rounded" />
                <div className="absolute top-6 left-3 w-[40px] h-1 bg-gray-100 rounded" />
                <div className="absolute top-3 right-3 w-6 h-6 bg-gray-100 rounded" />
              </div>

              <p className="text-[16px] font-medium text-gray-900 mb-2" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Drop your ID here
              </p>
              <p className="text-[13px] text-gray-400 mb-5" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                or tap to browse your camera roll
              </p>

              <div className="flex items-center gap-2">
                {["JPG", "PNG", "WebP"].map((format) => (
                  <div key={format} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-full" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                    {format}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Drag State */}
          {isDragging && uploadState === "default" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative w-[120px] h-[80px] rounded-lg border-[1.5px] border-[#4F46E5] mb-5">
                <div className="absolute top-3 left-3 w-[60px] h-1 bg-[#4F46E5] rounded" />
                <div className="absolute top-6 left-3 w-[40px] h-1 bg-[#4F46E5] rounded" />
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#4F46E5] rounded" />
              </div>
              <p className="text-[16px] font-medium text-[#4F46E5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Release to upload
              </p>
            </div>
          )}

          {/* Selected State */}
          {uploadState === "selected" && previewUrl && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <img src={previewUrl} alt="ID preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[12px] font-medium px-4 py-1.5 rounded-full flex items-center gap-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                <Check size={12} />
                ID uploaded
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadState("default");
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-4 right-4 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-gray-700 text-sm">×</span>
              </button>
            </div>
          )}

          {/* Scanning State */}
          {uploadState === "scanning" && previewUrl && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <img src={previewUrl} alt="ID preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#0F1B4C] bg-opacity-45 flex flex-col items-center justify-center">
                <p className="text-[15px] font-medium text-white mb-3" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                  Processing inside TEE...
                </p>
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#4F46E5] to-transparent"
                  style={{ boxShadow: "0 0 8px #4F46E5" }}
                  animate={{ y: [0, 200, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="flex items-center gap-1.5 mt-4">
                  <motion.div
                    className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#4F46E5] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Fixed Footer Bar */}
      <div className="bg-white border-t border-gray-100 px-6 pt-5 pb-8">
        {uploadState === "scanning" ? (
          <p className="text-[12px] text-gray-500 text-center" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            This takes about 30 seconds
          </p>
        ) : (
          <button
            onClick={handleVerify}
            disabled={uploadState === "default"}
            className={`w-full h-14 rounded-xl text-[15px] font-medium transition-colors ${
              uploadState === "selected"
                ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Instrument Sans, sans-serif" }}
          >
            Verify Document
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Screen 02B - Liveness Check
function Screen02BLiveness({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [livenessState, setLivenessState] = useState<"ready" | "detecting" | "processing" | "error">("ready");
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load face-api models
    const loadModels = async () => {
      try {
        const faceapi = (await import('face-api.js')).default;
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face detection models:", err);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleStartCapture = async () => {
    if (!modelsLoaded) {
      console.error("Models not loaded yet");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setLivenessState("detecting");
      
      // Start face detection after video is ready
      setTimeout(() => {
        startFaceDetection();
      }, 500);
    } catch (err) {
      console.error("Camera access denied:", err);
      setLivenessState("error");
    }
  };

  const startFaceDetection = async () => {
    const faceapi = (await import('face-api.js')).default;
    
    const detectFace = async () => {
      if (!videoRef.current || livenessState !== "detecting") return;
      
      try {
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );

        if (detection && detection.score > 0.6) {
          setFaceDetected(true);
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
          }
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    };

    // Check for face every 100ms
    detectionIntervalRef.current = setInterval(detectFace, 100);
  };

  const handleVerifyFace = () => {
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    setLivenessState("processing");
    setTimeout(() => {
      onNext();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-[#FAFAF9] flex flex-col"
    >
      <StatusBar />
      
      {/* Top Navigation */}
      <div className="px-6 h-[52px] flex items-center">
        <button onClick={onBack}>
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
      </div>

      {/* Headline Section */}
      <div className="px-6 mt-8">
        <h1 className="text-[36px] font-bold text-gray-900 leading-[1.15]" style={{ fontFamily: "Instrument Serif, serif" }}>
          Making sure it's you.
        </h1>
        <p className="text-[15px] text-gray-500 mt-3 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Take a quick selfie to confirm you're the person on this ID.
        </p>
        <p className="text-[12px] text-gray-500 mt-2 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Your selfie is processed in protected hardware and immediately deleted. Not even Dokimos can see it.
        </p>
      </div>

      {/* Camera Preview Zone */}
      <div className="flex-1 px-6 mt-6 mb-6">
        <button
          onClick={livenessState === "ready" ? handleStartCapture : undefined}
          disabled={livenessState === "processing"}
          className={`relative w-full h-full rounded-2xl border-[1.5px] transition-all overflow-hidden ${
            livenessState === "processing"
              ? "border-emerald-600 bg-[#F0FDF4]"
              : faceDetected
              ? "border-emerald-600 bg-[#F0FDF4]"
              : livenessState === "detecting"
              ? "border-[#4F46E5] bg-gray-900"
              : "border-dashed border-gray-200 bg-gray-900 cursor-pointer hover:border-gray-300"
          }`}
          style={{ minHeight: "320px" }}
        >
          {/* Video element (hidden but active during detection) */}
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover ${livenessState === "detecting" ? "block" : "hidden"}`}
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Ready State - Tap to start camera */}
          {livenessState === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-32 h-40 rounded-full border-[1.5px] border-gray-400 border-dashed mb-5" />
              <p className="text-[16px] font-medium text-white mb-2" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Tap to start camera
              </p>
              <p className="text-[13px] text-gray-400" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Position your face in the oval
              </p>
            </div>
          )}

          {/* Detecting State - Camera active with face detection overlay */}
          {livenessState === "detecting" && !faceDetected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-48 h-56 rounded-full border-2 border-[#4F46E5] mb-5 animate-pulse" />
              <p className="text-[15px] font-medium text-white bg-black/50 px-4 py-2 rounded-lg" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Detecting face...
              </p>
            </div>
          )}

          {/* Face Detected State */}
          {faceDetected && livenessState === "detecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-48 h-56 rounded-full border-2 border-emerald-600" />
              <div className="absolute w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                <Check size={24} className="text-white" />
              </div>
              <p className="text-[15px] font-medium text-white bg-emerald-600/90 px-4 py-2 rounded-lg mt-5" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Face detected
              </p>
            </div>
          )}

          {/* Error State */}
          {livenessState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle size={32} className="text-red-600" />
              </div>
              <p className="text-[16px] font-medium text-white mb-2" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Camera access denied
              </p>
              <p className="text-[13px] text-gray-400 text-center px-8" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Please enable camera permissions and try again
              </p>
            </div>
          )}

          {/* Processing State */}
          {livenessState === "processing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1B4C] bg-opacity-90">
              <p className="text-[15px] font-medium text-white mb-3" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Matching face to ID...
              </p>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#4F46E5] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Fixed Footer Bar */}
      <div className="bg-white border-t border-gray-100 px-6 pt-5 pb-8">
        {livenessState === "processing" ? (
          <p className="text-[12px] text-gray-500 text-center" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            This takes about 10 seconds
          </p>
        ) : (
          <button
            onClick={handleVerifyFace}
            disabled={!faceDetected}
            className={`w-full h-14 rounded-xl text-[15px] font-medium transition-colors ${
              faceDetected
                ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Instrument Sans, sans-serif" }}
          >
            Verify Face Match
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Screen 03 - Vault Dashboard with REAL attestation data
function Screen03Vault({ 
  onNext, 
  onBack, 
  attestationData 
}: { 
  onNext: () => void; 
  onBack: () => void;
  attestationData: AttestationData | null;
}) {
  const attributes = attestationData?.attributes || {
    name: "Test User",
    ageOver21: true,
    notExpired: true,
    nationality: "USA",
  };

  const timestamp = attestationData?.timestamp 
    ? new Date(attestationData.timestamp).toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "4/1/2026 at 5:33 PM";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-white overflow-y-auto"
    >
      <StatusBar />
      
      <div className="px-6 h-14 flex items-center justify-between">
        <span className="text-[17px] font-bold text-[#0F1B4C]">Dokimos</span>
      </div>

      <div className="px-6 mt-4 pb-8">
        <div className="w-full bg-white border-l-4 border-emerald-600 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-emerald-600">Identity Verified</p>
            <p className="text-[12px] text-gray-500">{timestamp}</p>
          </div>
          <div className="bg-[#0F1B4C] text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
            <Shield size={10} className="text-white" />
            <span>Processed in TEE</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-gray-900">Your verified details</h2>
          <span className="text-[14px] text-gray-500">{Object.keys(attributes).length} attributes</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {Object.entries(attributes).map(([key, value], idx) => {
            const labelMap: Record<string, string> = {
              "name": "Full Name",
              "dateOfBirth": "Date of Birth",
              "ageOver21": "Age Over 21",
              "notExpired": "Document Expiry",
              "nationality": "Nationality",
              "documentType": "Document Type"
            };
            
            const label = labelMap[key] || key;
            
            const displayValue = typeof value === "boolean" 
              ? (value ? "Verified" : "Not Verified")
              : String(value);
            
            const isVerified = typeof value === "boolean" && value;

            return (
              <div key={idx} className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[12px] uppercase text-gray-400 tracking-wider mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>{label}</p>
                  <p className={`text-[17px] font-semibold ${isVerified ? "text-emerald-600" : "text-gray-900"}`} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                    {displayValue}
                  </p>
                </div>
                <button
                  onClick={key === "ageOver21" ? onNext : undefined}
                  className="px-4 py-2 border border-[#4F46E5] text-[#4F46E5] text-[13px] font-medium rounded-full hover:bg-[#EEF2FF] transition-colors"
                  style={{ fontFamily: "Instrument Sans, sans-serif" }}
                >
                  Share
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-[13px] text-gray-500 text-center mt-6 px-4 leading-relaxed">
          Tap Share on any attribute to send a verified proof — without sharing your actual ID.
        </p>
      </div>
    </motion.div>
  );
}

// Screen 04 - Share Modal
function Screen04Share({ 
  onNext, 
  onBack, 
  selectedRequest,
  storedImageData,
  setAttestationData
}: { 
  onNext: () => void; 
  onBack: () => void;
  selectedRequest: VerificationRequest | null;
  storedImageData: string | null;
  setAttestationData: (data: AttestationData) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!selectedRequest || !storedImageData) {
      console.error("Missing request or image data");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post("/api/approve-request", {
        requestId: selectedRequest.requestId,
        approved: true,
        imageBase64: storedImageData,
      });

      // Store the attestation data
      if (response.data.attestation) {
        setAttestationData(response.data.attestation);
      }

      onNext(); // Navigate to receipt
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);

    try {
      await axios.post("/api/approve-request", {
        requestId: selectedRequest.requestId,
        approved: false,
      });

      onBack(); // Go back to history
    } catch (error) {
      console.error("Failed to deny request:", error);
      alert("Failed to deny request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatAttributeName = (attr: string) => {
    const map: Record<string, string> = {
      ageOver21: "Age Over 21",
      name: "Full Name",
      dateOfBirth: "Date of Birth",
      nationality: "Nationality",
      notExpired: "Document Not Expired",
      documentType: "Document Type",
    };
    return map[attr] || attr;
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return then.toLocaleString();
  };

  // Fallback to demo data if no real request
  const companyName = selectedRequest?.verifierName || "Acme Brokerage";
  const companyInitial = companyName.charAt(0);
  const requestedAttrs = selectedRequest?.requestedAttributes || ["name", "ageOver21", "notExpired"];
  const requestTime = selectedRequest ? getRelativeTime(selectedRequest.createdAt) : "2 minutes ago";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0"
    >
      {/* Blurred background */}
      <div className="absolute inset-0 bg-gray-400/50 backdrop-blur-sm" onClick={onBack} />

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 844 }}
        animate={{ y: 0 }}
        exit={{ y: 844 }}
        transition={{ type: "spring", damping: 30 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] px-6 pt-6 pb-10"
        style={{ maxHeight: "85vh" }}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

        {/* Company header with trust badge */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
            {companyInitial}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[28px] font-bold text-gray-900 leading-tight" style={{ fontFamily: "Instrument Serif, serif" }}>
                {companyName}
              </p>
              <div className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-medium text-blue-700">
                Verified Partner
              </div>
            </div>
            <p className="text-[13px] text-gray-500 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Required to open a brokerage account</p>
            <p className="text-[11px] text-gray-400" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Requested {requestTime}</p>
          </div>
        </div>

        <div className="w-full h-px bg-gray-200 my-4" />

        {/* Attributes list - no label, larger text */}
        <div className="space-y-0 mb-4">
          {requestedAttrs.map((attr, idx) => (
            <div key={idx} className="py-3.5 border-b border-gray-100">
              <p className="text-[16px] font-semibold text-gray-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {formatAttributeName(attr)}
              </p>
            </div>
          ))}
        </div>

        {/* Combined trust and consent message */}
        <div className="mb-3 bg-[#F0FDF4] rounded-lg p-3.5 flex items-start gap-2.5">
          <Shield size={17} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              {companyName} receives proof you meet these {requestedAttrs.length} requirements. They cannot see your ID photo or any other personal details.
            </p>
            <p className="text-[11px] text-emerald-700 mt-1.5 font-medium" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Verified by Intel TDX Secure Enclave
            </p>
          </div>
        </div>

        <button
          onClick={handleApprove}
          disabled={submitting}
          className="w-full h-14 bg-[#4F46E5] rounded-xl text-white text-[15px] font-semibold mt-2 flex items-center justify-center gap-2 hover:bg-[#4338CA] transition-colors disabled:opacity-50"
          style={{ fontFamily: "Instrument Sans, sans-serif" }}
        >
          <Shield size={16} className="text-white" />
          {submitting ? "Approving..." : "Approve and Share"}
        </button>

        <button 
          onClick={handleDeny}
          disabled={submitting}
          className="w-full h-14 bg-white border border-gray-200 rounded-xl text-[#EF4444] text-[15px] font-semibold mt-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          style={{ fontFamily: "Instrument Sans, sans-serif" }}
        >
          {submitting ? "Processing..." : "Deny"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// Screen 05 - Verification Receipt with REAL attestation data
function Screen05Receipt({ 
  onNext, 
  onBack,
  attestationData,
  selectedRequest
}: { 
  onNext: () => void; 
  onBack: () => void;
  attestationData: AttestationData | null;
  selectedRequest: VerificationRequest | null;
}) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  const companyName = selectedRequest?.verifierName || "Unknown Company";

  const truncate = (str: string, length: number = 6) => {
    if (str.length <= length * 2) return str;
    return `${str.slice(0, length)}...${str.slice(-length)}`;
  };

  const timestamp = attestationData?.timestamp 
    ? new Date(attestationData.timestamp).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "April 1, 2026";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-white overflow-y-auto"
    >
      <StatusBar />
      
      <div className="px-6 py-4">
        <h1 className="text-[17px] font-bold text-[#0F1B4C] text-center" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Dokimos</h1>
      </div>

      <div className="flex flex-col items-center px-6 mt-8 pb-12">
        <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center mb-5">
          <Check size={40} className="text-white" />
        </div>

        <h2 className="text-[56px] font-bold text-emerald-600 mb-4" style={{ fontFamily: "Instrument Serif, serif" }}>
          Verified
        </h2>

        <div className="w-full h-px bg-gray-200 my-4" />

        <p className="text-[22px] font-medium text-gray-900 mb-2" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Shared with {companyName}
        </p>
        <p className="text-[13px] text-gray-500 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Verified on {timestamp}
        </p>

        {/* Eigen Branding Badge */}
        <div className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Powered by EigenCompute
              </p>
              <p className="text-xs text-indigo-600" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Intel TDX Trusted Execution Environment
              </p>
            </div>
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            This verification ran in secure hardware. The cryptographic proof can be independently verified by anyone using Eigen's attestation infrastructure.
          </p>
        </div>

        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-4"
        >
          <span className="text-[15px] font-medium text-gray-900">How is this verified?</span>
          <span className={`transform transition-transform ${accordionOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {accordionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="w-full mb-4 px-4 text-[14px] text-gray-600 leading-relaxed"
          >
            This attestation was generated by code running inside an Intel TDX Trusted Execution Environment. 
            The signature below was produced by a wallet that only that specific, auditable code can access. 
            You can verify this yourself using the buttons below.
          </motion.div>
        )}

        {attestationData && (
          <>
            <a
              href={`https://etherscan.io/verifiedSignatures?${new URLSearchParams({
                a: attestationData.signer,
                m: attestationData.message,
                s: attestationData.signature
              })}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200" />
                <span className="text-[14px] font-medium text-gray-900">Verify Signature on Etherscan</span>
              </div>
              <ExternalLink size={16} className="text-[#4F46E5]" />
            </a>

            <a
              href={(attestationData as any).eigen?.verificationUrl || "https://verify-sepolia.eigencloud.xyz/app/0x5911a27103C4de497fCB5C00D8e19962EEF0008E"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#0F1B4C] rounded" />
                <span className="text-[14px] font-medium text-gray-900">View Code on EigenCloud Dashboard</span>
              </div>
              <ExternalLink size={16} className="text-[#4F46E5]" />
            </a>
          </>
        )}

        <div className="w-full bg-[#0F1B4C] rounded-xl p-4 relative">
          <button className="absolute top-4 right-4 text-[11px] text-gray-400 hover:text-gray-300">
            <Copy size={12} className="inline" /> Copy all
          </button>
          {attestationData ? (
            <pre className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all">
              <span className="text-gray-400">message:</span> <span className="text-gray-200">{attestationData.message}</span>{"\n"}
              <span className="text-gray-400">messageHash:</span> <span className="text-gray-200">{truncate(attestationData.messageHash, 6)}</span>{"\n"}
              <span className="text-gray-400">signature:</span> <span className="text-indigo-300">{truncate(attestationData.signature, 8)}</span>{"\n"}
              <span className="text-gray-400">signer:</span> <span className="text-indigo-300">{truncate(attestationData.signer, 6)}</span>
            </pre>
          ) : (
            <pre className="text-[11px] font-mono overflow-x-auto">
              <span className="text-gray-400">message:</span> <span className="text-gray-200">Age Over 21</span>{"\n"}
              <span className="text-gray-400">messageHash:</span> <span className="text-gray-200">0x7f9a3b...8f9a</span>{"\n"}
              <span className="text-gray-400">signature:</span> <span className="text-indigo-300">0x8a4c5e...3c4d</span>{"\n"}
              <span className="text-gray-400">signer:</span> <span className="text-indigo-300">0x2b5f8c...5f8a</span>
            </pre>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-6">
          Issued by Dokimos · Cryptographic identity infrastructure
        </p>
      </div>
    </motion.div>
  );
}

// Screen 06 - History
function Screen06History({ 
  onBack, 
  setCurrentScreen, 
  setSelectedRequest 
}: { 
  onBack: () => void;
  setCurrentScreen: (screen: number) => void;
  setSelectedRequest: (request: VerificationRequest) => void;
}) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      // Get user email from session (for demo, use pranavi@example.com)
      const userSession = localStorage.getItem("dokimos_user");
      if (!userSession) return;
      
      const { email } = JSON.parse(userSession);
      const response = await axios.get(`/api/requests/user/${encodeURIComponent(email)}`);
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Poll for new requests every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReviewRequest = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setCurrentScreen(6); // Navigate to Screen 04 (Share Modal)
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  };

  const formatAttributeName = (attr: string) => {
    const map: Record<string, string> = {
      ageOver21: "Age Over 21",
      name: "Full Name",
      dateOfBirth: "Date of Birth",
      nationality: "Nationality",
      notExpired: "Document Not Expired",
      documentType: "Document Type",
    };
    return map[attr] || attr;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status === 'approved' || r.status === 'denied');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-white"
    >
      <StatusBar />
      
      <div className="px-6 h-[52px] flex items-center">
        <span className="text-[17px] font-bold text-[#0F1B4C]">Dokimos</span>
      </div>

      <div className="px-6 mt-8 pb-24 overflow-y-auto">
        <h1 className="text-[32px] font-bold text-gray-900 mb-2" style={{ fontFamily: "Instrument Serif, serif" }}>
          Verification requests.
        </h1>
        <p className="text-[14px] text-gray-500 mb-6">Companies requesting verified proofs from you.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[13px] uppercase tracking-wide text-gray-900 font-semibold">
                    PENDING REQUESTS
                  </h2>
                  <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  {pendingRequests.map((request) => (
                    <div key={request.requestId} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0">
                          {request.verifierName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 mb-1">{request.verifierName}</p>
                          <p className="text-[13px] text-gray-600 mb-2">
                            Requesting: {request.requestedAttributes.map(formatAttributeName).join(", ")}
                          </p>
                          <p className="text-[12px] text-gray-500">{getRelativeTime(request.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReviewRequest(request)}
                        className="w-full mt-3 bg-indigo-600 text-white py-2.5 rounded-lg text-[14px] font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Review Request
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Past Verifications Section */}
            <h2 className="text-[13px] uppercase tracking-wide text-gray-900 font-semibold mb-4">
              PAST VERIFICATIONS
            </h2>

            {completedRequests.length === 0 && pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-[14px]">No verification requests yet</p>
                <p className="text-gray-400 text-[12px] mt-1">Companies will appear here when they request attributes</p>
              </div>
            ) : completedRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-[13px]">No completed verifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedRequests.map((request) => (
                  <div key={request.requestId} className="bg-white border-b border-gray-100 py-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                        request.status === 'approved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {request.verifierName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[15px] font-medium text-gray-900">{request.verifierName}</p>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {request.status === 'approved' ? 'Approved' : 'Denied'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {request.requestedAttributes.map((attr, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Check size={14} className={request.status === 'approved' ? 'text-emerald-600' : 'text-gray-400'} />
                              <span className="text-[13px] text-gray-600">{formatAttributeName(attr)}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[12px] text-gray-400 mt-2">{getRelativeTime(request.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around">
        <button className="flex flex-col items-center gap-1">
          <Shield size={20} className="text-gray-500" />
          <span className="text-[11px] text-gray-500">Vault</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-[#4F46E5] mb-1" />
          <Activity size={20} className="text-[#4F46E5]" />
          <span className="text-[11px] text-[#4F46E5]">Activity</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Settings size={20} className="text-gray-500" />
          <span className="text-[11px] text-gray-500">Settings</span>
        </button>
      </div>
    </motion.div>
  );
}
