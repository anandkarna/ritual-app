export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function localIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  return localIsoDate(new Date());
}

export function daysBetweenIso(from?: string, to = todayIso()) {
  if (!from) {
    return 0;
  }
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  const end = new Date(`${to}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }
  return Math.max(0, Math.floor((end - start) / 86400000));
}

export function isoDaysBack(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - index));
    return localIsoDate(date);
  });
}

export function currentStreakFromHeat(heat: number[]) {
  let streak = 0;
  for (let index = heat.length - 1; index >= 0; index -= 1) {
    if (heat[index] > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
