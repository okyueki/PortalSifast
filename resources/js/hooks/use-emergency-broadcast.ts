import { useEffect, useCallback, useRef, useState } from 'react';

// Type definitions for broadcast events
export interface EmergencyReportCreatedEvent {
  report_id: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  sender_name: string | null;
  sender_phone: string | null;
  status: string;
  created_at: string;
}

export interface EmergencyReportStatusChangedEvent {
  report_id: string;
  previous_status: string;
  status: string;
  operator_name: string | null;
  responded_at: string | null;
  arrived_at: string | null;
  resolved_at: string | null;
  destination_type: string | null;
  destination_name: string | null;
  updated_at: string;
}

export interface OfficerLocationUpdatedEvent {
  officer_id: number;
  officer_name: string | null;
  report_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  heading: number | null;
  eta_minutes: number;
  distance_meters: number;
  updated_at: string;
}

export interface UseEmergencyBroadcastOptions {
  onReportCreated?: (event: EmergencyReportCreatedEvent) => void;
  onStatusChanged?: (event: EmergencyReportStatusChangedEvent) => void;
  onOfficerLocationUpdated?: (event: OfficerLocationUpdatedEvent) => void;
  enabled?: boolean;
  channelName?: string;
  reconnectInterval?: number;
  maxRetries?: number;
}

export interface UseEmergencyBroadcastReturn {
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  reconnect: () => void;
  disconnect: () => void;
}

// Check if Echo is available
function isEchoAvailable(): boolean {
  return typeof window !== 'undefined' && 'Echo' in window;
}

// Get CSRF token
function getCsrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    || (document.querySelector('input[name="_token"]') as HTMLInputElement)?.value
    || '';
}

// Initialize Echo if not already done
function initializeEcho(): Promise<void> {
  return new Promise((resolve) => {
    if (isEchoAvailable()) {
      resolve();
      return;
    }

    import('laravel-echo').then(({ default: Echo }) => {
      if (typeof window !== 'undefined' && !('Echo' in window)) {
        const csrfToken = getCsrfToken();
        const host = window.location.hostname;
        const port = import.meta.env.VITE_REVERB_PORT || '8080';

        try {
          (window as unknown as { Echo: typeof Echo }).Echo = new Echo({
            broadcaster: 'reverb',
            host: `${host}:${port}`,
            authorizer: (channel: { name: string }, _options: unknown) => {
              return {
                authorize: (socketId: string, callback: (response: { authorized: boolean }) => void) => {
                  fetch('/broadcasting/auth', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-CSRF-Token': csrfToken,
                    },
                    body: JSON.stringify({
                      socket_id: socketId,
                      channel_name: channel.name,
                    }),
                  })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => callback({ authorized: data.authorised }))
                    .catch((error) => {
                      console.error('Authorization failed:', error);
                      callback({ authorized: false });
                    });
                },
              };
            },
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          });
        } catch (error) {
          console.error('Failed to initialize Echo:', error);
        }
      }
      resolve();
    }).catch(() => {
      resolve();
    });
  });
}

export function useEmergencyBroadcast(options: UseEmergencyBroadcastOptions = {}): UseEmergencyBroadcastReturn {
  const {
    onReportCreated,
    onStatusChanged,
    onOfficerLocationUpdated,
    enabled = true,
    channelName = 'emergency.command-center',
    reconnectInterval = 5000,
    maxRetries = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const channelRef = useRef<unknown>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (channelRef.current && isEchoAvailable()) {
      try {
        (window as unknown as { Echo: { leave: (channel: string) => void } }).Echo.leave(channelName);
      } catch {
        // Channel might already be left
      }
      channelRef.current = null;
    }
    setIsConnected(false);
  }, [channelName]);

  const connect = useCallback(async () => {
    if (!enabled || isUnmountedRef.current) {
      cleanup();
      return;
    }

    // Clean up previous connection
    cleanup();
    setConnectionError(null);

    try {
      await initializeEcho();

      // Wait a bit for Echo to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!isEchoAvailable()) {
        throw new Error('Laravel Echo not available. Please ensure Reverb is running.');
      }

      const echo = (window as unknown as {
        Echo: {
          private: (channel: string) => {
            listen: (event: string, callback: (e: unknown) => void) => unknown;
            unsubscribe: () => void;
          };
          connector: {
            state: string;
            on: (event: string, callback: () => void) => void;
          };
        }
      }).Echo;

      // Check connection state
      if (echo?.connector?.state !== 'connected') {
        echo?.connector?.on('connect', () => {
          if (!isUnmountedRef.current) {
            setIsConnected(true);
            setConnectionError(null);
            retryCountRef.current = 0;
            setReconnectAttempts(0);
          }
        });

        echo?.connector?.on('disconnect', () => {
          if (!isUnmountedRef.current) {
            setIsConnected(false);
          }
        });
      }

      const channel = echo.private(channelName);

      // Listen for emergency report created
      if (onReportCreated) {
        channel.listen('EmergencyReportCreated', (event: unknown) => {
          try {
            onReportCreated(event as EmergencyReportCreatedEvent);
          } catch (error) {
            console.error('Error handling EmergencyReportCreated:', error);
          }
        });
      }

      // Listen for status changed
      if (onStatusChanged) {
        channel.listen('EmergencyReportStatusChanged', (event: unknown) => {
          try {
            onStatusChanged(event as EmergencyReportStatusChangedEvent);
          } catch (error) {
            console.error('Error handling EmergencyReportStatusChanged:', error);
          }
        });
      }

      // Listen for officer location updated
      if (onOfficerLocationUpdated) {
        channel.listen('OfficerLocationUpdated', (event: unknown) => {
          try {
            onOfficerLocationUpdated(event as OfficerLocationUpdatedEvent);
          } catch (error) {
            console.error('Error handling OfficerLocationUpdated:', error);
          }
        });
      }

      channelRef.current = channel;
      setIsConnected(true);
      setConnectionError(null);
      retryCountRef.current = 0;
      setReconnectAttempts(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setConnectionError(errorMessage);
      setIsConnected(false);

      // Auto-reconnect logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        setReconnectAttempts(retryCountRef.current);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current && enabled) {
            connect();
          }
        }, reconnectInterval);
      }
    }
  }, [enabled, channelName, onReportCreated, onStatusChanged, onOfficerLocationUpdated, cleanup, reconnectInterval, maxRetries]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      cleanup();
    };
  }, [connect, cleanup]);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    reconnect,
    disconnect,
  };
}

// Simplified hook for just connection status
export function useEmergencyConnection(): { isConnected: boolean; error: string | null } {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeEcho().catch(() => {
      setError('Failed to initialize Echo');
    });

    const checkConnection = () => {
      if (isEchoAvailable()) {
        const echo = (window as unknown as { Echo: { connector: { state: string } } }).Echo;
        setIsConnected(echo?.connector?.state === 'connected');
        setError(null);
      } else {
        setIsConnected(false);
        setError('Echo not available');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected, error };
}