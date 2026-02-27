import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NotificationContext = createContext({});

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const success = (message, options = {}) => {
    addNotification({ type: 'success', message, ...options });
  };

  const error = (message, options = {}) => {
    addNotification({ type: 'error', message, ...options });
  };

  const warning = (message, options = {}) => {
    addNotification({ type: 'warning', message, ...options });
  };

  const info = (message, options = {}) => {
    addNotification({ type: 'info', message, ...options });
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, success, error, warning, info }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

function NotificationContainer({ notifications, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onRemove, 300);
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />
  };

  const colors = {
    success: 'bg-success/10 text-success border-success/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    info: 'bg-info/10 text-info border-info/20'
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 transform',
        colors[notification.type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex-shrink-0">
        {icons[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{notification.message}</p>
        {notification.description && (
          <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toast({ type = 'info', message, description, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />
  };

  const colors = {
    success: 'bg-success text-white',
    error: 'bg-destructive text-white',
    warning: 'bg-warning text-white',
    info: 'bg-info text-white'
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300',
      colors[type],
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    )}>
      {icons[type]}
      <div>
        <p className="text-sm font-medium">{message}</p>
        {description && (
          <p className="text-xs opacity-90">{description}</p>
        )}
      </div>
    </div>
  );
}

export function Alert({ type = 'info', title, message, className, ...props }) {
  const icons = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />
  };

  const colors = {
    success: 'bg-success/10 text-success border-success/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    info: 'bg-info/10 text-info border-info/20'
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        colors[type],
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1">
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
