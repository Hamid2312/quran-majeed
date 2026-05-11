export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(startIso: string, endIso: string): string {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Random pastel color for avatar backgrounds */
export function randomAvatarColor(): string {
  const colors = [
    '#2D6A4F', '#1565C0', '#6A1B9A', '#C62828',
    '#F57F17', '#00695C', '#37474F', '#4E342E',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/** Generate a simple unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
