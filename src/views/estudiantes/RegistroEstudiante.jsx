import { useState, useCallback } from 'react';
import {
    Box, Grid, TextField, Button, MenuItem, Select, FormControl, InputLabel,
    CircularProgress, Alert, Typography, Divider, Paper
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    PersonAdd as PersonAddIcon,
    School as SchoolIcon,
    FamilyRestroom as FamilyIcon
} from '@mui/icons-material';
import PageHeader from 'components/common/PageHeader';
import { useNotification } from 'contexts/NotificationContext';
import useRoleBasedApi from 'hooks/useRoleBasedApi';
import ApiService from 'services/ApiService';

import { useEffect } from 'react';

// ──────────────────────────────────────────────
// Esquema de validación: TODOS los campos son obligatorios
// ──────────────────────────────────────────────
const validationSchema = Yup.object().shape({
    nombre: Yup.string().required('Campo obligatorio'),
    apellidos: Yup.string().required('Campo obligatorio'),
    email: Yup.string().email('Email inválido').required('Campo obligatorio'),
    password: Yup.string().min(8, 'Mínimo 8 caracteres').required('Campo obligatorio'),
    matricula: Yup.string().required('Campo obligatorio'),
    fecha_nacimiento: Yup.date().required('Campo obligatorio').typeError('Fecha inválida'),
    telefono: Yup.string().min(7, 'Teléfono inválido').required('Campo obligatorio'),
    grupo_academico_id: Yup.string().required('Campo obligatorio'),
    estrato: Yup.number().min(1).max(6).required('Campo obligatorio'),
    grupo_etnico: Yup.string().required('Campo obligatorio'),
    es_desplazado: Yup.string().required('Campo obligatorio'),
    acudiente_nombre: Yup.string().required('Campo obligatorio'),
    acudiente_apellidos: Yup.string().required('Campo obligatorio'),
    acudiente_cedula: Yup.string().required('Campo obligatorio'),
    acudiente_telefono: Yup.string().min(7, 'Teléfono inválido').required('Campo obligatorio'),
    acudiente_email: Yup.string().email('Email inválido').required('Campo obligatorio'),
});

const initialValues = {
    nombre: '', apellidos: '', email: '', password: '',
    rol: 'estudiante', estado: 'validado',
    matricula: '', fecha_nacimiento: '', telefono: '',
    grupo_academico_id: '', estrato: '',
    grupo_etnico: 'NINGUNO', es_desplazado: 'NO',
    acudiente_nombre: '', acudiente_apellidos: '',
    acudiente_cedula: '', acudiente_telefono: '', acudiente_email: '',
};

// ──────────────────────────────────────────────
// Sub-sección con título y línea divisora
// ──────────────────────────────────────────────
const Section = ({ icon: Icon, title, color = 'primary.main', children }) => (
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Icon sx={{ color, fontSize: 20 }} />
            <Typography fontWeight={700} variant="subtitle1" color={color}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>{children}</Grid>
    </Paper>
);

const Field = ({ label, name, formik, type = 'text', multiline = false, rows = 1, sx = {} }) => (
    <Grid item xs={12} sm={4} sx={sx}>
        <TextField
            fullWidth
            size="small"
            label={label}
            name={name}
            type={type}
            multiline={multiline}
            rows={rows}
            required
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[name] && Boolean(formik.errors[name])}
            helperText={formik.touched[name] && formik.errors[name]}
            InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        />
    </Grid>
);

