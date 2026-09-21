"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

export default function CameraScanner({ onCapture }: { onCapture: (imageBlob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function setupCamera() {
      try {
        if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is blocked by your browser. This usually requires HTTPS.");
        }
        
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: "environment" } } 
        });
        setStream(mediaStream);
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access denied or failed", err);
        setErrorMessage(err.name ? (err.name + ": " + err.message) : String(err));
        setHasPermission(false);
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            onCapture(blob);
          }
        }, "image/jpeg", 0.85);
      }
    }
  }, [onCapture]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onCapture(file);
    }
  };

  if (hasPermission === null) {
    return (
      <div className="flex h-64 items-center justify-center bg-surface-solid/80 border border-border rounded-card text-ink-500 font-mono text-xs animate-pulse">
        Requesting camera access...
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex flex-col h-64 items-center justify-center bg-surface-solid/80 border-2 border-dashed border-border rounded-card text-ink-900 p-6 text-center space-y-4 shadow-soft">
        <p className="font-semibold text-tile-peach-fg text-sm">Live camera blocked</p>
        <p className="text-xs text-ink-500 bg-surface-tint p-2 rounded-control">{errorMessage || "Unknown error"}</p>
        <p className="text-xs text-ink-500">You can use your device's native camera instead.</p>
        
        <label className="btn btn--primary cursor-pointer shadow-xs">
          <span>Open native camera</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-card shadow-soft border border-border bg-ink-900">
      {/* Video Stream */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-auto object-cover"
        style={{ minHeight: "300px" }}
      />
      
      {/* Scanning Overlay (Targeting Box) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-3/4 h-1/2 border-2 border-lime-500 rounded-panel shadow-[0_0_0_9999px_rgba(26,26,51,0.5)]">
          <div className="absolute top-2 left-0 w-full text-center text-lime-500 text-[11px] font-mono font-medium animate-pulse">
            Align label here
          </div>
        </div>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center pb-3 z-10">
        <button 
          onClick={handleCapture}
          className="w-16 h-16 rounded-full bg-surface-solid border-4 border-white/80 hover:bg-surface-tint active:scale-95 transition-transform shadow-frame flex items-center justify-center"
          aria-label="Take photo"
        >
          <div className="w-12 h-12 rounded-full bg-lime-500 shadow-inner" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
