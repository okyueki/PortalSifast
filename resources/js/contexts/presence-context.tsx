import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

export interface OnlineUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  last_seen: string;
}

interface PresenceState {
  online: boolean;
  users: OnlineUser[];
  count: number;
}

const defaultState: PresenceState = {
  online: false,
  users: [],
  count: 0,
};

const PresenceContext = createContext<PresenceState>(defaultState);

/**
 * Satu subscription ke presence.users: join + listener here/joining/leaving.
 * Dipasang di layout agar event "here" tidak terlewat (kalau join di tempat lain
 * tanpa callback, "here" sudah terkirim sebelum widget daftar callback).
 */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { auth } = usePage().props as { auth: { user?: { id: number } } };
  const [presence, setPresence] = useState<PresenceState>(defaultState);

  const setOnline = useCallback((online: boolean) => {
    setPresence((prev) => ({ ...prev, online }));
  }, []);

  const setUsers = useCallback((users: OnlineUser[]) => {
    setPresence((prev) => ({ ...prev, users: users ?? [], count: (users ?? []).length }));
  }, []);

  useEffect(() => {
    if (!auth?.user) {
      setPresence(defaultState);
      return;
    }

    const Echo = (window as unknown as { Echo?: ReturnType<typeof import('laravel-echo').default> }).Echo;
    if (!Echo) {
      return;
    }

    let channel: {
      here?: (cb: (users: OnlineUser[]) => void) => void;
      joining?: (cb: (user: OnlineUser) => void) => void;
      leaving?: (cb: (user: OnlineUser) => void) => void;
      subscribed?: (cb: () => void) => void;
      error?: (cb: (err: unknown) => void) => void;
      leave?: () => void;
      members?: { values: () => IterableIterator<OnlineUser> };
    } | null = null;

    try {
      channel = Echo.join('presence.users') as typeof channel;

      if (channel?.here) {
        channel.here((users: OnlineUser[]) => {
          setUsers(users ?? []);
          setOnline(true);
        });
      }
      if (channel?.joining) {
        channel.joining((user: OnlineUser) => {
          setPresence((prev) => {
            if (prev.users.some((u) => u.id === user.id)) return prev;
            return {
              ...prev,
              users: [...prev.users, user],
              count: prev.count + 1,
            };
          });
        });
      }
      if (channel?.leaving) {
        channel.leaving((user: OnlineUser) => {
          setPresence((prev) => ({
            ...prev,
            users: prev.users.filter((u) => u.id !== user.id),
            count: Math.max(0, prev.count - 1),
          }));
        });
      }
      if (channel?.subscribed) {
        channel.subscribed(() => setOnline(true));
      }
      if (channel?.error) {
        channel.error(() => setOnline(false));
      }

      // Jika channel sudah subscribed sebelumnya (edge case), ambil daftar dari .members
      const trySyncMembers = () => {
        if (!channel?.members) return;
        try {
          const members = channel.members as { values?: () => IterableIterator<OnlineUser> };
          if (typeof members.values === 'function') {
            const list = Array.from(members.values());
            if (list.length > 0) setUsers(list);
          }
        } catch {
          // ignore
        }
      };
      trySyncMembers();
      const t = window.setTimeout(trySyncMembers, 500);
      return () => {
        window.clearTimeout(t);
        try {
          if (channel?.leave) channel.leave();
        } catch {
          // ignore
        }
      };
    } catch (err) {
      setOnline(false);
      return undefined;
    }
  }, [auth?.user?.id, setOnline, setUsers]);

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(): PresenceState {
  return useContext(PresenceContext) ?? defaultState;
}
