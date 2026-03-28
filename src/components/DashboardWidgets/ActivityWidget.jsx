import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const ActivityWidget = ({ title, activities = [], maxItems = 5 }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <WarningIcon sx={{ color: 'error.main' }} />;
      case 'info':
        return <InfoIcon sx={{ color: 'info.main' }} />;
      default:
        return <NotificationsIcon sx={{ color: 'primary.main' }} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'primary';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {activities.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            py={4}
          >
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="textSecondary">
              No hay actividades recientes
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activities.slice(0, maxItems).map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {activity.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {activity.priority && (
                            <Chip
                              label={activity.priority}
                              size="small"
                              color={getActivityColor(activity.type)}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                          <Typography variant="caption" color="textSecondary">
                            <ScheduleIcon sx={{ fontSize: 12, mr: 0.5 }} />
                            {formatTime(activity.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                        {activity.description}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < activities.slice(0, maxItems).length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityWidget;
