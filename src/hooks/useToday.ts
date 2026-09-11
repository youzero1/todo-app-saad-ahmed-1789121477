import { useEffect, useState } from 'react';
import { msUntilNextMidnight, todayKey } from '@/lib/dates';

/**
 * Today's local `YYYY-MM-DD`, re-evaluated when the local day rolls over so an
 * app left open overnight re-buckets "today" into "overdue" without a refresh.
 * Also re-checks when the tab becomes visible again, since background timers
 * can be throttled or suspended while hidden.
 */
export function useToday(): string {
  const [day, setDay] = useState<string>(() => todayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const sync = () => setDay((prev) => {
      const next = todayKey();
      return next === prev ? prev : next;
    });

    const schedule = () => {
      // +1s of slack so the timer never fires a hair before midnight.
      timer = setTimeout(() => {
        sync();
        schedule();
      }, msUntilNextMidnight() + 1000);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        sync();
        clearTimeout(timer);
        schedule();
      }
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return day;
}
