// Ortak sayı/para/yüzde biçimlendirme yardımcıları (tr-TR)

export function num(v: number | string | null | undefined, digits = 2): string {
  return (Number(v) || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function money(v: number | string | null | undefined, digits = 2): string {
  return '₺' + num(v, digits)
}

export function pct(v: number | string | null | undefined, digits = 2): string {
  const n = Number(v) || 0
  return (n >= 0 ? '+' : '') + num(n, digits) + '%'
}

export function compact(v: number | string | null | undefined): string {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + 'M'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'B'
  return num(n, 0)
}

export function useFormat() {
  return { num, money, pct, compact }
}
