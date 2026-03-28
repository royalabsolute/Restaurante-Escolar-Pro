import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Box, Card, CardContent, Button, Alert, Chip, Grid
} from '@mui/material';
import ApiService from 'services/ApiService';
import MainCard from 'components/Card/MainCard';
import PageHeader from 'components/common/PageHeader';
import StatCard from 'components/common/StatCard';
import { 
    QrCodeScanner as QrIcon, 
    CheckCircle as CheckIcon,
    ConfirmationNumber as SuplenteIcon,
    Group as StudentsIcon
} from '@mui/icons-material';

const EscanerDashboard = () => {
    const [conteoHoy, setConteoHoy] = useState(0);
    const [asistenciasHoy, setAsistenciasHoy] = useState(0);

    const loadStats = useCallback(async () => {
        try {
            const [conteoRes, statsRes] = await Promise.allSettled([
                ApiService.get('/suplente-qr/conteo-hoy'),
                ApiService.get('/students/stats/today')
            ]);

            if (conteoRes.status === 'fulfilled' && conteoRes.value?.data?.data) {
                setConteoHoy(conteoRes.value.data.data.total || 0);
            }
            if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data) {
                setAsistenciasHoy(statsRes.value.data.data.total || 0);
            }
        } catch (err) {
            console.error('Error cargando stats:', err);
        }
    }, []);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, [loadStats]);

    const fecha = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            <PageHeader 
                title="Restaurante Escolar"
                subtitle={fecha.charAt(0).toUpperCase() + fecha.slice(1)}
            />

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                    <StatCard 
                        title="Estudiantes Atendidos"
                        value={asistenciasHoy}
                        icon={StudentsIcon}
                        color="primary"
                        description="Registros de asistencia hoy"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <StatCard 
                        title="Suplentes Hoy"
                        value={conteoHoy}
                        icon={SuplenteIcon}
                        color="warning"
                        description="Bonos QR de emergencia"
                    />
                </Grid>
            </Grid>

            <MainCard sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'text.secondary' }}>
                        Acceso Rápido al Registro
                    </Typography>
                    
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<QrIcon sx={{ fontSize: 32 }} />}
                        href="/app/asistencia/scanner"
                        sx={{
                            py: 3, px: 5, fontSize: '1.25rem', borderRadius: 4,
                            width: '100%',
                            boxShadow: '0 8px 16px rgba(74, 144, 226, 0.25)',
                            textTransform: 'none',
                            fontWeight: 800,
                            letterSpacing: 0.5,
                            '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: '0 12px 20px rgba(74, 144, 226, 0.35)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        ABRIR ESCÁNER DE ASISTENCIA
                    </Button>

                    <Alert 
                        severity="info" 
                        icon={<CheckIcon />} 
                        sx={{ 
                            mt: 5, 
                            textAlign: 'left', 
                            borderRadius: 3,
                            '& .MuiAlert-message': { fontWeight: 500 }
                        }}
                    >
                        Escanee el código QR institucional para registrar el consumo. Asegúrese de una buena iluminación.
                    </Alert>
                </Box>
            </MainCard>
        </Box>
    );
};

export default EscanerDashboard;
