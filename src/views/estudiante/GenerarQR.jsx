import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Grid,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Tabs,
    Tab,
    Slider,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    QrCode2 as QrCodeIcon,
    Download as DownloadIcon,
    Person as PersonIcon,
    Palette as PaletteIcon,
    Gradient as GradientIcon,
    FormatColorFill as ColorFillIcon,
    Circle as CircleIcon,
    Waves as WavesIcon,
    FiberManualRecord as DotIcon,
    GridOn as GridIcon,
    BlockOutlined as NoneIcon,
    AutoAwesome as AutoFixHighIcon,
    Brush as BrushIcon,
    AutoFixHigh as MagicIcon,
    RoundedCorner as CornerIcon,
    BorderOuter as BorderIcon
} from '@mui/icons-material';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { useAuth } from 'hooks/useAuth';
import ApiService from 'services/ApiService';
import { getProfilePhotoUrl } from 'utils/imageUtils';
import { useNotification } from 'contexts/NotificationContext';
import iesadepLogo from 'assets/images/Iesadep.png';
import pascualLogo from 'assets/images/Pascual.png';

const CARD_WIDTH = 600;
const CARD_HEIGHT = 300;

const CustomTabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`carnet-tabpanel-${index}`}
            aria-labelledby={`carnet-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const GenerarQR = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { user: _user } = useAuth();
    const carnetRef = useRef(null);
    const cardViewportRef = useRef(null);
    const [cardScale, setCardScale] = useState(1);
    const { showSuccess, showError, showInfo } = useNotification();

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [qrUrl, setQrUrl] = useState('');

    const [studentData, setStudentData] = useState({
        nombre: '',
        apellidos: '',
        matricula: '',
        grado: '',
        jornada: '',
        qrCode: '',
        foto_perfil: ''
    });

    const [carnetConfig, setCarnetConfig] = useState({
        backgroundType: 'gradient',
        preset: 'purple',
        gradientStart: '#667eea',
        gradientEnd: '#764ba2',
        gradientAngle: 135,
        solidColor: '#667eea',
        textColor: '#ffffff',
        decorationStyle: 'circles',
        decorationOpacity: 0.15,
        decorationSize: 'medium',
        borderRadius: 24,
        borderWidth: 0,
        borderColor: '#ffffff'
    });

    const [dotPositions] = useState(() =>
        [...Array(20)].map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`
        }))
    );

    const scaledCardWidth = CARD_WIDTH * cardScale;
    const scaledCardHeight = CARD_HEIGHT * cardScale;

    useEffect(() => {
        if (!cardViewportRef.current || typeof ResizeObserver === 'undefined') {
            setCardScale(1);
            return;
        }

        const observer = new ResizeObserver((entries) => {
            if (!entries.length) return;
            const { width } = entries[0].contentRect;
            if (!width) return;
            const availableWidth = width - (isMobile ? 16 : 32);
            setCardScale(Math.min(1, availableWidth / CARD_WIDTH));
        });

        observer.observe(cardViewportRef.current);
        return () => observer.disconnect();
    }, [isMobile]);

    const getGradient = () => {
        if (carnetConfig.backgroundType === 'solid') {
            return carnetConfig.solidColor;
        } else if (carnetConfig.backgroundType === 'custom') {
            return `linear-gradient(${carnetConfig.gradientAngle}deg, ${carnetConfig.gradientStart}, ${carnetConfig.gradientEnd})`;
        } else {
            const gradients = {
                purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                blue: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                orange: 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)',
                red: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                dark: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                teal: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)',
                sunset: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)',
                ocean: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
                forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
                lavender: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
            };
            return gradients[carnetConfig.preset] || gradients.purple;
        }
    };

    const generateQRImage = useCallback(async (qrData) => {
        try {
            const qrDataUrl = await QRCode.toDataURL(qrData, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#1a237e',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H'
            });
            setQrUrl(qrDataUrl);
        } catch (error) {
            console.error('Error generating QR image:', error);
            showError('Error generando la imagen del código QR');
        }
    }, [showError]);

    const loadStudentProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ApiService.get('/students/my-profile');
            if (response.status === 'SUCCESS') {
                const profile = response.data;
                setStudentData({
                    nombre: profile.nombre || '',
                    apellidos: profile.apellidos || '',
                    matricula: profile.matricula || '',
                    grado: profile.grado || '',
                    jornada: profile.jornada || '',
                    qrCode: profile.codigo_qr || '',
                    foto_perfil: profile.foto_perfil || ''
                });
                if (profile.codigo_qr) {
                    await generateQRImage(profile.codigo_qr);
                }
            } else {
                showError('No se pudo cargar la información del estudiante');
            }
        } catch (error) {
            console.error('Error loading student profile:', error);
            showError('Error cargando la información del estudiante');
        } finally {
            setLoading(false);
        }
    }, [showError, generateQRImage]);

    useEffect(() => {
        loadStudentProfile();
    }, [loadStudentProfile]);

    const handleDownloadQR = () => {
        if (!qrUrl) {
            showError('No hay código QR disponible para descargar');
            return;
        }
        const link = document.createElement('a');
        link.download = `QR-${studentData.matricula}-${studentData.nombre}.png`;
        link.href = qrUrl;
        link.click();
        showSuccess('Código QR descargado exitosamente');
    };

    const handleDownloadCard = async () => {
        if (!qrUrl || !carnetRef.current) {
            showError('No hay código QR disponible');
            return;
        }

        try {
            setGeneratingPdf(true);
            showInfo('Generando PDF del carnet de alta calidad...', 'Procesando');
            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(carnetRef.current, {
                scale: 3,
                useCORS: true,
                allowTaint: false,
                backgroundColor: null,
                logging: false,
                imageTimeout: 0,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                onclone: (clonedDoc) => {
                    const clonedCarnet = clonedDoc.querySelector('[data-carnet-ref]');
                    if (clonedCarnet) {
                        clonedCarnet.style.transform = 'scale(1)';
                        clonedCarnet.style.borderRadius = `${carnetConfig.borderRadius}px`;
                        clonedCarnet.style.border = `${carnetConfig.borderWidth}px solid ${carnetConfig.borderColor}`;
                        clonedCarnet.style.boxShadow = 'none';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [CARD_HEIGHT * 0.264583, CARD_WIDTH * 0.264583]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH * 0.264583, CARD_HEIGHT * 0.264583, '', 'SLOW');
            pdf.save(`Carnet-${studentData.matricula}-${studentData.nombre}.pdf`);
            showSuccess('Carnet descargado exitosamente');
        } catch (error) {
            console.error('Error generando PDF del carnet:', error);
            showError('Error al generar el PDF del carnet');
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleRegenerateQR = async () => {
        if (!window.confirm('¿Estás seguro de que deseas generar un NUEVO código QR? El código anterior dejará de funcionar inmediatamente.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await ApiService.post('/students/generate-qr');
            if (response.status === 'SUCCESS') {
                const { qrCode } = response.data;
                setStudentData(prev => ({ ...prev, qrCode }));
                await generateQRImage(qrCode);
                showSuccess('¡Nuevo código QR generado con éxito!');
            } else {
                showError(response.message || 'Error al regenerar el código QR');
            }
        } catch (error) {
            showError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const getDecorationSize = () => {
        const sizes = {
            small: { circle: '100px', blur: '25px' },
            medium: { circle: '150px', blur: '40px' },
            large: { circle: '200px', blur: '50px' }
        };
        return sizes[carnetConfig.decorationSize] || sizes.medium;
    };

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress thickness={5} sx={{ color: '#667eea', mb: 2 }} />
                <Typography variant="h6" fontWeight="600" color="text.secondary">
                    Cargando tu información...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Grid container spacing={4}>
                {/* Panel de Control Lateral */}
                <Grid item xs={12} lg={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 0,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(102, 126, 234, 0.03)' }}>
                            <Tabs
                                value={activeTab}
                                onChange={(_, v) => setActiveTab(v)}
                                variant="fullWidth"
                                sx={{
                                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', py: 2 },
                                    '& .Mui-selected': { color: '#667eea' },
                                    '& .MuiTabs-indicator': { backgroundColor: '#667eea', height: 3 }
                                }}
                            >
                                <Tab icon={<PaletteIcon fontSize="small" />} label="Diseño" />
                                <Tab icon={<BrushIcon fontSize="small" />} label="Detalles" />
                                <Tab icon={<MagicIcon fontSize="small" />} label="Extra" />
                            </Tabs>
                        </Box>

                        <Box sx={{ p: 2.5 }}>
                            {/* TAB 1: FONDO */}
                            <CustomTabPanel value={activeTab} index={0}>
                                <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={2}>
                                    Fondo del Carnet
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                    {[
                                        { id: 'gradient', label: 'Gradiente', icon: <GradientIcon /> },
                                        { id: 'custom', label: 'Libre', icon: <AutoFixHighIcon /> },
                                        { id: 'solid', label: 'Sólido', icon: <ColorFillIcon /> }
                                    ].map((type) => (
                                        <Button
                                            key={type.id}
                                            variant={carnetConfig.backgroundType === type.id ? 'contained' : 'outlined'}
                                            onClick={() => setCarnetConfig({ ...carnetConfig, backgroundType: type.id })}
                                            sx={{
                                                flex: 1,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '0.75rem',
                                                py: 1,
                                                borderColor: '#667eea',
                                                color: carnetConfig.backgroundType === type.id ? 'white' : '#667eea',
                                                bgcolor: carnetConfig.backgroundType === type.id ? '#667eea' : 'transparent',
                                                '&:hover': { bgcolor: carnetConfig.backgroundType === type.id ? '#764ba2' : 'rgba(102, 126, 234, 0.05)' }
                                            }}
                                        >
                                            {type.label}
                                        </Button>
                                    ))}
                                </Box>

                                {carnetConfig.backgroundType === 'gradient' && (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2 }}>
                                        {[
                                            { name: 'purple', grad: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                                            { name: 'blue', grad: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)' },
                                            { name: 'green', grad: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
                                            { name: 'red', grad: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' },
                                            { name: 'orange', grad: 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)' },
                                            { name: 'dark', grad: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' },
                                            { name: 'ocean', grad: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)' },
                                            { name: 'lavender', grad: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
                                        ].map((c) => (
                                            <Tooltip key={c.name} title={c.name} arrow>
                                                <Box
                                                    onClick={() => setCarnetConfig({ ...carnetConfig, preset: c.name })}
                                                    sx={{
                                                        height: 40,
                                                        background: c.grad,
                                                        borderRadius: 1.5,
                                                        cursor: 'pointer',
                                                        border: carnetConfig.preset === c.name ? '3px solid #667eea' : '1px solid rgba(0,0,0,0.1)',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        '&:hover': { transform: 'scale(1.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }
                                                    }}
                                                />
                                            </Tooltip>
                                        ))}
                                    </Box>
                                )}

                                {carnetConfig.backgroundType === 'custom' && (
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" fontWeight="600">Color Inicio</Typography>
                                            <input
                                                type="color"
                                                value={carnetConfig.gradientStart}
                                                onChange={(e) => setCarnetConfig({ ...carnetConfig, gradientStart: e.target.value })}
                                                style={{ border: 'none', width: 40, height: 30, cursor: 'pointer', borderRadius: 4 }}
                                            />
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" fontWeight="600">Color Fin</Typography>
                                            <input
                                                type="color"
                                                value={carnetConfig.gradientEnd}
                                                onChange={(e) => setCarnetConfig({ ...carnetConfig, gradientEnd: e.target.value })}
                                                style={{ border: 'none', width: 40, height: 30, cursor: 'pointer', borderRadius: 4 }}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" fontWeight="600">Ángulo: {carnetConfig.gradientAngle}°</Typography>
                                            <Slider
                                                size="small"
                                                min={0} max={360}
                                                value={carnetConfig.gradientAngle}
                                                onChange={(_, v) => setCarnetConfig({ ...carnetConfig, gradientAngle: v })}
                                                sx={{ color: '#667eea' }}
                                            />
                                        </Box>
                                    </Box>
                                )}

                                {carnetConfig.backgroundType === 'solid' && (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
                                        {['#764ba2', '#357ABD', '#38ef7d', '#eea849', '#f45c43', '#34495e', '#ffffff', '#000000', '#26c6da', '#5c6bc0', '#9ccc65', '#ffd54f'].map((c) => (
                                            <Box
                                                key={c}
                                                onClick={() => setCarnetConfig({ ...carnetConfig, solidColor: c })}
                                                sx={{
                                                    height: 35,
                                                    bgcolor: c,
                                                    borderRadius: 1.5,
                                                    cursor: 'pointer',
                                                    border: carnetConfig.solidColor === c ? '3px solid #667eea' : '1px solid rgba(0,0,0,0.1)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </CustomTabPanel>

                            {/* TAB 2: DETALLES */}
                            <CustomTabPanel value={activeTab} index={1}>
                                <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={2}>
                                    Personalización de Texto
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <input
                                        type="color"
                                        value={carnetConfig.textColor}
                                        onChange={(e) => setCarnetConfig({ ...carnetConfig, textColor: e.target.value })}
                                        style={{ border: 'none', width: 50, height: 40, cursor: 'pointer', borderRadius: 8 }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" display="block">Color de letra</Typography>
                                        <Typography variant="body2" fontWeight="700" fontFamily="monospace">{carnetConfig.textColor}</Typography>
                                    </Box>
                                    <Button size="small" variant="outlined" onClick={() => setCarnetConfig({ ...carnetConfig, textColor: '#ffffff' })} sx={{ borderRadius: 2, textTransform: 'none' }}>Blanco</Button>
                                    <Button size="small" variant="outlined" onClick={() => setCarnetConfig({ ...carnetConfig, textColor: '#000000' })} sx={{ borderRadius: 2, textTransform: 'none' }}>Negro</Button>
                                </Box>

                                <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={2}>
                                    Estilos de Fondo (Decoraciones)
                                </Typography>
                                <Grid container spacing={1} mb={2}>
                                    {[
                                        { id: 'circles', icon: <CircleIcon /> },
                                        { id: 'waves', icon: <WavesIcon /> },
                                        { id: 'dots', icon: <DotIcon /> },
                                        { id: 'grid', icon: <GridIcon /> },
                                        { id: 'none', icon: <NoneIcon /> }
                                    ].map((dec) => (
                                        <Grid item xs={2.4} key={dec.id}>
                                            <IconButton
                                                onClick={() => setCarnetConfig({ ...carnetConfig, decorationStyle: dec.id })}
                                                sx={{
                                                    bgcolor: carnetConfig.decorationStyle === dec.id ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                                                    color: carnetConfig.decorationStyle === dec.id ? '#667eea' : 'text.disabled',
                                                    border: '1px solid',
                                                    borderColor: carnetConfig.decorationStyle === dec.id ? '#667eea' : 'divider',
                                                    borderRadius: 2,
                                                    width: '100%'
                                                }}
                                            >
                                                {dec.icon}
                                            </IconButton>
                                        </Grid>
                                    ))}
                                </Grid>

                                {carnetConfig.decorationStyle !== 'none' && (
                                    <Box>
                                        <Typography variant="caption" fontWeight="600" color="text.secondary">Opacidad de figuras: {(carnetConfig.decorationOpacity * 100).toFixed(0)}%</Typography>
                                        <Slider
                                            size="small"
                                            min={0} max={0.4} step={0.01}
                                            value={carnetConfig.decorationOpacity}
                                            onChange={(_, v) => setCarnetConfig({ ...carnetConfig, decorationOpacity: v })}
                                            sx={{ color: '#667eea' }}
                                        />
                                    </Box>
                                )}
                            </CustomTabPanel>

                            {/* TAB 3: EXTRA */}
                            <CustomTabPanel value={activeTab} index={2}>
                                <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={2}>
                                    Borde y Esquinas
                                </Typography>

                                <Box mb={3}>
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <CornerIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        <Typography variant="caption" fontWeight="700">Redondeado: {carnetConfig.borderRadius}px</Typography>
                                    </Box>
                                    <Slider
                                        size="small"
                                        min={0} max={60}
                                        value={carnetConfig.borderRadius}
                                        onChange={(_, v) => setCarnetConfig({ ...carnetConfig, borderRadius: v })}
                                        sx={{ color: '#667eea' }}
                                    />
                                </Box>

                                <Box mb={3}>
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <BorderIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        <Typography variant="caption" fontWeight="700">Grosor de Borde: {carnetConfig.borderWidth}px</Typography>
                                    </Box>
                                    <Slider
                                        size="small"
                                        min={0} max={12}
                                        value={carnetConfig.borderWidth}
                                        onChange={(_, v) => setCarnetConfig({ ...carnetConfig, borderWidth: v })}
                                        sx={{ color: '#667eea' }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="caption" fontWeight="700" color="text.secondary" mb={1} display="block">Color del Borde</Typography>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <input
                                            type="color"
                                            value={carnetConfig.borderColor}
                                            onChange={(e) => setCarnetConfig({ ...carnetConfig, borderColor: e.target.value })}
                                            style={{ border: 'none', width: '100%', height: 35, cursor: 'pointer', borderRadius: 6 }}
                                        />
                                        <IconButton size="small" onClick={() => setCarnetConfig({ ...carnetConfig, borderColor: '#ffffff' })} title="Blanco">
                                            <Box sx={{ width: 20, height: 20, bgcolor: '#fff', border: '1px solid #ddd', borderRadius: '50%' }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => setCarnetConfig({ ...carnetConfig, borderColor: '#000000' })} title="Negro">
                                            <Box sx={{ width: 20, height: 20, bgcolor: '#000', borderRadius: '50%' }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </CustomTabPanel>
                        </Box>
                    </Paper>
                </Grid>

                {/* Vista Previa del Carnet */}
                <Grid item xs={12} lg={8}>
                    <Box
                        ref={cardViewportRef}
                        sx={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: isMobile ? '350px' : '450px',
                            bgcolor: 'rgba(0,0,0,0.02)',
                            borderRadius: 4,
                            border: '1px dashed',
                            borderColor: 'divider',
                            position: 'relative',
                            p: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                width: `${scaledCardWidth}px`,
                                height: `${scaledCardHeight}px`,
                                zIndex: 1,
                                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                        >
                            <Box
                                ref={carnetRef}
                                data-carnet-ref="true"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: `${CARD_WIDTH}px`,
                                    height: `${CARD_HEIGHT}px`,
                                    background: getGradient(),
                                    borderRadius: `${carnetConfig.borderRadius}px`,
                                    border: `${carnetConfig.borderWidth}px solid ${carnetConfig.borderColor}`,
                                    overflow: 'hidden',
                                    boxShadow: carnetConfig.borderWidth > 0 ? 'none' : '0 15px 45px rgba(0,0,0,0.1)',
                                    transformOrigin: 'top left',
                                    transform: `scale(${cardScale})`,
                                    display: 'flex',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Decoraciones Dinámicas */}
                                {carnetConfig.decorationStyle === 'circles' && (
                                    <>
                                        <Box sx={{
                                            position: 'absolute',
                                            top: '-10%', right: '-10%',
                                            width: getDecorationSize().circle,
                                            height: getDecorationSize().circle,
                                            borderRadius: '50%',
                                            background: `rgba(255,255,255,${carnetConfig.decorationOpacity})`,
                                            filter: `blur(${getDecorationSize().blur})`,
                                            zIndex: 1
                                        }} />
                                        <Box sx={{
                                            position: 'absolute',
                                            bottom: '-10%', left: '-10%',
                                            width: '120px', height: '120px',
                                            borderRadius: '50%',
                                            background: `rgba(255,255,255,${carnetConfig.decorationOpacity * 0.8})`,
                                            filter: 'blur(30px)',
                                            zIndex: 1
                                        }} />
                                    </>
                                )}

                                {carnetConfig.decorationStyle === 'waves' && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        opacity: carnetConfig.decorationOpacity,
                                        zIndex: 1,
                                        background: 'linear-gradient(45deg, transparent 45%, #fff 50%, transparent 55%)',
                                        backgroundSize: '100px 100px'
                                    }} />
                                )}

                                {carnetConfig.decorationStyle === 'dots' && (
                                    dotPositions.map((pos, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                position: 'absolute',
                                                width: carnetConfig.decorationSize === 'small' ? 4 : carnetConfig.decorationSize === 'large' ? 10 : 7,
                                                height: carnetConfig.decorationSize === 'small' ? 4 : carnetConfig.decorationSize === 'large' ? 10 : 7,
                                                borderRadius: '50%',
                                                background: '#fff',
                                                opacity: carnetConfig.decorationOpacity * 2,
                                                top: pos.top, left: pos.left,
                                                zIndex: 1
                                            }}
                                        />
                                    ))
                                )}

                                {carnetConfig.decorationStyle === 'grid' && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        opacity: carnetConfig.decorationOpacity,
                                        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                                        backgroundSize: '20px 20px',
                                        zIndex: 1
                                    }} />
                                )}

                                {/* Contenido del Carnet */}
                                <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', width: '100%', p: 4 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '1.4rem',
                                                color: carnetConfig.textColor,
                                                mb: 3.5,
                                                letterSpacing: 1.5,
                                                textTransform: 'uppercase',
                                                textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            Comedor Escolar
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 4, ml: 2 }}> {/* Aumentado ml de 1 a 2 para centrar mas a la derecha */}
                                            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                                                <Box sx={{
                                                    width: 130, height: 130,
                                                    borderRadius: '50%',
                                                    border: '4px solid #fff',
                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                                    overflow: 'hidden',
                                                    bgcolor: '#f5f5f5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {studentData.foto_perfil ? (
                                                        <img src={getProfilePhotoUrl(studentData.foto_perfil)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <PersonIcon sx={{ fontSize: 75, color: '#ccc' }} />
                                                    )}
                                                </Box>

                                                <Box sx={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
                                                    <Box sx={{ width: 34, height: 34, bgcolor: '#fff', p: 0.6, borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                        <img src={iesadepLogo} alt="L1" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </Box>
                                                    <Box sx={{ width: 34, height: 34, bgcolor: '#fff', p: 0.6, borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                        <img src={pascualLogo} alt="L2" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, pl: 3 }}> {/* Aumentado pl de 2 a 3 */}
                                                <Typography variant="h5" sx={{ fontWeight: 800, color: carnetConfig.textColor, mb: 1.5, fontSize: '1.5rem', lineHeight: 1.1 }}>
                                                    {studentData.nombre || ''}<br />{studentData.apellidos || ''}
                                                </Typography>

                                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: carnetConfig.textColor, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Matrícula</Typography>
                                                        <Typography variant="body2" sx={{ color: carnetConfig.textColor, fontWeight: 800 }}>{studentData.matricula || ''}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: carnetConfig.textColor, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Grado</Typography>
                                                        <Typography variant="body2" sx={{ color: carnetConfig.textColor, fontWeight: 800 }}>{studentData.grado || ''}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: carnetConfig.textColor, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Jornada</Typography>
                                                        <Typography variant="body2" sx={{ color: carnetConfig.textColor, fontWeight: 800, textTransform: 'capitalize' }}>{studentData.jornada || ''}</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pl: 2 }}>
                                        <Box sx={{
                                            bgcolor: '#fff',
                                            p: 2,
                                            borderRadius: 4,
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {qrUrl ? (
                                                <img src={qrUrl} alt="QR" style={{ width: 125, height: 125, borderRadius: 8 }} />
                                            ) : (
                                                <Box sx={{ width: 125, height: 125, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc' }}>
                                                    <QrCodeIcon sx={{ fontSize: 50, color: '#ccc' }} />
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{
                            mt: 5,
                            display: 'flex',
                            gap: 2,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            width: '100%',
                            px: 2
                        }}>
                            <Button
                                variant="contained"
                                onClick={handleDownloadCard}
                                disabled={generatingPdf}
                                startIcon={generatingPdf ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                                sx={{
                                    bgcolor: '#667eea',
                                    py: 1.5, px: 4, borderRadius: 3, fontWeight: 800, textTransform: 'none', fontSize: '1rem',
                                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                                    '&:hover': { bgcolor: '#764ba2', transform: 'translateY(-2px)' },
                                    transition: 'all 0.2s ease',
                                    minWidth: isMobile ? '100%' : 'auto'
                                }}
                            >
                                {generatingPdf ? 'Generando...' : 'Descargar Carnet PDF'}
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={handleDownloadQR}
                                startIcon={<QrCodeIcon />}
                                sx={{
                                    borderColor: '#667eea', color: '#667eea',
                                    py: 1.5, px: 3, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.05)', borderColor: '#764ba2', transform: 'translateY(-2px)' },
                                    minWidth: isMobile ? '100%' : 'auto'
                                }}
                            >
                                Descargar solo QR
                            </Button>

                            <Tooltip title="Actualizar mi código QR por seguridad">
                                <Button
                                    variant="text"
                                    color="warning"
                                    onClick={handleRegenerateQR}
                                    startIcon={<BrushIcon />}
                                    sx={{
                                        fontWeight: 700, textTransform: 'none',
                                        minWidth: isMobile ? '100%' : 'auto'
                                    }}
                                >
                                    Regenerar QR
                                </Button>
                            </Tooltip>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GenerarQR;
