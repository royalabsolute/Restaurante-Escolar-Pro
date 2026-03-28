import { useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  Collapse,
  Typography
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import ApiService from '../../services/ApiService';
import { useEffect } from 'react';

const UniversalSearch = ({
  onSearch,
  onFilter,
  placeholder = "Buscar por nombre, apellido, email...",
  showFilters = true,
  filters = {
    grado: true,
    jornada: true,
    estrato: true,
    estado: true
  }
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [jornadas, setJornadas] = useState([]);
  const [grados, setGrados] = useState([]);
  const estratos = [1, 2, 3, 4, 5, 6];
  const estados = ['pendiente', 'validado', 'rechazado'];

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await ApiService.get('/groups');
        if (response?.status === 'SUCCESS') {
          const groups = response.data || [];
          const uniqueGrades = [...new Set(groups.map(g => g.nombre))].sort();
          const uniqueJornadas = [...new Set(groups.map(g => g.jornada))].sort();
          setGrados(uniqueGrades);
          setJornadas(uniqueJornadas);
        }
      } catch (error) {
        console.error('Error loading groups in search:', error);
      }
    };
    loadGroups();
  }, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...activeFilters };

    if (value === '' || value === null) {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }

    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveFilters({});
    onSearch('');
    onFilter({});
  };

  const getActiveFiltersCount = () => {
    return Object.keys(activeFilters).length + (searchTerm ? 1 : 0);
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }}>
      <Grid container spacing={2} alignItems="center">
        {/* Barra de búsqueda principal */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              endAdornment: searchTerm && (
                <IconButton size="small" onClick={() => handleSearchChange({ target: { value: '' } })}>
                  <ClearIcon />
                </IconButton>
              )
            }}
            sx={{
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
          />
        </Grid>

        {/* Botones de control */}
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={`${getActiveFiltersCount()} filtro${getActiveFiltersCount() > 1 ? 's' : ''} activo${getActiveFiltersCount() > 1 ? 's' : ''}`}
                variant="outlined"
                color="primary"
                size="small"
              />
            )}

            {showFilters && (
              <IconButton
                onClick={() => setShowAdvanced(!showAdvanced)}
                color="primary"
                sx={{
                  backgroundColor: showAdvanced ? 'primary.main' : 'transparent',
                  color: showAdvanced ? 'white' : 'primary.main',
                  '&:hover': {
                    backgroundColor: showAdvanced ? 'primary.dark' : 'primary.light',
                    color: showAdvanced ? 'white' : 'primary.main',
                  }
                }}
              >
                <FilterIcon />
              </IconButton>
            )}

            {getActiveFiltersCount() > 0 && (
              <IconButton onClick={clearAllFilters} color="error" size="small">
                <ClearIcon />
              </IconButton>
            )}

            {showFilters && (
              <IconButton onClick={() => setShowAdvanced(!showAdvanced)} size="small">
                {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </Grid>

        {/* Filtros avanzados */}
        {showFilters && (
          <Grid item xs={12}>
            <Collapse in={showAdvanced}>
              <Box sx={{ pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Filtros Avanzados
                </Typography>
                <Grid container spacing={2}>
                  {filters.grado && (
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Grado</InputLabel>
                        <Select
                          value={activeFilters.grado || ''}
                          label="Grado"
                          onChange={(e) => handleFilterChange('grado', e.target.value)}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          {grados.map((grado) => (
                            <MenuItem key={grado} value={grado}>
                              {grado}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {filters.jornada && (
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Jornada</InputLabel>
                        <Select
                          value={activeFilters.jornada || ''}
                          label="Jornada"
                          onChange={(e) => handleFilterChange('jornada', e.target.value)}
                        >
                          <MenuItem value="">Todas</MenuItem>
                          {jornadas.map((jornada) => (
                            <MenuItem key={jornada} value={jornada}>
                              {jornada.charAt(0).toUpperCase() + jornada.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {filters.estrato && (
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Estrato</InputLabel>
                        <Select
                          value={activeFilters.estrato || ''}
                          label="Estrato"
                          onChange={(e) => handleFilterChange('estrato', e.target.value)}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          {estratos.map((estrato) => (
                            <MenuItem key={estrato} value={estrato}>
                              Estrato {estrato}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {filters.estado && (
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select
                          value={activeFilters.estado || ''}
                          label="Estado"
                          onChange={(e) => handleFilterChange('estado', e.target.value)}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          {estados.map((estado) => (
                            <MenuItem key={estado} value={estado}>
                              {estado.charAt(0).toUpperCase() + estado.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Collapse>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default UniversalSearch;
