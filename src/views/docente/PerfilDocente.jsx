import { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Grid, Alert,
    CircularProgress, Divider, InputAdornment, IconButton
} from '@mui/material';
import {
    Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon,
    Badge as BadgeIcon, Lock as LockIcon, Visibility, VisibilityOff,
    School as SchoolIcon, Save as SaveIcon
} from '@mui/icons-material';
import PageHeader from 'components/common/PageHeader';
import { useNotification } from 'contexts/NotificationContext';
import ApiService from 'services/ApiService';

const PerfilDocente = () => {
    const { showError } = useNotification();
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState({
        email: '', cedula: '', telefono: '', password: '', confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const loadPerfil = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ApiService.get('/docente/perfil');
            const data = res?.data || res;
            setPerfil(data);
            setForm({
                email: data.email || '',
                cedula: data.cedula || '',
                telefono: data.telefono || '',
                password: '',
                confirmPassword: ''
            });
        } catch {
            showError('Error al cargar el perfil');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { loadPerfil(); }, [loadPerfil]);

    const validate = () => {
        const e = {};
        if (!form.email) e.email = 'El email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
        if (form.password && form.password.length < 8) e.password = 'Mínimo 8 caracteres';
        if (form.password && form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        setAlert(null);
        try {
            const payload = { email: form.email, cedula: form.cedula, telefono: form.telefono };
            if (form.password) { payload.password = form.password; payload.confirmPassword = form.confirmPassword; }
            await ApiService.put('/docente/perfil', payload);
            setAlert({ severity: 'success', message: 'Perfil actualizado correctamente' });
            setForm(p => ({ ...p, password: '', confirmPassword: '' }));
        } catch (err) {
            const msg = err?.response?.data?.message || 'Error al guardar los cambios';
            setAlert({ severity: 'error', message: msg });
        } finally {
            setSaving(false);
        }
    };

    const field = (label, name, type = 'text', icon, extra = {}) => (
        <Grid item xs={12} sm={6}>
            <TextField
                label={label}
                fullWidth
                size="small"
                type={type}
                value={form[name]}
                onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                error={!!errors[name]}
                helperText={errors[name]}
                InputProps={{
                    startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
                    ...extra
                }}
            />
        </Grid>
    );

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box>
            <PageHeader
                title="Mi Perfil"
                subtitle="Actualiza tus datos personales y de acceso"
            />

            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setAlert(null)}>
                    {alert.message}
                </Alert>
            )}

            {/* Info del grupo asignado */}
            {perfil?.grupo && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'primary.100', bgcolor: 'primary.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <SchoolIcon color="primary" />
                        <Box>
                            <Typography variant="body2" fontWeight={700} color="primary">Director de Grupo Asignado</Typography>
                            <Typography variant="body2">{perfil.grupo.nombre} · Jornada {perfil.grupo.jornada}</Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.100' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Datos Personales</Typography>
                <Grid container spacing={2.5}>
                    {field('Correo Electrónico *', 'email', 'email', <EmailIcon color="action" sx={{ fontSize: 18 }} />)}
                    {field('Cédula', 'cedula', 'text', <BadgeIcon color="action" sx={{ fontSize: 18 }} />)}
                    {field('Teléfono', 'telefono', 'tel', <PhoneIcon color="action" sx={{ fontSize: 18 }} />)}
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Cambiar Contraseña</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Deja estos campos en blanco si no deseas cambiar tu contraseña.
                </Typography>
                <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Nueva Contraseña"
                            fullWidth
                            size="small"
                            type={showPass ? 'text' : 'password'}
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            error={!!errors.password}
                            helperText={errors.password}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LockIcon color="action" sx={{ fontSize: 18 }} /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowPass(!showPass)}>
                                            {showPass ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Confirmar Contraseña"
                            fullWidth
                            size="small"
                            type={showConfirm ? 'text' : 'password'}
                            value={form.confirmPassword}
                            onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LockIcon color="action" sx={{ fontSize: 18 }} /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)}>
                                            {showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ px: 4 }}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default PerfilDocente;
