import { useState, useMemo } from 'react';
import {
    Box, TextField, InputAdornment, List, ListItem,
    ListItemAvatar, Avatar, ListItemText, ListItemSecondaryAction,
    Button, Typography, Chip, Divider, Paper
} from '@mui/material';
import {
    Search as SearchIcon,
    Person as PersonIcon,
    Check as CheckIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { getProfilePhotoUrl } from 'utils/imageUtils';

const ManualStudentSearch = ({ students, asistenciasHoy, onRegister, processing }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const attendanceIdsSet = useMemo(() => {
        return new Set(asistenciasHoy.map(a => a.estudiante_id));
    }, [asistenciasHoy]);

    const filteredStudents = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase().trim();
        const safeStudents = Array.isArray(students) ? students : [];
        if (!lowerTerm) return safeStudents.slice(0, 50); // Mostrar los primeros 50 por defecto

        return safeStudents.filter(s =>
            `${s.nombre} ${s.apellidos}`.toLowerCase().includes(lowerTerm) ||
            s.matricula?.toLowerCase().includes(lowerTerm) ||
            s.grado?.toLowerCase().includes(lowerTerm)
        ).slice(0, 50);
    }, [students, searchTerm]);

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <TextField
                fullWidth
                placeholder="Buscar por nombre, matrícula o grado..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                    sx: { borderRadius: 3, bgcolor: 'grey.50' }
                }}
                sx={{ mb: 2 }}
            />

            <Paper
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'grey.100',
                    overflowY: 'auto',
                    flexGrow: 1,
                    bgcolor: 'background.paper'
                }}
                elevation={0}
            >
                <List sx={{ p: 0 }}>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((s, idx) => {
                            const isRegistered = attendanceIdsSet.has(s.id);
                            return (
                                <Box key={s.id}>
                                    <ListItem sx={{ py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar src={getProfilePhotoUrl(s.foto_perfil)}>
                                                {s.nombre ? s.nombre.charAt(0) : <PersonIcon />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="body2" fontWeight="bold">{s.nombre} {s.apellidos}</Typography>}
                                            secondary={
                                                <Typography variant="caption" color="textSecondary">
                                                    {s.grado} • {s.jornada} • <Chip label={s.matricula} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.65rem' }} />
                                                </Typography>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            {isRegistered ? (
                                                <Chip
                                                    icon={<CheckIcon style={{ fontSize: 14 }} />}
                                                    label="Registrado"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => onRegister(s)}
                                                    disabled={processing}
                                                    sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                                                >
                                                    Registrar
                                                </Button>
                                            )}
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {idx < filteredStudents.length - 1 && <Divider component="li" />}
                                </Box>
                            );
                        })
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                                {searchTerm ? `No se encontraron estudiantes con "${searchTerm}"` : 'No hay estudiantes disponibles'}
                            </Typography>
                        </Box>
                    )}
                </List>
            </Paper>
        </Box>
    );
};

export default ManualStudentSearch;
