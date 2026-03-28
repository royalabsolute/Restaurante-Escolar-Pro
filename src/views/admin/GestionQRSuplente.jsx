import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Box, Card, CardContent, Button, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableHead, TableBody, TableRow, TableCell,
    Chip, IconButton, Tooltip, CircularProgress, Divider,
    TableContainer, Paper, useMediaQuery
} from '@mui/material';
import {
    QrCode as QrIcon,
    Refresh as RefreshIcon,
    Print as PrintIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import ApiService from 'services/ApiService';
import { useNotification } from 'contexts/NotificationContext';

// 🔥 COMPONENTE DE TARJETA DE ESTADÍSTICA REUTILIZABLE
const StatCard = ({ title, value, icon: Icon, color, loading }) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                    borderColor: 'primary.light'
                }
            }}
        >
            <Box
                sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: `${color}.50`,
                    color: `${color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Icon fontSize="medium" />
            </Box>
            <Box flex={1}>
                <Typography variant="caption" color="textSecondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1, mt: 0.5, color: '#1e293b' }}>
                    {loading ? <CircularProgress size={20} /> : value}
                </Typography>
            </Box>
        </Paper>
    );
};


const GestionQRSuplente = () => {
    const [qrActivo, setQrActivo] = useState(null);
    const [conteoHoy, setConteoHoy] = useState(0);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [regenerarDialog, setReGenerarDialog] = useState(false);
    const [regenerando, setRegenerando] = useState(false);
    const isMobile = useMediaQuery('(max-width:600px)');
    const { showNotification } = useNotification();

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            const [qrRes, conteoRes, histRes] = await Promise.allSettled([
                ApiService.get('/suplente-qr/activo'),
                ApiService.get('/suplente-qr/conteo-hoy'),
                ApiService.get('/suplente-qr/historial')
            ]);

            if (qrRes.status === 'fulfilled' && qrRes.value?.data) {
                setQrActivo(qrRes.value.data);
            }
            if (conteoRes.status === 'fulfilled' && conteoRes.value?.data) {
                setConteoHoy(conteoRes.value.data.total || 0);
            }
            if (histRes.status === 'fulfilled' && histRes.value?.data) {
                setHistorial(histRes.value.data || []);
            }
        } catch (err) {
            console.error('Error cargando datos:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const generarQR = async () => {
        try {
            const res = await ApiService.post('/suplente-qr/generar');
            if (res?.data) {
                setQrActivo(res.data);
                showNotification('QR de suplente generado exitosamente', 'success');
                cargarDatos();
            }
        } catch (err) {
            showNotification('Error al generar QR', 'error');
        }
    };

    const regenerarQR = async () => {
        setRegenerando(true);
        try {
            const res = await ApiService.post('/suplente-qr/regenerar');
            if (res?.data) {
                setQrActivo(res.data);
                showNotification('QR regenerado. El anterior fue invalidado.', 'success');
                cargarDatos();
            }
        } catch (err) {
            showNotification('Error al regenerar QR', 'error');
        } finally {
            setRegenerando(false);
            setReGenerarDialog(false);
        }
    };

    const imprimirQR = () => {
        const printWindow = window.open('', '_blank');
        const svg = document.getElementById('qr-suplente-svg');
        if (!svg || !printWindow) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>QR Suplente - Restaurante Escolar</title></head>
      <body style="text-align:center;font-family:Arial,sans-serif;padding:40px;">
        <h1>QR DE SUPLENTE</h1>
        <h3>Restaurante Escolar</h3>
        <div style="margin:30px auto;">${svgData}</div>
        <p style="font-size:12px;color:#666;">Escanear este código para registrar un suplente</p>
        <p style="font-size:10px;color:#999;">Generado: ${new Date().toLocaleDateString('es-CO')}</p>
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    mb: 5
                }}>
                    <Box>
                        <Typography variant="h2" sx={{
                            fontWeight: 800,
                            color: '#1e293b',
                            letterSpacing: -1,
                            mb: 0.5
                        }}>
                            GESTIÓN DE QR SUPLENTE
                        </Typography>
                        <Typography variant="body1" color="textSecondary" fontWeight="500">
                            Control de acceso para personal externo y sustituciones temporales
                        </Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <StatCard
                            title="Suplentes Hoy"
                            value={conteoHoy}
                            icon={HistoryIcon}
                            color="primary"
                            loading={loading}
                        />
                    </Box>
                </Box>

                {/* QR Activo - Panel Centrado */}
                <Paper elevation={0} sx={{
                    p: 4,
                    borderRadius: 5,
                    border: '1px solid',
                    borderColor: 'grey.100',
                    textAlign: 'center',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    mb: 5
                }}>
                    {qrActivo ? (
                        <Box>
                            <Typography variant="h6" fontWeight="700" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
                                <CheckIcon /> QR DE SUPLENTE ACTIVO
                            </Typography>

                            <Paper elevation={0} sx={{
                                display: 'inline-block',
                                p: 3,
                                bgcolor: 'white',
                                borderRadius: 4,
                                border: '2px solid',
                                borderColor: 'grey.200',
                                mb: 3,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
                            }}>
                                <QRCodeSVG
                                    id="qr-suplente-svg"
                                    value={qrActivo.codigo_qr}
                                    size={isMobile ? 200 : 250}
                                    level="H"
                                    includeMargin
                                />
                            </Paper>

                            <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 4 }}>
                                Generado el: {new Date(qrActivo.fecha_generacion).toLocaleString('es-CO')}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<PrintIcon />}
                                    onClick={imprimirQR}
                                    sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
                                >
                                    Imprimir Credencial
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    color="warning"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => setReGenerarDialog(true)}
                                    sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
                                >
                                    Regenerar Código
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ py: 4 }}>
                            <Alert severity="warning" sx={{ mb: 4, borderRadius: 3, fontWeight: 500 }}>
                                No hay un código QR de suplente activo para el día de hoy.
                            </Alert>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<QrIcon />}
                                onClick={generarQR}
                                sx={{ borderRadius: 3, px: 5, py: 1.5, fontWeight: 800, fontSize: '1.1rem' }}
                            >
                                Generar Nuevo QR
                            </Button>
                        </Box>
                    )}
                </Paper>

                <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 2, display: 'flex' }}>
                        <HistoryIcon />
                    </Box>
                    Historial de Uso
                </Typography>

                {historial.length > 0 ? (
                    <Paper elevation={0} sx={{
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'grey.100',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: '700', color: 'text.secondary' } }}>
                                        <TableCell>Fecha de Operación</TableCell>
                                        <TableCell align="right">Total de Suplentes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historial.map((row) => (
                                        <TableRow key={row.fecha} hover>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                {new Date(row.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${row.total} Registros`}
                                                    color="primary"
                                                    size="small"
                                                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                ) : (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                        <Typography color="text.secondary" fontWeight="500">
                            No se han registrado usos del QR de suplente todavía.
                        </Typography>
                    </Paper>
                )}
            </Box>

            <Dialog
                open={regenerarDialog}
                onClose={() => setReGenerarDialog(false)}
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800, pt: 3 }}>
                    <WarningIcon color="warning" /> Regenerar QR de Suplente
                </DialogTitle>
                <DialogContent sx={{ pb: 3 }}>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        ¿Estás seguro de que deseas regenerar el código? El QR actual será <strong>invalidado permanentemente</strong> y dejará de funcionar en el restaurante.
                    </Typography>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.100' }}>
                        <Typography variant="caption" color="warning.dark" fontWeight="700">
                            IMPORTANTE: Deberás imprimir y colocar la nueva credencial de inmediato.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setReGenerarDialog(false)} color="inherit">Cancelar</Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={regenerarQR}
                        disabled={regenerando}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        {regenerando ? 'Procesando...' : 'Sí, Regenerar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GestionQRSuplente;
