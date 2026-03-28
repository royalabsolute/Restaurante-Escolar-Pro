import { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [notifications, setNotifications] = useState([]); // 📚 Stack de notificaciones activas
  const [history, setHistory] = useState([]); // 🕒 Historial completo (últimas 10)
  const [historyOpen, setHistoryOpen] = useState(false); // 🔔 Estado del panel de historial
  const MAX_STACK = 5; // Máximo de notificaciones visibles simultáneamente
  const MAX_HISTORY = 10; // Máximo de notificaciones en historial

  const showNotification = useCallback((type, message, title = null) => {
    const id = Date.now() + Math.random(); // ID único
    const newNotification = {
      id,
      type,
      message,
      title,
      timestamp: Date.now()
    };

    // Agregar al stack de notificaciones activas
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_STACK));

    // Agregar al historial (mantener últimas MAX_HISTORY)
    setHistory(prev => [newNotification, ...prev].slice(0, MAX_HISTORY));

    // Mantener compatibilidad con notificación única (última)
    setNotification(newNotification);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const showSuccess = useCallback((message, title = '✓ Éxito') => {
    showNotification('success', message, title);
  }, [showNotification]);

  const showError = useCallback((message, title = '✕ Error') => {
    showNotification('error', message, title);
  }, [showNotification]);

  const showWarning = useCallback((message, title = '⚠ Advertencia') => {
    showNotification('warning', message, title);
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'ℹ Información') => {
    showNotification('info', message, title);
  }, [showNotification]);

  // ✨ PASO 3: Tipos especiales de notificación para QR con colores vibrantes
  const showQRSuccess = useCallback((message, title = '✅ QR Válido') => {
    showNotification('qr-success', message, title);
  }, [showNotification]);

  const showQRDuplicate = useCallback((message, title = '⚠️ Ya Registrado') => {
    showNotification('qr-duplicate', message, title);
  }, [showNotification]);

  const showQRError = useCallback((message, title = '❌ QR Inválido') => {
    showNotification('qr-error', message, title);
  }, [showNotification]);

  const showAttendanceRegistered = useCallback((message, title = '🎉 Asistencia Confirmada') => {
    showNotification('attendance-registered', message, title);
  }, [showNotification]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setNotification(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const toggleHistory = useCallback(() => {
    setHistoryOpen(prev => !prev);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notification,
        notifications, // 📚 Stack de notificaciones activas
        history, // 🕒 Historial completo
        historyOpen, // 🔔 Estado del panel de historial
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showQRSuccess,
        showQRDuplicate,
        showQRError,
        showAttendanceRegistered,
        clearNotification,
        removeNotification, // Eliminar una notificación específica del stack
        clearAllNotifications, // Limpiar todas las notificaciones activas
        clearHistory, // Limpiar historial completo
        toggleHistory // Abrir/cerrar panel de historial
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Exportar el contexto para uso en otros providers (como AuthContext)
export { NotificationContext };
