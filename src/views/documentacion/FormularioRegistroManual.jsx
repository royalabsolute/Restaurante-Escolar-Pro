import { Box, Typography, Grid, Divider } from '@mui/material';
import logoEmpresa from '../../assets/images/Iesadep.png';

/**
 * Formulario de inscripción manual al Restaurante Escolar.
 * Optimizado para impresión en papel tamaño carta (21.59cm × 27.94cm) o oficio.
 */
const FormularioRegistroManual = () => {
    // Caja dinámica reutilizable para campo de escritura
    const WritingLine = ({ height = 16 }) => (
        <Box sx={{ borderBottom: '1.5px solid black', height, mt: 0.2 }} />
    );

    // Sección de encabezado de bloque
    const SectionHeader = ({ number, title }) => (
        <Box sx={{ bgcolor: '#d6d6d6', p: '3px 8px', border: '1px solid #000', mb: 1.2, mt: 1 }}>
            <Typography sx={{ fontWeight: 800, textAlign: 'center', textTransform: 'uppercase', fontSize: '8px', letterSpacing: 0.3 }}>
                {number}. {title}
            </Typography>
        </Box>
    );

    // Checkbox manual
    const CheckBox = ({ label }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Box sx={{ border: '1px solid #000', width: 10, height: 10, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '7px' }}>{label}</Typography>
        </Box>
    );

    // Etiqueta de campo
    const FieldLabel = ({ children }) => (
        <Typography sx={{ fontSize: '7px', fontWeight: 700, mb: 0.2, textTransform: 'uppercase', lineHeight: 1.1 }}>
            {children}
        </Typography>
    );

    return (
        <Box
            sx={{
                p: '1cm',
                bgcolor: 'white',
                color: 'black',
                width: '21.59cm',
                minHeight: '27.94cm',
                mx: 'auto',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                fontSize: '8px',
            }}
            className="printable-form"
        >
            {/* ── ENCABEZADO ── */}
            <Grid container alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={2}>
                    <Box component="img" src={logoEmpresa} alt="Logo IESADEP" sx={{ width: '60px', height: 'auto' }} />
                </Grid>
                <Grid item xs={8} sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', lineHeight: 1.2 }}>
                        Institución Educativa San Antonio de Prado
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '9.5px', mt: 0.3 }}>
                        Formulario de Inscripción al Restaurante Escolar
                    </Typography>
                </Grid>
                <Grid item xs={2} sx={{ textAlign: 'right' }}>
                    <Typography sx={{ display: 'block', fontWeight: 600, fontSize: '7px' }}>CÓDIGO: F-RE-01</Typography>
                    <Typography sx={{ display: 'block', fontSize: '7px' }}>VERSIÓN: 2.0</Typography>
                </Grid>
            </Grid>

            <Divider sx={{ mb: 1, borderBottomWidth: 1.5, borderColor: 'black' }} />

            {/* Fecha y municipio — año completamente manual */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 0.3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '7px' }}>
                    FECHA: ____ / ____ / ________
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '7px' }}>
                    MUNICIPIO: MEDELLÍN — CORREG. SAN ANTONIO DE PRADO
                </Typography>
            </Box>

            {/* ══════════════ SECCIÓN 1 ══════════════ */}
            <SectionHeader number="1" title="Datos Personales del Estudiante" />

            <Grid container spacing={1.5} sx={{ mb: 1.2, px: 0.3 }}>
                <Grid item xs={6}>
                    <FieldLabel>Nombres Completos:</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={6}>
                    <FieldLabel>Apellidos Completos:</FieldLabel>
                    <WritingLine />
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mb: 1.2, px: 0.3 }}>
                <Grid item xs={4}>
                    <FieldLabel>Fecha de Nacimiento (DD/MM/AAAA):</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={4}>
                    <FieldLabel>Teléfono de Contacto:</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={4}>
                    <FieldLabel>Email:</FieldLabel>
                    <WritingLine />
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mb: 1.2, px: 0.3 }}>
                <Grid item xs={3.5}>
                    <FieldLabel>Matrícula (Opcional):</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={3.5}>
                    <FieldLabel>Grado y Grupo (Ej: 10-2):</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={5}>
                    <FieldLabel>Jornada:</FieldLabel>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                        <CheckBox label="Mañana" />
                        <CheckBox label="Tarde" />
                        <CheckBox label="Completa" />
                    </Box>
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mb: 1.2, px: 0.3 }}>
                <Grid item xs={2.5}>
                    <FieldLabel>Estrato (1-6):</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={5}>
                    <FieldLabel>Grupo Étnico:</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={4.5}>
                    <FieldLabel>¿Es Desplazado?:</FieldLabel>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <CheckBox label="SÍ" />
                        <CheckBox label="NO" />
                    </Box>
                </Grid>
            </Grid>

            {/* ══════════════ SECCIÓN 2 ══════════════ */}
            <SectionHeader number="2" title="Datos del Acudiente / Responsable Legal" />

            <Grid container spacing={1.5} sx={{ mb: 1.2, px: 0.3 }}>
                <Grid item xs={6}>
                    <FieldLabel>Nombres Completos:</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={6}>
                    <FieldLabel>Apellidos Completos:</FieldLabel>
                    <WritingLine />
                </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mb: 1.5, px: 0.3 }}>
                <Grid item xs={4}>
                    <FieldLabel>Cédula / T. de Identidad:</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={4}>
                    <FieldLabel>Teléfono de Contacto:</FieldLabel>
                    <WritingLine />
                </Grid>
                <Grid item xs={4}>
                    <FieldLabel>Email:</FieldLabel>
                    <WritingLine />
                </Grid>
            </Grid>

            {/* ══════════════ AUTORIZACIÓN ══════════════ */}
            <Box sx={{ p: '7px 9px', border: '1.5px solid #000', mb: 1.8 }}>
                <Typography sx={{ fontWeight: 800, mb: 0.6, textAlign: 'center', fontSize: '7.5px', textTransform: 'uppercase' }}>
                    Autorización Tratamiento de Datos Personales — Ley 1581 de 2012
                </Typography>
                <Typography sx={{ textAlign: 'justify', fontSize: '7px', lineHeight: 1.45 }}>
                    En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, yo, en representación propia y/o del estudiante menor de edad aquí registrado, autorizo a la{' '}
                    <strong>Institución Educativa San Antonio de Prado</strong> para que realice el tratamiento (recolección, almacenamiento y uso) de los datos personales suministrados
                    para fines académicos, administrativos y de control del Programa de Alimentación Escolar (PAE). Declaro que he sido informado sobre la política de tratamiento de datos
                    y mis derechos a conocer, actualizar y rectificar la información. La Institución se compromete a salvaguardar la privacidad y seguridad de los datos bajo los estándares
                    vigentes en el territorio colombiano.
                </Typography>
            </Box>

            {/* ══════════════ FIRMAS ══════════════ */}
            <Grid container sx={{ mt: 0.5 }}>
                <Grid item xs={6} sx={{ pr: 4 }}>
                    <Box sx={{ borderTop: '1.5px solid black', pt: 0.8, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '8px' }}>
                            Firma del Estudiante
                        </Typography>
                        <Typography sx={{ display: 'block', mt: 0.6, fontSize: '7px' }}>
                            Documento No: ______________________
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} sx={{ pl: 4 }}>
                    <Box sx={{ borderTop: '1.5px solid black', pt: 0.8, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '8px' }}>
                            Firma del Acudiente
                        </Typography>
                        <Typography sx={{ display: 'block', mt: 0.6, fontSize: '7px' }}>
                            Documento No: ______________________
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* ══════════════ FOOTER — siempre abajo del flujo, nunca superpuesto ══════════════ */}
            <Box sx={{ mt: 2.5, borderTop: '1px dashed #aaa', pt: 0.8, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '6.5px', color: '#555' }}>
                    Documento oficial de la I.E. San Antonio de Prado · Información confidencial · Entregar en secretaría o coordinación para su registro digital.
                </Typography>
            </Box>

            {/* Estilos de impresión */}
            <style>
                {`
          @media print {
            body * { visibility: hidden; }
            .printable-form, .printable-form * { visibility: visible; }
            .printable-form {
              position: absolute; left: 0; top: 0;
              width: 21.59cm; border: none !important;
            }
            @page { size: letter portrait; margin: 0.8cm; }
          }
        `}
            </style>
        </Box>
    );
};

export default FormularioRegistroManual;
