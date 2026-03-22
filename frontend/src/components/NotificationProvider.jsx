// frontend/src/components/NotificationProvider.jsx
// In-app toasts (sonner) + browser push notifications for job status updates
// Supports multi-job: prefixed toasts, all-complete summary, single push on all-done

import { createContext, useContext, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const NotificationContext = createContext(null);

const PERM_KEY = 'leprint_notif_perm'; // 'granted' | 'denied' | 'dismissed'

// Status → toast config
const STATUS_TOASTS = {
    SENT_TO_PI: { title: 'Job sent to kiosk', desc: 'Your job has reached the printer' },
    QUEUED:     { title: 'Queued', desc: 'Your job is in the queue' },
    PRINTING:   { title: 'Printing started', desc: 'Your document is being printed' },
    SCANNING:   { title: 'Scanning', desc: 'Your document is being scanned' },
    COMPLETED:  { title: 'Done! 🎉', desc: 'Your document is ready for pickup' },
    FAILED:     { title: 'Job failed', desc: 'Tap for details', isError: true },
};

const TYPE_PREFIX = { print: '[Print]', scan: '[Scan]', xerox: '[Xerox]' };

export function NotificationProvider({ children }) {
    const lastNotifiedRef = useRef({});

    // Fire sonner toast on key status transitions — now with job type prefix
    const notifyJobStatus = useCallback((status, jobId, jobType) => {
        const config = STATUS_TOASTS[status];
        if (!config) return;

        // Deduplicate — don't fire same status twice for the same job
        const key = `${jobId}-${status}`;
        if (lastNotifiedRef.current[key]) return;
        lastNotifiedRef.current[key] = true;

        const prefix = TYPE_PREFIX[jobType] || '';
        const title = prefix ? `${prefix} ${config.title}` : config.title;

        if (config.isError) {
            toast.error(title, { description: config.desc });
        } else if (status === 'COMPLETED') {
            toast.success(title, { description: config.desc });
        } else {
            toast(title, { description: config.desc });
        }

        // Browser push if tab is not visible (per-job — only for critical statuses)
        // NOTE: Individual push notifications are intentionally suppressed.
        // A single push fires on all-complete via notifyAllComplete().
    }, []);

    // Summary notification when ALL jobs complete
    const notifyAllComplete = useCallback((total, succeeded, failed) => {
        // Persistent in-app toast
        toast.success(`All ${total} jobs complete — ${succeeded} succeeded, ${failed} failed`, {
            duration: Infinity,
            dismissible: true,
        });

        // Single browser push notification
        if (document.visibilityState !== 'visible') {
            sendPushNotification(
                'LePrint — All jobs complete',
                `${succeeded} of ${total} jobs succeeded`
            );
        }
    }, []);

    // Soft permission request — returns true if we should show the nudge UI
    const shouldShowPushNudge = useCallback(() => {
        try {
            const stored = localStorage.getItem(PERM_KEY);
            if (stored) return false; // already answered
            if (!('Notification' in window)) return false;
            if (Notification.permission === 'granted') return false;
            if (Notification.permission === 'denied') return false;
            return true;
        } catch {
            return false;
        }
    }, []);

    // Actually request permission (call from soft nudge "Allow" button)
    const requestPushPermission = useCallback(async () => {
        try {
            if (!('Notification' in window)) return;
            const result = await Notification.requestPermission();
            localStorage.setItem(PERM_KEY, result);
        } catch {
            // fail silently
        }
    }, []);

    // Dismiss nudge without requesting
    const dismissPushNudge = useCallback(() => {
        try {
            localStorage.setItem(PERM_KEY, 'dismissed');
        } catch {
            // fail silently
        }
    }, []);

    // Send browser notification
    const sendPushNotification = useCallback((title, body) => {
        try {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') return;
            new Notification(title, {
                body,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
            });
        } catch {
            // fail silently
        }
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifyJobStatus,
            notifyAllComplete,
            shouldShowPushNudge,
            requestPushPermission,
            dismissPushNudge,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        // Return no-op functions if used outside provider
        return {
            notifyJobStatus: () => {},
            notifyAllComplete: () => {},
            shouldShowPushNudge: () => false,
            requestPushPermission: () => {},
            dismissPushNudge: () => {},
        };
    }
    return ctx;
}
