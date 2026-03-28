import { useState, useRef } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip
} from '@mui/material';
import PageHeader from 'components/common/PageHeader';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import FormularioRegistroManual from './FormularioRegistroManual';

const Documentacion = () => {
    const [openManual, setOpenManual] = useState(false);
    const printRef = useRef();

    const handlePrint = () => {
        window.print();
    };

    const documentos = [
        {
            id: 'registro-manual',
            titulo: 'Formulario de Registro Manual',
            descripcion: 'Formato físico para la recolección de datos de estudiantes y acudientes. Obligatorio para el archivo físico.',
            icon: <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            etiqueta: 'Estudiantes',
            color: 'primary'
        }
        // Se pueden añadir más documentos aquí en el futuro (ej. Contratos, Autorizaciones específicas)
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            <PageHeader
                title="Documentación y Formatos"
                subtitle="Accede a los formatos oficiales e imprimibles para la gestión del restaurante"
            />

            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                Formatos Disponibles
            </Typography>

            <Grid container spacing={3}>
                {documentos.map((doc) => (
                    <Grid item xs={12} sm={6} md={4} key={doc.id}>
                        <Card sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-5px)' }
                        }}>
                            <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                                <Box sx={{ mb: 2 }}>
                                    {doc.icon}
                                </Box>
                                <Chip
                                    label={doc.etiqueta}
                                    size="small"
                                    color={doc.color}
                                    variant="outlined"
                                    sx={{ mb: 1.5, fontWeight: 700 }}
                                />
                                <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 800 }}>
                                    {doc.titulo}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {doc.descripcion}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    onClick={() => setOpenManual(true)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Ver e Imprimir
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* MODAL DE PREVISUALIZACIÓN */}
            <Dialog
                fullScreen
                open={openManual}
                onClose={() => setOpenManual(false)}
                PaperProps={{
                    sx: { bgcolor: 'grey.100' }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'white',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 4
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Previsualización de Documento</Typography>
                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{ mr: 2, borderRadius: 2 }}
                        >
                            Imprimir Ahora
                        </Button>
                        <IconButton onClick={() => setOpenManual(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{
                        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                        bgcolor: 'white'
                    }}>
                        <FormularioRegistroManual />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ bgcolor: 'white', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setOpenManual(false)} variant="outlined">Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Documentacion;
