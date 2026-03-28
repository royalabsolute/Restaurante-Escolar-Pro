import { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Paper, Typography, Avatar, Chip, CircularProgress,
    TextField, InputAdornment, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Drawer, Divider, List, ListItem, ListItemText,
    IconButton, Tooltip, Tab, Tabs, Alert
} from '@mui/material';
import {
    Search as SearchIcon, Person as PersonIcon, Close as CloseIcon,
    CheckCircle as CheckCircleIcon, Cancel as CancelIcon, History as HistoryIcon,
    Assignment as JustIcon, Group as GroupIcon
} from '@mui/icons-material';
import PageHeader from 'components/common/PageHeader';
import StatCard from 'components/common/StatCard';
import { useNotification } from 'contexts/NotificationContext';
import { getProfilePhotoUrl } from 'utils/imageUtils';
import ApiService from 'services/ApiService';

const MiGrupo = () => {
    const { showError } = useNotification();
    const [data, setData] = useState({ grupo: null, estudiantes: [] });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [tab, setTab] = useState(0);

    const loadGrupo = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ApiService.get('/docente/mi-grupo');
            const d = res?.data || res;
            setData(d);
        } catch (err) {
            showError('Error al cargar los datos del grupo');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { loadGrupo(); }, [loadGrupo]);

    const handleSelectStudent = async (est) => {
        setSelected(est);
        setLoadingDetalle(true);
        setTab(0);
        try {
            const res = await ApiService.get(`/docente/mi-grupo/estudiante/${est.id}/detalle`);
            setDetalle(res?.data || res);
        } catch {
            setDetalle(null);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const filtered = (data.estudiantes || []).filter(e => {
        const t = search.toLowerCase();
        return `${e.nombre} ${e.apellidos}`.toLowerCase().includes(t) || e.matricula?.toLowerCase().includes(t);
    });

    const stats = {
        total: data.estudiantes?.length || 0,
        presentes: data.estudiantes?.filter(e => e.presente_hoy).length || 0,
        conFaltas: data.estudiantes?.filter(e => e.faltas_count > 0).length || 0,
        justPendientes: data.estudiantes?.reduce((s, e) => s + (e.justificaciones_pendientes || 0), 0) || 0
    };

    return (
        <Box>
            <PageHeader
                title={data.grupo ? `Mi Grupo: ${data.grupo.nombre}` : 'Mi Grupo'}
                subtitle={data.grupo ? `Jornada ${data.grupo.jornada} · ${stats.total} estudiantes` : 'Cargando información del grupo...'}
            />

            {!loading && !data.grupo && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    No tienes un grupo asignado. Contacta al administrador para que te asigne como director de grupo.
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <StatCard title="Total Estudiantes" value={stats.total} icon={PersonIcon} color="primary" loading={loading} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard title="Presentes Hoy" value={stats.presentes} icon={CheckCircleIcon} color="success" loading={loading} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard title="Con Faltas" value={stats.conFaltas} icon={CancelIcon} color="error" loading={loading} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard title="Just. Pendientes" value={stats.justPendientes} icon={JustIcon} color="warning" loading={loading} />
                </Grid>
            </Grid>

            {/* Buscador */}
            <TextField
                fullWidth
                placeholder="Buscar estudiante por nombre o matrícula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                    sx: { borderRadius: 3, bgcolor: 'grey.50' }
                }}
            />

            {/* Tabla de Estudiantes */}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.100' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase' }}>Estudiante</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase' }} align="center">Hoy</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase' }} align="center">Faltas</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase' }} align="center">Just. Pend.</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                {search ? `No se encontraron estudiantes con "${search}"` : 'No hay estudiantes en tu grupo'}
                            </TableCell></TableRow>
                        ) : filtered.map(est => (
                            <TableRow
                                key={est.id}
                                hover
                                onClick={() => handleSelectStudent(est)}
                                sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                            >
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar src={getProfilePhotoUrl(est.foto_perfil)} sx={{ width: 36, height: 36 }}>
                                            {est.nombre?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{est.nombre} {est.apellidos}</Typography>
                                            <Typography variant="caption" color="text.secondary">{est.matricula}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={est.presente_hoy ? 'Presente' : 'Ausente'}
                                        size="small"
                                        color={est.presente_hoy ? 'success' : 'default'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={est.faltas_count}
                                        size="small"
                                        color={est.faltas_count > 3 ? 'error' : est.faltas_count > 0 ? 'warning' : 'default'}
                                        variant={est.faltas_count > 0 ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    {est.justificaciones_pendientes > 0 ? (
                                        <Chip label={est.justificaciones_pendientes} size="small" color="warning" />
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">—</Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Drawer: Detalle de Estudiante */}
            <Drawer
                anchor="right"
                open={!!selected}
                onClose={() => { setSelected(null); setDetalle(null); }}
                PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}
            >
                {selected && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar src={getProfilePhotoUrl(selected.foto_perfil)} sx={{ width: 48, height: 48 }}>
                                    {selected.nombre?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>{selected.nombre} {selected.apellidos}</Typography>
                                    <Typography variant="caption" color="text.secondary">{selected.matricula} · {selected.grado}</Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={() => { setSelected(null); setDetalle(null); }}><CloseIcon /></IconButton>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="fullWidth">
                            <Tab icon={<HistoryIcon />} label="Asistencias" iconPosition="start" />
                            <Tab icon={<JustIcon />} label="Justificaciones" iconPosition="start" />
                        </Tabs>

                        {loadingDetalle ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : !detalle ? (
                            <Alert severity="error">No se pudo cargar el detalle.</Alert>
                        ) : tab === 0 ? (
                            // Lista de Asistencias
                            detalle.asistencias?.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={3}>Sin registros de asistencia</Typography>
                            ) : (
                                <List dense disablePadding>
                                    {detalle.asistencias.map(a => (
                                        <ListItem key={a.id} divider sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={new Date(a.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                secondary={a.hora_entrada ? `Entrada: ${a.hora_entrada}` : 'Sin hora'}
                                            />
                                            <Chip
                                                label={a.estado === 'presente' ? 'Presente' : 'Ausente'}
                                                size="small"
                                                color={a.estado === 'presente' ? 'success' : 'error'}
                                                variant="outlined"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )
                        ) : (
                            // Lista de Justificaciones
                            detalle.justificaciones?.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={3}>Sin justificaciones</Typography>
                            ) : (
                                <List dense disablePadding>
                                    {detalle.justificaciones.map(j => (
                                        <ListItem key={j.id} divider sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" fontWeight={600}>{j.motivo}</Typography>
                                                <Chip
                                                    label={j.estado}
                                                    size="small"
                                                    color={j.estado === 'aprobada' ? 'success' : j.estado === 'rechazada' ? 'error' : 'warning'}
                                                    variant="outlined"
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">{j.descripcion}</Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            )
                        )}
                    </>
                )}
            </Drawer>
        </Box>
    );
};

export default MiGrupo;
