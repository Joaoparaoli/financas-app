const DAY_MS = 24 * 60 * 60 * 1000;

function getNavigator() {
  if (typeof window === 'undefined') return null;
  return window.navigator || null;
}

export function detectPlatform() {
  const nav = getNavigator();
  const ua = nav?.userAgent || '';

  if (/android/i.test(ua)) {
    return { device: 'mobile', os: 'android' };
  }

  if (/iphone|ipad|ipod/i.test(ua)) {
    return { device: 'mobile', os: 'ios' };
  }

  if (/mac os/i.test(ua)) {
    return { device: 'desktop', os: 'mac' };
  }

  if (/win/i.test(ua)) {
    return { device: 'desktop', os: 'windows' };
  }

  if (/linux/i.test(ua)) {
    return { device: 'desktop', os: 'linux' };
  }

  return { device: nav ? 'desktop' : 'unknown', os: 'unknown' };
}

export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return { supported: false, permission: 'denied' };
  }

  if (Notification.permission === 'granted') {
    return { supported: true, permission: 'granted' };
  }

  if (Notification.permission === 'denied') {
    return { supported: true, permission: 'denied' };
  }

  const permission = await Notification.requestPermission();
  return { supported: true, permission };
}

function hasBeenNotified(transactionId, dueDateKey) {
  if (typeof window === 'undefined') return false;
  const key = `notification-${transactionId}-${dueDateKey}`;
  return window.localStorage.getItem(key) === '1';
}

function setNotified(transactionId, dueDateKey) {
  if (typeof window === 'undefined') return;
  const key = `notification-${transactionId}-${dueDateKey}`;
  window.localStorage.setItem(key, '1');
}

export async function schedulePaymentReminders(transactions) {
  if (!transactions?.length) return [];

  const { supported, permission } = await ensureNotificationPermission();
  if (!supported || permission !== 'granted') return [];

  const nav = getNavigator();
  const platform = detectPlatform();
  const now = new Date();
  const cleanups = [];

  const upcomingExpenses = transactions.filter((t) => t.type === 'expense');

  upcomingExpenses.forEach((transaction) => {
    const dueDate = new Date(transaction.date);
    const diffMs = dueDate.getTime() - now.getTime();
    const daysDiff = diffMs / DAY_MS;

    // Notify only for dues within the next 3 days
    if (daysDiff < 0 || daysDiff > 3) return;

    const dueKey = dueDate.toISOString().slice(0, 10);
    if (hasBeenNotified(transaction.id, dueKey)) return;

    const timeout = setTimeout(() => {
      try {
        const title = daysDiff <= 0 ? 'Pagamento vence hoje' : `Pagamento em ${Math.ceil(daysDiff)} dia(s)`;
        const body = `${transaction.title} · ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(transaction.amount || 0)}\n${dueDate.toLocaleDateString('pt-BR')}`;

        new Notification(title, {
          body,
          tag: `payment-${transaction.id}-${dueKey}`,
          icon: '/favicon.ico',
          badge: platform.device === 'mobile' ? '/icons/icon-192x192.png' : undefined,
        });
        setNotified(transaction.id, dueKey);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Notification error', err);
      }
    }, Math.max(diffMs, 0));

    cleanups.push(() => clearTimeout(timeout));

    // If the event is due today, also show an immediate reminder
    if (diffMs <= 5 * 60 * 1000) {
      setTimeout(() => {
        try {
          new Notification('Pagamento do dia', {
            body: `${transaction.title} vence hoje.`,
            tag: `payment-immediate-${transaction.id}-${dueKey}`,
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Notification error', err);
        }
      }, 500);
    }
  });

  // Provide OS specific tip if notifications might be hidden
  if (supported && nav?.userAgent && platform.os === 'ios') {
    console.info('Para receber alertas no iOS, adicione este app à tela inicial e permita notificações.');
  }

  return cleanups;
}
