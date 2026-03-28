import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon
} from '@mui/icons-material';

const StatsWidget = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  description, 
  trend = null,
  percentage = null,
  subtitle = null 
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      case 'stable':
        return <StableIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      case 'stable': return 'default';
      default: return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease-in-out',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" color={`${color}.main`} fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              color: `${color}.main`,
              backgroundColor: `${color}.lighter`,
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>

        {description && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            {description}
          </Typography>
        )}

        {percentage !== null && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="textSecondary">
                Progreso
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {getTrendIcon()}
                <Typography variant="body2" color={`${getTrendColor()}.main`}>
                  {percentage}%
                </Typography>
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              color={color}
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.1)'
              }}
            />
          </Box>
        )}

        {trend && percentage === null && (
          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
            {getTrendIcon()}
            <Chip 
              label={trend === 'up' ? 'Incremento' : trend === 'down' ? 'Disminución' : 'Estable'}
              size="small"
              color={getTrendColor()}
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsWidget;
