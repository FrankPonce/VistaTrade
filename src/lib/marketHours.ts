// Is the US stock market open right now? Regular session only: 9:30-16:00
// New York time, Monday-Friday. Market holidays are NOT accounted for, so on
// a holiday this will say "open" while prices sit still.

export function isMarketOpen(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday');
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));

  if (weekday === 'Sat' || weekday === 'Sun') return false;
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}
