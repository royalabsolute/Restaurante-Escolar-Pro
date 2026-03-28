import { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText,
    IconButton, Chip, Tooltip, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, Switch, FormControlLabel, Avatar
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Refresh as RefreshIcon, Group as GroupIcon,
    Check as CheckIcon, SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import PageHeader from 'components/common/PageHeader';
import { useNotification } from 'contexts/NotificationContext';
import useRoleBasedApi from 'hooks/useRoleBasedApi';
import ApiService from 'services/ApiService';

const emptyGrupo = { nombre: '', jornada: 'Mañana', activo: true, director_grupo_id: '' };

const GestionGrupos = () => {
    const { showError } = useNotification();
    const { permissions } = useRoleBasedApi();
    // Endpoint correcto según rol: admin usa /admin/grupos, el resto usa /secretary/grupos
    const gruposBase = permissions.isAdmin ? '/admin/grupos' : '/secretary/grupos';
    const docentesBase = permissions.isAdmin ? '/admin/docentes' : '/secretary/docentes';
    const [grupos, setGrupos] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
    const [reassignTargetId, setReassignTargetId] = useState('');
    const [editingGrupo, setEditingGrupo] = useState(null);
    const [formData, setFormData] = useState(emptyGrupo);
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [gruposRes, docentesRes] = await Promise.all([
                ApiService.get(gruposBase),
                ApiService.get(docentesBase)
            ]);
            const rawGrupos = Array.isArray(gruposRes?.data) ? gruposRes.data :
                Array.isArray(gruposRes) ? gruposRes : [];
            // Normalizar total_estudiantes a número (MySQL COUNT devuelve string)
            setGrupos(rawGrupos.map(g => ({ ...g, total_estudiantes: parseInt(g.total_estudiantes ?? 0, 10) })));
            setDocentes(
                Array.isArray(docentesRes?.data) ? docentesRes.data :
                    Array.isArray(docentesRes) ? docentesRes : []
            );
        } catch (err) {
            console.error('Error cargando grupos:', err);
            showError('Error al cargar los grupos académicos');
        } finally {
            setLoading(false);
        }
    }, [showError, gruposBase, docentesBase]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenCreate = () => {
        setEditingGrupo(null);
        setFormData(emptyGrupo);
        setErrors({});
        setDialogOpen(true);
    };

    const handleOpenEdit = (grupo) => {
        setEditingGrupo(grupo);
        setFormData({
            nombre: grupo.nombre,
            jornada: grupo.jornada,
            activo: grupo.activo === 1 || grupo.activo === true,
            director_grupo_id: grupo.director_grupo_id || ''
        });
        setErrors({});
        setDialogOpen(true);
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (!formData.jornada) newErrors.jornada = 'La jornada es requerida';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                nombre: formData.nombre.trim(),
                jornada: formData.jornada,
                activo: formData.activo ? 1 : 0,
                director_grupo_id: formData.director_grupo_id || null
            };
            if (editingGrupo) {
                await ApiService.put(`/admin/grupos/${editingGrupo.id}`, payload);
                setAlert({ severity: 'success', message: `Grupo "${formData.nombre}" actualizado correctamente` });
            } else {
                await ApiService.post('/admin/grupos', payload);
                setAlert({ severity: 'success', message: `Grupo "${formData.nombre}" creado correctamente` });
            }
            setDialogOpen(false);
            loadData();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Error al guardar el grupo';
            setErrors({ general: msg });
        } finally {
            setSaving(false);
        }
    };

    // Clic en icono eliminar: abre confirmación o diálogo de reasignación
    const handleDeleteClick = (grupo) => {
        const total = grupo.total_estudiantes || 0;
        if (total > 0) {
            setDeleteConfirm(grupo);
            setReassignTargetId('');
            setReassignDialogOpen(true);
        } else {
            setDeleteConfirm(grupo);
        }
    };

    // Eliminar grupo sin estudiantes
    const handleDeleteDirect = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await ApiService.delete(`/admin/grupos/${deleteConfirm.id}`);
            setDeleteConfirm(null);
            setAlert({ severity: 'success', message: `Grupo "${deleteConfirm.nombre}" eliminado` });
            loadData();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Error al eliminar el grupo';
            setAlert({ severity: 'error', message: msg });
            setDeleteConfirm(null);
        } finally {
            setSaving(false);
        }
    };

    // Reasignar estudiantes y eliminar grupo
    const handleReassignAndDelete = async () => {
        if (!reassignTargetId) {
            setErrors({ reassign: 'Debes seleccionar un grupo destino' });
            return;
        }
        setSaving(true);
        try {
            // 1. Reasignar estudiantes
            await ApiService.put(`/admin/grupos/${deleteConfirm.id}/reassign`, { nuevo_grupo_id: reassignTargetId });
            // 2. Eliminar grupo vacío
            await ApiService.delete(`/admin/grupos/${deleteConfirm.id}`);
            setReassignDialogOpen(false);
            setDeleteConfirm(null);
            setAlert({ severity: 'success', message: `Grupo "${deleteConfirm.nombre}" eliminado y sus estudiantes reasignados correctamente` });
            loadData();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Error al reasignar o eliminar el grupo';
            setErrors({ reassign: msg });
        } finally {
            setSaving(false);
        }
    };

    const jornadaColor = (jornada) => {
        if (jornada === 'Mañana') return 'primary';
        if (jornada === 'Tarde') return 'warning';
        return 'secondary';
    };

    return (
        <Box>
            <PageHeader
                title="Gestión de Grupos Académicos"
                subtitle="Administra los grupos del colegio y asigna directores de grupo"
                actions={
                    permissions.isAdmin
                        ? <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Nuevo Grupo</Button>
                        : null
                }
            />

            {alert && (
                <Alert severity={alert.severity} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setAlert(null)}>
                    {alert.message}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Tooltip title="Actualizar lista">
                    <IconButton onClick={loadData} disabled={loading} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.100' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Grupo</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Jornada</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Estudiantes</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Director de Grupo</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Estado</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                        ) : grupos.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay grupos registrados. Crea el primero.</TableCell></TableRow>
                        ) : grupos.map(g => (
                            <TableRow key={g.id} hover>
                                <TableCell>
                                    <Typography fontWeight={600} fontSize="0.9rem">{g.nombre}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={g.jornada}
                                        size="small"
                                        sx={{
                                            bgcolor: `${jornadaColor(g.jornada)}.50`,
                                            color: `${jornadaColor(g.jornada)}.main`,
                                            fontWeight: 700,
                                            border: 'none',
                                            borderRadius: 1.5
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={<GroupIcon style={{ fontSize: 14, color: 'inherit' }} />}
                                        label={`${g.total_estudiantes ?? 0} estudiantes`}
                                        size="small"
                                        sx={{
                                            bgcolor: (g.total_estudiantes ?? 0) > 0 ? 'info.50' : 'grey.50',
                                            color: (g.total_estudiantes ?? 0) > 0 ? 'info.main' : 'grey.500',
                                            fontWeight: 700,
                                            border: 'none',
                                            borderRadius: 1.5,
                                            '& .MuiChip-icon': { color: 'inherit' }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {g.director_nombre ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                variant="rounded"
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    bgcolor: 'primary.50',
                                                    color: 'primary.main',
                                                    borderRadius: 1.5
                                                }}
                                            >
                                                {g.director_nombre.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                                                    {g.director_nombre} {g.director_apellidos}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{g.director_email}</Typography>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.disabled" fontStyle="italic">Sin asignar</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={g.activo ? <CheckIcon style={{ fontSize: 14, color: 'inherit' }} /> : undefined}
                                        label={g.activo ? 'Activo' : 'Inactivo'}
                                        size="small"
                                        sx={{
                                            bgcolor: g.activo ? 'success.50' : 'grey.50',
                                            color: g.activo ? 'success.main' : 'grey.500',
                                            fontWeight: 700,
                                            border: 'none',
                                            borderRadius: 1.5,
                                            '& .MuiChip-icon': { color: 'inherit' }
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {permissions.isAdmin && (
                                        <>
                                            <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpenEdit(g)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title={(g.total_estudiantes ?? 0) > 0 ? 'Eliminar (reasignar estudiantes)' : 'Eliminar'}>
                                                <span>
                                                    <IconButton size="small" onClick={() => handleDeleteClick(g)} sx={{ color: 'error.main' }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ── Dialog Crear/Editar ── */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingGrupo ? `Editar: ${editingGrupo.nombre}` : 'Crear Nuevo Grupo'}
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
                    {errors.general && <Alert severity="error">{errors.general}</Alert>}
                    <TextField
                        label="Nombre del grupo *"
                        placeholder="Ej: 11°1"
                        fullWidth
                        value={formData.nombre}
                        onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                        error={!!errors.nombre}
                        helperText={errors.nombre}
                        size="small"
                    />
                    <FormControl fullWidth size="small" error={!!errors.jornada}>
                        <InputLabel>Jornada *</InputLabel>
                        <Select
                            label="Jornada *"
                            value={formData.jornada}
                            onChange={e => setFormData(p => ({ ...p, jornada: e.target.value }))}
                        >
                            <MenuItem value="Mañana">Mañana</MenuItem>
                            <MenuItem value="Tarde">Tarde</MenuItem>
                            <MenuItem value="Completa">Completa</MenuItem>
                        </Select>
                        {errors.jornada && <FormHelperText>{errors.jornada}</FormHelperText>}
                    </FormControl>
                    <FormControl fullWidth size="small">
                        <InputLabel>Director de Grupo</InputLabel>
                        <Select
                            label="Director de Grupo"
                            value={formData.director_grupo_id}
                            onChange={e => setFormData(p => ({ ...p, director_grupo_id: e.target.value }))}
                            displayEmpty
                        >
                            <MenuItem value=""><em>Sin asignar</em></MenuItem>
                            {docentes.map(d => (
                                <MenuItem key={d.id} value={d.id}>
                                    {d.nombre} {d.apellidos} {d.grupo_nombre && d.grupo_id !== editingGrupo?.id ? `(ya en ${d.grupo_nombre})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Solo aparecen docentes con cuenta activa</FormHelperText>
                    </FormControl>
                    {editingGrupo && (
                        <FormControlLabel
                            control={<Switch checked={formData.activo} onChange={e => setFormData(p => ({ ...p, activo: e.target.checked }))} />}
                            label="Grupo activo"
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? <CircularProgress size={20} /> : editingGrupo ? 'Guardar Cambios' : 'Crear Grupo'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Dialog Confirmar Eliminación simple (sin estudiantes) ── */}
            <Dialog open={!!deleteConfirm && !reassignDialogOpen} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>¿Eliminar Grupo?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Estás a punto de eliminar el grupo <strong>{deleteConfirm?.nombre}</strong>. Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirm(null)} color="inherit">Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteDirect} disabled={saving}>
                        {saving ? <CircularProgress size={20} /> : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Dialog Reasignación (grupo con estudiantes) ── */}
            <Dialog open={reassignDialogOpen} onClose={() => { setReassignDialogOpen(false); setDeleteConfirm(null); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SwapHorizIcon /> Reasignar Estudiantes antes de Eliminar
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <Alert severity="warning">
                        El grupo <strong>{deleteConfirm?.nombre}</strong> tiene <strong>{deleteConfirm?.total_estudiantes}</strong> estudiante(s) registrado(s).
                        Selecciona el grupo al que serán trasladados antes de eliminarlo.
                    </Alert>
                    {errors.reassign && <Alert severity="error">{errors.reassign}</Alert>}
                    <FormControl fullWidth size="small">
                        <InputLabel>Grupo destino *</InputLabel>
                        <Select
                            label="Grupo destino *"
                            value={reassignTargetId}
                            onChange={e => { setReassignTargetId(e.target.value); setErrors({}); }}
                        >
                            {grupos
                                .filter(g => g.id !== deleteConfirm?.id)
                                .map(g => (
                                    <MenuItem key={g.id} value={g.id}>
                                        {g.nombre} — {g.jornada} ({g.total_estudiantes ?? 0} est.)
                                    </MenuItem>
                                ))}
                        </Select>
                        <FormHelperText>Todos los estudiantes de "{deleteConfirm?.nombre}" serán movidos a este grupo</FormHelperText>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setReassignDialogOpen(false); setDeleteConfirm(null); }} color="inherit">Cancelar</Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<SwapHorizIcon />}
                        onClick={handleReassignAndDelete}
                        disabled={saving || !reassignTargetId}
                    >
                        {saving ? <CircularProgress size={20} /> : 'Reasignar y Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GestionGrupos;
