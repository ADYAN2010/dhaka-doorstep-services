/**
 * `useUnreadMessages` — stubbed during the MySQL migration. The chat
 * subsystem (message_threads / messages) has not yet been ported, so
 * this hook always reports zero unread messages.
 */
export function useUnreadMessages() {
  return { count: 0, loading: false };
}
