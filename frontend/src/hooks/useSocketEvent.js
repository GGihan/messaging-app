import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Ensures a function retains a stable identity across renders
 * while always invoking the latest version without stale closures.
 */
function useLatestCallback(callback) {
  const ref = useRef(callback);

  // Runs synchronously before paint to close any potential race condition
  useLayoutEffect(() => {
    ref.current = callback;
  });

  // Stable wrapper identity preserved across entire component lifecycle
  return useCallback((...args) => ref.current?.(...args), []);
}

/**
 * Subscribes to a socket event cleanly with automated cleanup and no stale closures.
 */
export function useSocketEvent(socket, eventName, handler) {
  const stableHandler = useLatestCallback(handler);

  useEffect(() => {
    if (!socket || !eventName) return;

    socket.on(eventName, stableHandler);

    return () => {
      socket.off(eventName, stableHandler);
    };
  }, [socket, eventName, stableHandler]);
}