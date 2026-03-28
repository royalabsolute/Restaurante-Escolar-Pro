import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const ScannerFeedback = ({ status, message, active }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (active) {
            setVisible(true);
            playNotificationSound(status);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [active, status]);

    const playNotificationSound = (type) => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (type === 'success') {
                // Sonido de éxito: bip corto y alegre (frecuencias altas)
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);
            } else if (type === 'error' || type === 'already_registered') {
                // Sonido de error: bip bajo y seco
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
                oscillator.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.1); // A2
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
            } else if (type === 'warning') {
                // Sonido de advertencia: tono medio doble
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);

                setTimeout(() => {
                    const osc2 = audioCtx.createOscillator();
                    const gain2 = audioCtx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioCtx.destination);
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(440, audioCtx.currentTime);
                    gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    osc2.start();
                    osc2.stop(audioCtx.currentTime + 0.1);
                }, 150);
            }
        } catch (e) {
            console.warn('Audio feedback failed:', e);
        }
    };

    if (!visible) return null;

    const getOverlayColor = () => {
        switch (status) {
            case 'success': return 'rgba(76, 175, 80, 0.4)'; // Verde
            case 'error': return 'rgba(244, 67, 54, 0.4)'; // Rojo
            case 'already_registered': return 'rgba(255, 152, 0, 0.4)'; // Naranja
            case 'warning': return 'rgba(255, 235, 59, 0.4)'; // Amarillo
            default: return 'transparent';
        }
    };

    return (
        <Box sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: getOverlayColor(),
            backdropFilter: 'blur(4px)',
            animation: 'fade-in-out 2s forwards',
            pointerEvents: 'none',
            '@keyframes fade-in-out': {
                '0%': { opacity: 0 },
                '20%': { opacity: 1 },
                '80%': { opacity: 1 },
                '100%': { opacity: 0 }
            }
        }}>
            <Box sx={{
                p: 4,
                borderRadius: 4,
                bgcolor: 'background.paper',
                boxShadow: 24,
                textAlign: 'center',
                transform: 'scale(1)',
                animation: 'pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '@keyframes pop-in': {
                    '0%': { transform: 'scale(0.5)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 }
                }
            }}>
                <Typography variant="h3" fontWeight="bold" color={status === 'error' ? 'error' : 'primary'}>
                    {status === 'success' ? '✅' : status === 'already_registered' ? '⚠️' : '❌'}
                </Typography>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {message}
                </Typography>
            </Box>
        </Box>
    );
};

export default ScannerFeedback;