// ──────────────────────────────────────────────
// Vista principal
// ──────────────────────────────────────────────
const RegistroEstudiante = () => {
    const { showSuccess, showError } = useNotification();
    const { endpoints } = useRoleBasedApi();
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [grupos, setGrupos] = useState([]);

    useEffect(() => {
        const fetchGrupos = async () => {
            try {
                const res = await ApiService.get('/groups');
                if (res.status === 'SUCCESS') setGrupos(res.data);
            } catch (err) {
                console.error('Error al cargar grupos:', err);
            }
        };
        fetchGrupos();
    }, []);

    const formik = useFormik({
        initialValues,
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                const createEndpoint = endpoints.students?.create || '/secretary/students';
                await ApiService.post(createEndpoint, { ...values, rol: 'estudiante', estado: 'validado' });
                showSuccess('¡Estudiante registrado exitosamente!');
                setSubmitSuccess(true);
                resetForm();
                setTimeout(() => setSubmitSuccess(false), 5000);
            } catch (error) {
                const msg = error?.response?.data?.message || error?.message || 'Error al registrar el estudiante';
                showError(msg);
            }
        }
    });

    const [resetting, setResetting] = useState(false);
    const handleReset = useCallback(() => {
        setResetting(true);
        formik.resetForm();
        setSubmitSuccess(false);
        setTimeout(() => setResetting(false), 300);
    }, [formik]);

    return (
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <PageHeader
                title="Registro de Nuevo Estudiante"
                subtitle="Complete todos los campos del formulario. Todos los datos son obligatorios."
                actions={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" color="inherit" onClick={handleReset} disabled={formik.isSubmitting || resetting}>
                            Limpiar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={formik.isSubmitting ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting ? 'Registrando...' : 'Registrar Estudiante'}
                        </Button>
                    </Box>
                }
            />

            {submitSuccess && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSubmitSuccess(false)}>
                    ✅ Estudiante registrado correctamente. El formulario ha sido limpiado.
                </Alert>
            )}

            {/* ── SECCIÓN 1: Datos del estudiante ── */}
            <Section icon={SchoolIcon} title="1. Datos del Estudiante" color="primary.main">
                <Field label="Nombres *" name="nombre" formik={formik} />
                <Field label="Apellidos *" name="apellidos" formik={formik} />
                <Field label="Email *" name="email" formik={formik} type="email" />
                <Field label="Contraseña *" name="password" formik={formik} type="password" />
                <Field label="Matrícula *" name="matricula" formik={formik} />
                <Field label="Fecha de Nacimiento *" name="fecha_nacimiento" formik={formik} type="date" />
                <Field label="Teléfono *" name="telefono" formik={formik} />

                {/* Grupo Académico */}
                <Grid item xs={12} sm={8}>
                    <FormControl fullWidth size="small" required error={formik.touched.grupo_academico_id && Boolean(formik.errors.grupo_academico_id)}>
                        <InputLabel>Grado y Jornada *</InputLabel>
                        <Select name="grupo_academico_id" label="Grado y Jornada *" value={formik.values.grupo_academico_id} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                            {grupos.map(g => (
                                <MenuItem key={g.id} value={g.id}>{g.nombre} - {g.jornada}</MenuItem>
                            ))}
                        </Select>
                        {formik.touched.grupo_academico_id && formik.errors.grupo_academico_id && (
                            <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.3 }}>{formik.errors.grupo_academico_id}</Typography>
                        )}
                    </FormControl>
                </Grid>

                {/* Estrato */}
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" required error={formik.touched.estrato && Boolean(formik.errors.estrato)}>
                        <InputLabel>Estrato *</InputLabel>
                        <Select name="estrato" label="Estrato *" value={formik.values.estrato} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                            {[1, 2, 3, 4, 5, 6].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                        </Select>
                        {formik.touched.estrato && formik.errors.estrato && (
                            <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.3 }}>{formik.errors.estrato}</Typography>
                        )}
                    </FormControl>
                </Grid>

                {/* Grupo Étnico */}
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" required error={formik.touched.grupo_etnico && Boolean(formik.errors.grupo_etnico)}>
                        <InputLabel>Grupo Étnico *</InputLabel>
                        <Select name="grupo_etnico" label="Grupo Étnico *" value={formik.values.grupo_etnico} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                            <MenuItem value="NINGUNO">Ninguno</MenuItem>
                            <MenuItem value="AFRODESCENDIENTE">Afrodescendiente</MenuItem>
                            <MenuItem value="INDIGENA">Indígena</MenuItem>
                            <MenuItem value="GITANO">Gitano / Rom</MenuItem>
                            <MenuItem value="RAIZAL">Raizal</MenuItem>
                            <MenuItem value="PALENQUERO">Palenquero</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* ¿Es desplazado? */}
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" required error={formik.touched.es_desplazado && Boolean(formik.errors.es_desplazado)}>
                        <InputLabel>¿Es Desplazado? *</InputLabel>
                        <Select name="es_desplazado" label="¿Es Desplazado? *" value={formik.values.es_desplazado} onChange={formik.handleChange} onBlur={formik.handleBlur}>
                            <MenuItem value="SI">Sí</MenuItem>
                            <MenuItem value="NO">No</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Section>

            {/* ── SECCIÓN 2: Datos del acudiente ── */}
            <Section icon={FamilyIcon} title="2. Datos del Acudiente / Responsable Legal" color="secondary.main">
                <Field label="Nombres del Acudiente *" name="acudiente_nombre" formik={formik} />
                <Field label="Apellidos del Acudiente *" name="acudiente_apellidos" formik={formik} />
                <Field label="Cédula / T. de Identidad *" name="acudiente_cedula" formik={formik} />
                <Field label="Teléfono del Acudiente *" name="acudiente_telefono" formik={formik} />
                <Field label="Email del Acudiente *" name="acudiente_email" formik={formik} type="email" />
            </Section>
        </Box>
    );
};

export default RegistroEstudiante;
