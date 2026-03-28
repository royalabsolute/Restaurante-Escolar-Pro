import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TextField,
    InputAdornment,
    TablePagination,
    CircularProgress,
    IconButton,
    Tooltip,
    Stack,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    HistoryEdu as AuditIcon,
    Person as PersonIcon,
    Event as EventIcon,
    Notes as ActionIcon
} from '@mui/icons-material';
import ApiService from '../../services/ApiService';

const LogsAuditoria = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await ApiService.initialize();
            const response = await ApiService.get('/admin/audit-log');

            if (response && response.status === 'SUCCESS') {
                setLogs(response.data || []);
            } else {
                setError('No se pudieron cargar los logs de auditoría');
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredLogs = logs.filter((log) => {
        const searchLow = searchTerm.toLowerCase();
        return (
            log.accion?.toLowerCase().includes(searchLow) ||
            log.usuario_email?.toLowerCase().includes(searchLow) ||
            log.detalles?.toLowerCase().includes(searchLow) ||
            log.tabla_afectada?.toLowerCase().includes(searchLow)
        );
    });

    const getActionColor = (accion) => {
        const acc = accion?.toLowerCase() || '';
        if (acc.includes('login')) return 'info';
        if (acc.includes('create') || acc.includes('insert') || acc.includes('crear')) return 'success';
        if (acc.includes('update') || acc.includes('actualizar') || acc.includes('edit')) return 'warning';
        if (acc.includes('delete') || acc.includes('eliminar') || acc.includes('remove')) return 'error';
        return 'default';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AuditIcon fontSize="large" color="primary" />
                        Logs de Auditoría
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Registro histórico de todas las acciones realizadas en el sistema
                    </Typography>
                </Box>
                <Tooltip title="Recargar logs">
                    <IconButton onClick={fetchLogs} disabled={loading} sx={{ bgcolor: '#f5f5f5' }}>
                        {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Buscar por usuario, acción, tabla o detalles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>

                    <TableContainer component={Paper} elevation={0}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}><Stack direction="row" alignItems="center" gap={1}><EventIcon fontSize="small" /> Fecha</Stack></TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}><Stack direction="row" alignItems="center" gap={1}><PersonIcon fontSize="small" /> Usuario</Stack></TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}><Stack direction="row" alignItems="center" gap={1}><ActionIcon fontSize="small" /> Acción</Stack></TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Entidad</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Detalles</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>IP</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            <CircularProgress />
                                            <Typography variant="body2" sx={{ mt: 2 }}>Cargando registros...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            <Typography variant="body1" color="textSecondary">No se encontraron registros</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((log) => (
                                            <TableRow key={log.id} hover>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(log.fecha_accion)}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {log.usuario_email || 'Sistema'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.accion}
                                                        size="small"
                                                        color={getActionColor(log.accion)}
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={log.tabla_afectada || 'N/A'} size="small" variant="tonal" />
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 300 }}>
                                                    <Typography variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {log.detalles || 'Sin detalles'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                                    {log.ip_direccion || 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={filteredLogs.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[25, 50, 100]}
                        labelRowsPerPage="Filas por página"
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default LogsAuditoria;
