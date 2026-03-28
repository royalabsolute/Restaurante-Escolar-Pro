import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import MainCard from 'components/Card/MainCard';
import { useAuth } from 'hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from 'contexts/NotificationContext';
import ApiService from 'services/ApiService';

const CrearJustificacion = () => {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha_ausencia: null,
    motivo: '',
    descripcion: '',
    documento_adjunto: null
  });

  const [errors, setErrors] = useState({});

  const motivosComunes = [
    'Cita médica',
    'Enfermedad',
    'Calamidad doméstica',
    'Viaje familiar autorizado',
    'Trámites personales',
    'Emergencia familiar',
    'Otro'
  ];

  const steps = ['Información Básica', 'Detalles', 'Confirmación'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo y tamaño del archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        showError('Solo se permiten archivos JPG, PNG o PDF', 'Formato no válido');
        return;
      }

      if (file.size > maxSize) {
        showError('El archivo no puede ser mayor a 5MB', 'Archivo muy grande');
        return;
      }

      setFormData(prev => ({
        ...prev,
        documento_adjunto: file
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.fecha_ausencia) {
        newErrors.fecha_ausencia = 'La fecha de ausencia es requerida';
      } else {
        const today = new Date();
        const fechaAusencia = new Date(formData.fecha_ausencia);
        const diffDays = Math.ceil((today - fechaAusencia) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 3) {
          newErrors.fecha_ausencia = 'Solo se pueden justificar ausencias de los últimos 3 días';
        }
      }

      if (!formData.motivo) {
        newErrors.motivo = 'El motivo es requerido';
      }
    }

    if (step === 1) {
      if (!formData.descripcion || formData.descripcion.trim().length < 10) {
        newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        setConfirmDialogOpen(true);
      } else {
        setActiveStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      const selectedDate = formData.fecha_ausencia;
      const isoDate = selectedDate instanceof Date
        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
            .toISOString()
            .split('T')[0]
        : '';

      if (!isoDate) {
        showError('No se pudo procesar la fecha seleccionada', 'Dato inválido');
        setLoading(false);
        return;
      }

      formDataToSend.append('fecha_falta', isoDate);
      formDataToSend.append('motivo', formData.motivo);
      formDataToSend.append('descripcion', formData.descripcion);
      
      if (formData.documento_adjunto) {
        formDataToSend.append('documento', formData.documento_adjunto);
      }

      const response = await ApiService.postFormData('/students/justifications', formDataToSend);
      const payload = response?.data;

      if (payload?.status === 'SUCCESS') {
        showSuccess(payload?.message || 'Justificación enviada exitosamente', '✓ Enviada');
        setConfirmDialogOpen(false);
        navigate('/justificaciones/mis-justificaciones');
      } else {
        showError(payload?.message || 'Error al enviar la justificación', 'Error al enviar');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al enviar la justificación', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Ausencia"
                  value={formData.fecha_ausencia}
                  onChange={(date) => handleInputChange('fecha_ausencia', date)}
                  maxDate={new Date()}
                  minDate={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.fecha_ausencia}
                      helperText={errors.fecha_ausencia || 'Solo se pueden justificar ausencias de los últimos 3 días'}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.motivo}>
                <InputLabel>Motivo de la Ausencia</InputLabel>
                <Select
                  value={formData.motivo}
                  label="Motivo de la Ausencia"
                  onChange={(e) => handleInputChange('motivo', e.target.value)}
                >
                  {motivosComunes.map((motivo) => (
                    <MenuItem key={motivo} value={motivo}>
                      {motivo}
                    </MenuItem>
                  ))}
                </Select>
                {errors.motivo && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {errors.motivo}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción Detallada"
                placeholder="Explique detalladamente las razones de su ausencia..."
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                error={!!errors.descripcion}
                helperText={errors.descripcion || `${formData.descripcion.length}/500 caracteres`}
                inputProps={{ maxLength: 500 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AttachFileIcon sx={{ mr: 1 }} />
                    Documento de Soporte (Opcional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Adjunte un documento que respalde su justificación (certificado médico, carta, etc.)
                  </Typography>
                  <input
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    id="documento-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="documento-upload">
                    <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                      Seleccionar Archivo
                    </Button>
                  </label>
                  {formData.documento_adjunto && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Archivo seleccionado: {formData.documento_adjunto.name}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Revise cuidadosamente la información antes de enviar su justificación.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Fecha de Ausencia:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {formData.fecha_ausencia?.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Motivo:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.motivo}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Descripción:</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">{formData.descripcion}</Typography>
              </Paper>
            </Grid>
            {formData.documento_adjunto && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Documento Adjunto:</Typography>
                <Typography variant="body2">{formData.documento_adjunto.name}</Typography>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <MainCard>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Crear Justificación de Ausencia
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete el formulario para justificar su ausencia escolar
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3 }}>
          {renderStepContent(activeStep)}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Anterior
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            startIcon={activeStep === steps.length - 1 ? <SendIcon /> : null}
          >
            {activeStep === steps.length - 1 ? 'Enviar Justificación' : 'Siguiente'}
          </Button>
        </Box>

        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>
            <CheckCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
            Confirmar Envío
          </DialogTitle>
          <DialogContent>
            <Typography>
              ¿Está seguro de que desea enviar esta justificación? 
              Una vez enviada no podrá ser modificada.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {loading ? 'Enviando...' : 'Confirmar y Enviar'}
            </Button>
          </DialogActions>
        </Dialog>
      </MainCard>
    </Box>
  );
};

export default CrearJustificacion;
