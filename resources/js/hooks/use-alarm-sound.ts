import { useCallback, useRef, useState, useEffect } from 'react';

// Sound URLs - using free alarm sounds
const ALARM_SOUNDS = {
  panic: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  urgent: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
  alert: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3',
};

export type AlarmType = 'panic' | 'urgent' | 'alert';

export interface UseAlarmSoundOptions {
  enabled?: boolean;
  volume?: number;
  onPlay?: () => void;
}

export interface UseAlarmSoundReturn {
  isPlaying: boolean;
  isEnabled: boolean;
  play: (type?: AlarmType) => void;
  stop: () => void;
  enable: () => void;
  disable: () => void;
  setVolume: (volume: number) => void;
}

/**
 * Hook untuk alarm suara saat panic button masuk.
 *
 * Usage:
 * ```tsx
 * const { play, isEnabled } = useAlarmSound();
 *
 * // Play alarm when panic comes in
 * useEffect(() => {
 *   if (newPanic) {
 *     play('panic');
 *   }
 * }, [newPanic]);
 * ```
 */
export function useAlarmSound(options: UseAlarmSoundOptions = {}): UseAlarmSoundReturn {
  const { enabled = true, volume = 0.8, onPlay } = options;

  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = useCallback((type: AlarmType = 'panic') => {
    if (!isEnabled || !audioRef.current) return;

    try {
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Set new source
      audioRef.current.src = ALARM_SOUNDS[type];
      audioRef.current.loop = true;

      // Play
      audioRef.current.play().catch((error) => {
        console.warn('Failed to play alarm sound:', error);
        // Browser may block autoplay - user needs to interact first
      });

      setIsPlaying(true);
      onPlay?.();

      // Auto-stop after 30 seconds to prevent endless loop
      timeoutRef.current = setTimeout(() => {
        stop();
      }, 30000);
    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  }, [isEnabled, onPlay]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    stop();
    setIsEnabled(false);
  }, [stop]);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  return {
    isPlaying,
    isEnabled,
    play,
    stop,
    enable,
    disable,
    setVolume,
  };
}

/**
 * Hook khusus untuk panic alarm dengan WebSocket integration.
 *
 * Usage:
 * ```tsx
 * const { play, isEnabled } = usePanicAlarm({
 *   onPanic: (report) => {
 *     // Handle panic
 *     play('panic');
 *   }
 * });
 * ```
 */
export function usePanicAlarm(options: {
  onPanic?: (report: unknown) => void;
  onStatusChange?: (report: unknown) => void;
  enabled?: boolean;
}) {
  const { onPanic, onStatusChange, enabled = true } = options;

  const [lastPanic, setLastPanic] = useState<unknown>(null);
  const [hasNewPanic, setHasNewPanic] = useState(false);
  const { play, stop, isEnabled, isPlaying } = useAlarmSound({ enabled });

  const clearNewPanic = useCallback(() => {
    setHasNewPanic(false);
    stop();
  }, [stop]);

  // Handle incoming panic event
  const handlePanicEvent = useCallback((event: { report: unknown }) => {
    if (!isEnabled) return;

    setLastPanic(event.report);
    setHasNewPanic(true);
    play('panic');
    onPanic?.(event.report);
  }, [isEnabled, play, onPanic]);

  // Handle status change event
  const handleStatusChangeEvent = useCallback((event: { report_id: string; status: string }) => {
    if (!isEnabled) return;

    // Stop alarm if this is related to the last panic
    if (lastPanic && (lastPanic as { report_id: string }).report_id === event.report_id) {
      if (['responded', 'in_progress'].includes(event.status)) {
        // Alarm should stop when someone responds
        stop();
      }
    }

    onStatusChange?.(event);
  }, [isEnabled, lastPanic, stop, onStatusChange]);

  return {
    lastPanic,
    hasNewPanic,
    isPlaying,
    isEnabled,
    play: (type?: AlarmType) => play(type),
    stop,
    clearNewPanic,
    handlePanicEvent,
    handleStatusChangeEvent,
  };
}

// Simple audio player component for testing
export function AlarmSoundPlayer() {
  const { play, stop, isPlaying, isEnabled, enable, disable } = useAlarmSound();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border rounded-lg shadow-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className="text-sm font-medium">Alarm Status</span>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => play('panic')}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Test Alarm
        </button>
        <button
          onClick={stop}
          className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
        >
          Stop
        </button>
        <button
          onClick={isEnabled ? disable : enable}
          className={`px-3 py-1 rounded text-sm ${isEnabled ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          {isEnabled ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}