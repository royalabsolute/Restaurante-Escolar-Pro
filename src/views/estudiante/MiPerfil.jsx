import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  FamilyRestroom as FamilyRestroomIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import { useAuth } from 'hooks/useAuth';
import ApiService from 'services/ApiService';
import { getProfilePhotoUrl } from 'utils/imageUtils';
import { useNotification } from 'contexts/NotificationContext';


const MiPerfil = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState({
    nombre: '',
    apellidos: '',
    matricula: '',
    email: '',
    telefono: '',
    grado: '',
    jornada: '',
    estrato: null,
    fecha_nacimiento: '',
    foto_perfil: '',
    acudiente_email: '',
    grupo_academico_id: '',
    stats: null
  });

  const [editableData, setEditableData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    grado: '',
    jornada: '',
    estrato: '',
    fecha_nacimiento: '',
    acudiente_nombre: '',
    acudiente_apellidos: '',
    acudiente_cedula: '',
    acudiente_telefono: '',
    acudiente_email: '',
    grupo_academico_id: ''
  });

  const [grupos, setGrupos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // ❌ ELIMINADO: Estados locales de error/success - Ahora se usan notificaciones de isla dinámica
  // const [error, setError] = useState('');
  // const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  const sectionPaperSx = {
    p: 3,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper'
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'background.paper',
      '&.Mui-focused fieldset': {
        borderColor: '#4A90E2',
        borderWidth: 2
      }
    }
  };

  const readOnlyBoxSx = {
    px: 1.5,
    py: 1.25,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.default'
  };

  const mapProfileResponse = useCallback((profile) => {
    const guardianSource = profile?.acudiente || {};

    const guardianNombre = guardianSource.nombre ?? profile?.acudiente_nombre ?? '';
    const guardianApellidos = guardianSource.apellidos ?? profile?.acudiente_apellidos ?? '';
    const guardianCedula = guardianSource.cedula ?? profile?.acudiente_cedula ?? '';
    const guardianTelefono = guardianSource.telefono ?? profile?.acudiente_telefono ?? '';
    const guardianEmail = guardianSource.email ?? profile?.acudiente_email ?? '';

    const estratoValue =
      profile?.estrato !== null &&
        profile?.estrato !== undefined &&
        profile?.estrato !== ''
        ? String(profile.estrato)
        : '';

    const emailValue = profile?.email || user?.email || '';
    const fechaNacimientoRaw = profile?.fecha_nacimiento || '';

    return {
      profileState: {
        nombre: profile?.nombre || 'No registrado',
        apellidos: profile?.apellidos || '',
        matricula: profile?.matricula || user?.matricula || 'No asignada',
        email: emailValue || 'No registrado',
        telefono: profile?.telefono || '',
        grado: profile?.grado || 'No asignado',
        jornada: profile?.jornada && profile?.jornada.trim() !== '' ? profile.jornada : 'No asignada',
        estrato: estratoValue || 'No asignado',
        fecha_nacimiento: fechaNacimientoRaw,
        foto_perfil: profile?.foto_perfil || '',
        acudiente_nombre: guardianNombre,
        acudiente_apellidos: guardianApellidos,
        acudiente_cedula: guardianCedula,
        acudiente_telefono: guardianTelefono,
        acudiente_email: guardianEmail,
        grupo_academico_id: profile?.grupo_academico_id || '',
        stats: profile?.stats || null
      },
      editableState: {
        nombre: profile?.nombre || '',
        apellidos: profile?.apellidos || '',
        email: emailValue || '',
        telefono: profile?.telefono || '',
        grado: profile?.grado || '',
        jornada: profile?.jornada && profile?.jornada.trim() !== '' ? profile.jornada : '',
        grupo_academico_id: profile?.grupo_academico_id || '',
        estrato: estratoValue,
        fecha_nacimiento: fechaNacimientoRaw ? fechaNacimientoRaw.split('T')[0] : '',
        acudiente_nombre: guardianNombre,
        acudiente_apellidos: guardianApellidos,
        acudiente_cedula: guardianCedula,
        acudiente_telefono: guardianTelefono,
        acudiente_email: guardianEmail
      }
    };
  }, [user]);

  const loadGrupos = useCallback(async () => {
    try {
      const response = await ApiService.get('/groups');
      if (response.status === 'SUCCESS') {
        setGrupos(response.data);
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      await loadGrupos();
      console.log('[MiPerfil] Iniciando carga de perfil...');
      console.log('[MiPerfil] Usuario actual:', user);

      const response = await ApiService.get('/students/my-profile');

      console.log('[MiPerfil] Respuesta completa del servidor:', response);
      console.log('[MiPerfil] Status de respuesta:', response?.status);
      console.log('[MiPerfil] Datos recibidos:', response?.data);
      console.log('[MiPerfil] Mensaje:', response?.message);

      if (response.status === 'SUCCESS') {
        const profile = response.data;
        const { profileState, editableState } = mapProfileResponse(profile);
        setProfileData(profileState);
        setEditableData(editableState);
      } else if (response.status === 'ERROR' && response.message?.includes('no encontrado')) {
        // Usuario no tiene perfil de estudiante creado
        showError('Tu perfil de estudiante no ha sido creado aún. Por favor contacta a la secretaría.');
        const { profileState, editableState } = mapProfileResponse({
          nombre: user?.nombre || 'Usuario',
          apellidos: user?.apellidos || '',
          matricula: user?.matricula || 'No asignada',
          email: user?.email || '',
          telefono: '',
          grado: '',
          jornada: '',
          estrato: null,
          fecha_nacimiento: '',
          foto_perfil: '',
          acudiente_nombre: '',
          acudiente_apellidos: '',
          acudiente_cedula: '',
          acudiente_telefono: '',
          acudiente_email: ''
        });
        setProfileData(profileState);
        setEditableData(editableState);
      } else {
        console.log('[MiPerfil] Respuesta no exitosa del servidor');
        console.log('[MiPerfil] Status recibido:', response?.status);
        console.log('[MiPerfil] Mensaje de error:', response?.message);
        showError('No se pudo cargar la información del perfil');
      }
    } catch (error) {
      console.error('🚨 [MiPerfil] Error completo:', error);
      console.error('🚨 [MiPerfil] Error message:', error.message);
      console.error('🚨 [MiPerfil] Error stack:', error.stack);
      if (error.response) {
        console.error('🚨 [MiPerfil] Response error:', error.response);
        console.error('🚨 [MiPerfil] Response status:', error.response.status);
        console.error('🚨 [MiPerfil] Response data:', error.response.data);
      }
      showError('Error cargando la información del perfil');
    } finally {
      setLoading(false);
    }
  }, [user, showError, mapProfileResponse]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);



  const handleInputChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // setError('') //  Ya no se usa;
      // setSuccess('') //  Ya no se usa;

      // Validar campos requeridos
      if (!editableData.nombre || !editableData.apellidos) {
        showError('El nombre y apellidos son obligatorios');
        setSaving(false);
        return;
      }

      // Validación de grupo académico omitida porque ahora es de solo lectura

      const guardianFields = [
        editableData.acudiente_nombre,
        editableData.acudiente_apellidos,
        editableData.acudiente_cedula,
        editableData.acudiente_telefono,
        editableData.acudiente_email
      ];

      const isGuardianSectionTouched = guardianFields.some(field => field && field.trim() !== '');

      if (isGuardianSectionTouched) {
        const hasEmptyGuardianField = guardianFields.some(field => !field || field.trim() === '');

        if (hasEmptyGuardianField) {
          showError('Completa todos los datos del acudiente antes de guardar');
          setSaving(false);
          return;
        }
      }

      const updateData = {
        nombre: editableData.nombre.trim(),
        apellidos: editableData.apellidos.trim(),
        email: editableData.email?.trim() || '',
        telefono: editableData.telefono?.trim() || '',
        fecha_nacimiento: editableData.fecha_nacimiento || null
        // Los campos de grupo_academico_id y estrato ya no se envían porque son de solo lectura guiada por admin
      };

      if (isGuardianSectionTouched) {
        updateData.acudiente = {
          nombre: editableData.acudiente_nombre.trim(),
          apellidos: editableData.acudiente_apellidos.trim(),
          cedula: editableData.acudiente_cedula.trim(),
          telefono: editableData.acudiente_telefono.trim(),
          email: editableData.acudiente_email.trim()
        };
      }

      console.log('[MiPerfil] Datos a enviar:', updateData);

      const response = await ApiService.put('/students/my-profile', updateData);

      console.log('[MiPerfil] Update Profile Response:', response);

      if (response.status === 'SUCCESS') {
        const { profileState, editableState } = mapProfileResponse(response.data);
        setProfileData(profileState);
        setEditableData(editableState);
        showSuccess('Perfil actualizado correctamente');
        setEditMode(false);
      } else {
        showError(response.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditableData({
      nombre: profileData.nombre || '',
      apellidos: profileData.apellidos || '',
      email: profileData.email === 'No registrado' ? '' : (profileData.email || ''),
      telefono: profileData.telefono || '',
      grupo_academico_id: profileData.grupo_academico_id || '',
      estrato: profileData.estrato === 'No asignado' || profileData.estrato === null ? '' : String(profileData.estrato),
      fecha_nacimiento: profileData.fecha_nacimiento ? profileData.fecha_nacimiento.split('T')[0] : '',
      acudiente_nombre: profileData.acudiente_nombre || '',
      acudiente_apellidos: profileData.acudiente_apellidos || '',
      acudiente_cedula: profileData.acudiente_cedula || '',
      acudiente_telefono: profileData.acudiente_telefono || '',
      acudiente_email: profileData.acudiente_email || ''
    });
    setEditMode(false);
    // setError('') //  Ya no se usa;
    // setSuccess('') //  Ya no se usa;
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen no debe superar los 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      // setError('') //  Ya no se usa;
      // setSuccess('') //  Ya no se usa;

      const formData = new FormData();
      formData.append('foto_perfil', file);

      const response = await ApiService.post('/students/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 'SUCCESS') {
        const newFilename = response.data.filename;

        // Actualizar inmediatamente el estado con el nombre del archivo
        setProfileData(prev => ({
          ...prev,
          foto_perfil: newFilename
        }));

        showSuccess('Foto de perfil actualizada correctamente');

        // Forzar recarga del perfil después de un momento
        setTimeout(() => {
          loadProfile();
        }, 500);
      } else {
        showError(response.message || 'Error al subir la foto');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      showError('Error al subir la foto de perfil');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const formattedBirthDate = (() => {
    if (!profileData.fecha_nacimiento) {
      return 'No registrada';
    }

    const parsedDate = new Date(profileData.fecha_nacimiento);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'No registrada';
    }

    return parsedDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  })();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando mi perfil...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 6 }}>
      <Paper
        elevation={0}
        sx={{
          ...sectionPaperSx,
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, md: 3 },
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            borderColor: 'primary.light',
            boxShadow: '0 10px 26px rgba(74, 144, 226, 0.14)'
          }
        }}
      >
        <Box position="relative" sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}>
          <Avatar
            src={getProfilePhotoUrl(profileData.foto_perfil)}
            sx={{
              width: { xs: 88, md: 110 },
              height: { xs: 88, md: 110 },
              bgcolor: '#E3F2FD',
              color: '#4A90E2',
              fontSize: '2.6rem',
              cursor: 'pointer',
              border: '2px solid',
              borderColor: 'divider',
              transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: 'primary.main',
                boxShadow: '0 8px 20px rgba(74, 144, 226, 0.2)'
              }
            }}
            onClick={() => document.getElementById('photo-upload-input')?.click()}
          >
            {!profileData.foto_perfil && `${profileData.nombre?.charAt(0) || ''}${profileData.apellidos?.charAt(0) || ''}`}
          </Avatar>
          <input
            id="photo-upload-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
          {uploadingPhoto && (
            <CircularProgress
              size={26}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                mt: '-13px',
                ml: '-13px',
                color: 'primary.main'
              }}
            />
          )}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Mi Perfil
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 0.5 }}>
            {profileData.nombre} {profileData.apellidos}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Matrícula: {profileData.matricula}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
            Haz clic en tu foto para actualizarla.
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Stack spacing={3}>
            <Paper sx={sectionPaperSx}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <PersonIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Información personal
                </Typography>
              </Stack>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Nombre
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editableData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Ingresa tu nombre"
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.nombre}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Apellidos
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editableData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      placeholder="Ingresa tus apellidos"
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.apellidos}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Matrícula
                  </Typography>
                  <Box
                    sx={{
                      ...readOnlyBoxSx,
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(74, 144, 226, 0.08)'
                    }}
                  >
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      {profileData.matricula}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Email
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      type="email"
                      value={editableData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Ingresa tu correo electrónico"
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.email || 'No registrado'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Teléfono
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editableData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="Ingresa tu número de contacto"
                      inputProps={{ maxLength: 15 }}
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.telefono || 'No registrado'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Fecha de nacimiento
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      type="date"
                      value={editableData.fecha_nacimiento}
                      onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                      sx={inputStyles}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {formattedBirthDate}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  {editMode ? (
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      sx={{
                        width: '100%',
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: { sm: 'flex-end' }
                      }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          bgcolor: 'success.main',
                          color: 'common.white',
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 3,
                          py: 1.4,
                          '&:hover': {
                            bgcolor: 'success.dark'
                          },
                          '&:disabled': {
                            bgcolor: 'action.disabled',
                            color: 'text.disabled'
                          }
                        }}
                      >
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={saving}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 3,
                          py: 1.4
                        }}
                      >
                        Cancelar
                      </Button>
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' }
                      }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => setEditMode(true)}
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          bgcolor: 'primary.main',
                          color: 'common.white',
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 3,
                          py: 1.4,
                          boxShadow: '0 6px 16px rgba(74, 144, 226, 0.25)',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            boxShadow: '0 8px 18px rgba(74, 144, 226, 0.35)'
                          }
                        }}
                      >
                        Editar información
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={sectionPaperSx}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <SchoolIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Información académica
                </Typography>
              </Stack>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Grado y Jornada
                  </Typography>
                  <Box
                    sx={{
                      ...readOnlyBoxSx,
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(74, 144, 226, 0.08)'
                    }}
                  >
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      {profileData.grado} - Jornada {profileData.jornada}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Estrato socioeconómico
                  </Typography>
                  <Box
                    sx={{
                      ...readOnlyBoxSx,
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(74, 144, 226, 0.08)'
                    }}
                  >
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      {profileData.estrato === 'No asignado' ? 'No asignado' : `Estrato ${profileData.estrato}`}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            {profileData.stats && (
              <Paper sx={sectionPaperSx}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Estadísticas de asistencia
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#E8F5E9', border: '1px solid', borderColor: '#C8E6C9', textAlign: 'center' }}>
                      <CheckCircleIcon sx={{ color: '#2E7D32', mb: 1 }} />
                      <Typography variant="h5" fontWeight={700} color="#2E7D32">
                        {profileData.stats.total_asistencias || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Asistencias</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FCE4EC', border: '1px solid', borderColor: '#F8BBD0', textAlign: 'center' }}>
                      <CancelIcon sx={{ color: '#C2185B', mb: 1 }} />
                      <Typography variant="h5" fontWeight={700} color="#C2185B">
                        {profileData.stats.faltas_sin_justificar || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Faltas sin justificar</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FFF3E0', border: '1px solid', borderColor: '#FFE0B2', textAlign: 'center' }}>
                      <AssignmentIcon sx={{ color: '#EF6C00', mb: 1 }} />
                      <Typography variant="h5" fontWeight={700} color="#EF6C00">
                        {profileData.stats.justificaciones_pendientes || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Just. Pendientes</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#E3F2FD', border: '1px solid', borderColor: '#BBDEFB', textAlign: 'center' }}>
                      <TrendingUpIcon sx={{ color: '#1565C0', mb: 1 }} />
                      <Typography variant="h5" fontWeight={700} color="#1565C0">
                        {profileData.stats.oportunidades_registradas > 0
                          ? ((profileData.stats.total_asistencias / profileData.stats.oportunidades_registradas) * 100).toFixed(1)
                          : 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Asistencia total</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Paper sx={sectionPaperSx}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <FamilyRestroomIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Información del acudiente
                </Typography>
              </Stack>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Nombre(s)
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editableData.acudiente_nombre}
                      onChange={(e) => handleInputChange('acudiente_nombre', e.target.value)}
                      placeholder="Nombre del acudiente"
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.acudiente_nombre || 'No registrado'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Apellidos
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editableData.acudiente_apellidos}
                      onChange={(e) => handleInputChange('acudiente_apellidos', e.target.value)}
                      placeholder="Apellidos del acudiente"
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.acudiente_apellidos || 'No registrado'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Cédula
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editableData.acudiente_cedula}
                      onChange={(e) => handleInputChange('acudiente_cedula', e.target.value)}
                      placeholder="Documento del acudiente"
                      inputProps={{ maxLength: 20 }}
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.acudiente_cedula || 'No registrada'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Teléfono
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editableData.acudiente_telefono}
                      onChange={(e) => handleInputChange('acudiente_telefono', e.target.value)}
                      placeholder="Teléfono del acudiente"
                      inputProps={{ maxLength: 15 }}
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.acudiente_telefono || 'No registrado'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Correo electrónico
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      type="email"
                      value={editableData.acudiente_email}
                      onChange={(e) => handleInputChange('acudiente_email', e.target.value)}
                      placeholder="Correo del acudiente"
                      sx={inputStyles}
                    />
                  ) : (
                    <Box sx={readOnlyBoxSx}>
                      <Typography variant="body1" fontWeight={600}>
                        {profileData.acudiente_email || 'No registrado'}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>

            <Alert
              severity="info"
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'primary.light',
                bgcolor: 'rgba(74, 144, 226, 0.08)'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Recuerda que tu matrícula no puede modificarse. Mantén actualizados tus datos y los de tu acudiente para que la secretaría pueda contactarlos fácilmente.
              </Typography>
            </Alert>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MiPerfil;