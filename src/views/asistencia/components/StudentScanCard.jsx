import { Box, Card, CardContent, Typography, Avatar, Divider, Chip, Stack } from '@mui/material';
import { getProfilePhotoUrl } from 'utils/imageUtils';
import { Person as PersonIcon, School as SchoolIcon, Schedule as ScheduleIcon } from '@mui/icons-material';

const StudentScanCard = ({ student, status }) => {
    if (!student) return null;

    return (
        <Card sx={{
            width: '100%',
            maxWidth: 500,
            mx: 'auto',
            mt: 3,
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: 8,
            animation: 'slide-up 0.5s ease-out',
            '@keyframes slide-up': {
                '0%': { transform: 'translateY(20px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 }
            },
            border: 1,
            borderColor: status === 'already_registered' ? 'warning.main' : 'divider'
        }}>
            <Box sx={{
                height: 100,
                bgcolor: status === 'already_registered' ? 'warning.light' : 'primary.main',
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center',
                px: 3
            }}>
                <Typography variant="h5" color="white" fontWeight="bold">
                    {status === 'already_registered' ? 'Registro Duplicado' : 'Estudiante Identificado'}
                </Typography>
            </Box>

            <CardContent sx={{ position: 'relative', pt: 0 }}>
                <Avatar
                    src={getProfilePhotoUrl(student.foto_perfil)}
                    sx={{
                        width: 120,
                        height: 120,
                        mt: -7.5,
                        border: 4,
                        borderColor: 'background.paper',
                        boxShadow: 4,
                        mx: 'auto'
                    }}
                >
                    <PersonIcon sx={{ fontSize: 60 }} />
                </Avatar>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {student.nombre} {student.apellidos}
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                        <Chip
                            icon={<SchoolIcon />}
                            label={student.grado || 'Grado N/A'}
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            icon={<ScheduleIcon />}
                            label={student.jornada || 'Jornada N/A'}
                            color="secondary"
                            variant="outlined"
                        />
                    </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ px: 2, pb: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">Matrícula</Typography>
                            <Typography variant="body1" fontWeight="medium">{student.matricula || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">Estado</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: student.usuario_estado === 'activo' ? 'success.main' : 'error.main',
                                    mr: 1
                                }} />
                                <Typography variant="body1" fontWeight="medium">
                                    {student.usuario_estado === 'activo' ? 'Activo' : 'Inactivo'}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </CardContent>
        </Card>
    );
};

// Simple Grid replacement to avoid MUI Grid v1/v2 confusion in small component
const Grid = ({ children, container, item, xs, spacing }) => (
    <Box sx={{
        display: container ? 'flex' : 'block',
        flexWrap: 'wrap',
        margin: container ? `-${(spacing || 0) * 4}px` : 0,
        width: item ? `${(xs / 12) * 100}%` : 'auto',
        '& > *': { p: container ? (spacing || 0) * 0.5 : 0 }
    }}>
        {children}
    </Box>
);

export default StudentScanCard;
