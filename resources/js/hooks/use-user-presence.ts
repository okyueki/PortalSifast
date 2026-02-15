import { useState, useEffect } from 'react';

interface OnlineUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  last_seen: string;
}

interface UserPresence {
  online: boolean;
  users: OnlineUser[];
  count: number;
}

export function useUserPresence() {
  const [presence, setPresence] = useState<UserPresence>({
    online: false,
    users: [],
    count: 0,
  });

  useEffect(() => {
    // Check if Echo is available
    if (!window.Echo) {
      console.warn('Echo is not available');
      return;
    }

    let channel: any = null;

    try {
      // Join presence channel
      channel = window.Echo.join('presence.users');

      // When successfully joined
      if (channel && typeof channel.here === 'function') {
        channel.here((users: OnlineUser[]) => {
          console.log('Users already online:', users);
          setPresence(prev => ({
            ...prev,
            users: users || [],
            count: users?.length || 0,
            online: true,
          }));
        });

        // When a new user joins
        if (typeof channel.joining === 'function') {
          channel.joining((user: OnlineUser) => {
            console.log('User joined:', user);
            setPresence(prev => {
              const existingUser = prev.users.find(u => u.id === user.id);
              if (existingUser) {
                return prev;
              }
              return {
                ...prev,
                users: [...prev.users, user],
                count: prev.count + 1,
              };
            });
          });
        }

        // When a user leaves
        if (typeof channel.leaving === 'function') {
          channel.leaving((user: OnlineUser) => {
            console.log('User left:', user);
            setPresence(prev => ({
              ...prev,
              users: prev.users.filter(u => u.id !== user.id),
              count: Math.max(0, prev.count - 1),
            }));
          });
        }

        // Handle subscription success
        if (typeof channel.subscribed === 'function') {
          channel.subscribed(() => {
            console.log('Successfully subscribed to presence.users');
            setPresence(prev => ({ ...prev, online: true }));
          });
        }

        // Handle subscription error
        if (typeof channel.error === 'function') {
          channel.error((error: any) => {
            console.error('Presence channel error:', error);
            setPresence(prev => ({ ...prev, online: false }));
          });
        }
      }
    } catch (error) {
      console.error('Error setting up presence channel:', error);
      setPresence(prev => ({ ...prev, online: false }));
    }

    // Cleanup on unmount
    return () => {
      try {
        if (channel && typeof channel.leave === 'function') {
          channel.leave();
        }
      } catch (error) {
        console.error('Error leaving presence channel:', error);
      }
    };
  }, []);

  return presence;
}
