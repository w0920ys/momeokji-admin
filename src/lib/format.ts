import type { EntryPath, Unit } from './metrics/types'

const nf = new Intl.NumberFormat('ko-KR')

export function formatNumber(n: number): string {
  return nf.format(Math.round(n))
}

/** 큰 수 압축: 12,400 → 1.2만. 축 라벨·타일에 쓴다. */
export function formatCompact(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}만`
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}천`
  return nf.format(Math.round(n))
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function formatValue(value: number, unit: Unit): string {
  switch (unit) {
    case 'percent':
      return formatPercent(value)
    case 'won':
      return `₩${formatNumber(value)}`
    case 'ratio':
      return value.toFixed(1)
    case 'days':
      return `${value.toFixed(1)}일`
    case 'count':
    default:
      return formatNumber(value)
  }
}

/** 증감 배지 문구. +12.4% / -3.1%. */
export function formatDelta(deltaPct: number): string {
  const sign = deltaPct > 0 ? '+' : ''
  return `${sign}${deltaPct.toFixed(1)}%`
}

const entryPathLabels: Record<EntryPath, string> = {
  direct: '직접 방문',
  utm: 'UTM 캠페인',
  push: '알림',
  room: '함께 정하기 링크',
  install: '홈 화면 설치',
}

export function entryPathLabel(path: EntryPath): string {
  return entryPathLabels[path]
}
