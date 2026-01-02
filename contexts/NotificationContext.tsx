import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, [removeNotification]);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* Container de Notificações */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`
              pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border 
              animate-in slide-in-from-right-full duration-300 min-w-[320px] max-w-md
              ${n.type === 'success' ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-100' : ''}
              ${n.type === 'error' ? 'bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-100' : ''}
              ${n.type === 'info' ? 'bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-100' : ''}
            `}
                    >
                        <div className={`p-2 rounded-xl ${n.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                n.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                                    'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                            }`}>
                            {n.type === 'success' && <CheckCircle size={20} />}
                            {n.type === 'error' && <AlertCircle size={20} />}
                            {n.type === 'info' && <Info size={20} />}
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-bold leading-tight">{n.type === 'success' ? 'Sucesso!' : n.type === 'error' ? 'Erro' : 'Informação'}</p>
                            <p className="text-xs opacity-80 mt-0.5">{n.message}</p>
                        </div>

                        <button
                            onClick={() => removeNotification(n.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
};
