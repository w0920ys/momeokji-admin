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

/** 2026.08.30 형태. UsersSection에 있던 비공개 헬퍼를 그대로 옮겨 export한다. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 2026.08.30 14:32 형태. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * "방금 전"/"3분 전"/"2시간 전"/"5일 전" — Activity Feed 타임스탬프,
 * 인물 카드의 updated_at처럼 "얼마나 최근인지"가 절대 시각보다 중요한
 * 자리에 쓴다. 한 달(30일)이 넘으면 상대 시각이 오히려 감이 안 와서
 * formatDate로 넘어간다. Intl.RelativeTimeFormat 대신 손으로 구간을
 * 나눈다 — "n분 전" 같은 짧은 한국어 문구는 이 프로젝트 다른 곳(가입일 등)
 * 표기 톤과 맞춰 직접 쓰는 게 더 자연스럽다.
 */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay}일 전`
  return formatDate(iso)
}
