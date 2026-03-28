import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

const QRScannerEngine = ({ onScan, active = true, facingMode = 'environment' }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const startScanner = useCallback(async () => {
        if (!active) return;

        setLoading(true);
        setError(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("El navegador bloquea la cámara por seguridad (requiere HTTPS o Localhost).");
            }

            const constraints = {
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setLoading(false);
                requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error('QR Scanner Engine Error:', err);
            setError(handleCameraError(err));
            setLoading(false);
        }
    }, [active, facingMode, onScan]);

    const tick = () => {
        if (!active || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
            if (active) requestAnimationFrame(tick);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
            onScan(code.data);
        }

        if (active) {
            requestAnimationFrame(tick);
        }
    };

    const handleCameraError = (err) => {
        if (err.name === 'NotAllowedError') return 'Acceso a la cámara denegado.';
        if (err.name === 'NotFoundError') return 'No se detectó ninguna cámara.';
        return `Error de cámara: ${err.message}`;
    };

    useEffect(() => {
        startScanner();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [startScanner]);

    return (
        <Box sx={{ position: 'relative', width: '100%', maxWidth: '500px', mx: 'auto', overflow: 'hidden', borderRadius: 2, bgcolor: 'black', aspectRatio: '4/3' }}>
            {loading && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, bgcolor: 'rgba(0,0,0,0.5)' }}>
                    <CircularProgress color="primary" />
                </Box>
            )}

            {error ? (
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            ) : (
                <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    playsInline
                />
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Guía visual del escáner */}
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: '70%',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 2,
                pointerEvents: 'none',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    width: '100%',
                    height: '2px',
                    bgcolor: 'primary.main',
                    boxShadow: '0 0 10px #2196f3',
                    animation: 'scan-line 2s linear infinite'
                },
                '@keyframes scan-line': {
                    '0%': { top: '0%' },
                    '100%': { top: '100%' }
                }
            }} />
        </Box>
    );
};

export default QRScannerEngine;
