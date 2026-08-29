import type { MetricsSource } from './source'
import type {
  DashboardData,
  DateRange,
  SeriesPoint,
  EntryPath,
} from './types'

/*
 * 대표값 목업. 작지만 성장 중인 앱을 가정한 현실적 수치다(랜덤 없이
 * 결정적으로 생성 — 새로고침해도 같은 그림). Phase 0 계측 후
 * PostHogSource 로 교체하면 이 파일은 필요 없어진다.
 */

const rangeMeta: Record<DateRange, { points: number; stepDays: number; growth: number }> = {
  '7d': { points: 7, stepDays: 1, growth: 1 },
  '28d': { points: 14, stepDays: 2, growth: 1.35 },
  '90d': { points: 15, stepDays: 6, growth: 2.1 },
}

/** 결정적 파형: 완만한 성장 + 주기적 흔들림. seed 로 계열을 다르게. */
function wave(i: number, n: number, base: number, growth: number, amp: number, seed: number) {
  const trend = base * (1 + (growth - 1) * (i / Math.max(1, n - 1)))
  const wobble = 1 + amp * Math.sin(i * 0.9 + seed) * 0.5 + amp * Math.sin(i * 0.37 + seed * 2) * 0.5
  return Math.max(0, Math.round(trend * wobble))
}

function labelFor(i: number, n: number, stepDays: number): string {
  // 오늘로부터 거슬러 올라가는 상대 라벨(월/일). Date 없이 결정적으로.
  const daysAgo = (n - 1 - i) * stepDays
  const totalStart = 227 // 8/15 근방을 기준일로 고정(목업 라벨용)
  const dayOfYearish = totalStart - daysAgo
  const month = dayOfYearish > 212 ? 8 : 7
  const day = dayOfYearish > 212 ? dayOfYearish - 212 : dayOfYearish - 181
  return `${month}/${((day % 31) + 31) % 31 || 1}`
}

function newUsersTrend(range: DateRange): SeriesPoint[] {
  const { points, stepDays, growth } = rangeMeta[range]
  return Array.from({ length: points }, (_, i) => ({
    date: labelFor(i, points, stepDays),
    pwa: wave(i, points, 78, growth, 0.28, 1),
    toss: wave(i, points, 34, growth * 1.4, 0.34, 4), // 앱인토스 유입은 더 가파르게
  }))
}

function viralityTrend(range: DateRange): SeriesPoint[] {
  const { points, stepDays, growth } = rangeMeta[range]
  return Array.from({ length: points }, (_, i) => ({
    date: labelFor(i, points, stepDays),
    created: wave(i, points, 22, growth, 0.3, 2),
    joined: wave(i, points, 31, growth * 1.15, 0.32, 3),
  }))
}

/** 북극성(WRD) 히스토리 — 홈 화면 히어로 차트. */
function northStarTrend(range: DateRange): SeriesPoint[] {
  const { points, stepDays, growth } = rangeMeta[range]
  return Array.from({ length: points }, (_, i) => ({
    date: labelFor(i, points, stepDays),
    wrd: wave(i, points, 640, growth, 0.22, 5),
  }))
}

const entryShares: { path: EntryPath; users: number }[] = [
  { path: 'direct', users: 1840 },
  { path: 'push', users: 1120 },
  { path: 'utm', users: 760 },
  { path: 'room', users: 540 },
  { path: 'install', users: 410 },
]

export const mockSource: MetricsSource = {
  async getDashboard(range: DateRange): Promise<DashboardData> {
    const scale = range === '7d' ? 0.32 : range === '28d' ? 1 : 3.1

    return {
      updatedAt: '2026-08-28 09:00',
      range,
      overview: [
        { id: 'wrd', label: '주간 반복 결정자 (북극성)', value: 862, unit: 'count', deltaPct: 12.4, higherIsBetter: true, hint: '한 주 2일+ 룰렛 결정 확정' },
        { id: 'wau', label: '주간 활성 사용자 (WAU)', value: 3210, unit: 'count', deltaPct: 8.1, higherIsBetter: true },
        { id: 'newusers', label: '신규 유입', value: Math.round(1560 * scale), unit: 'count', deltaPct: 15.7, higherIsBetter: true },
        { id: 'activation', label: '활성화율', value: 46.2, unit: 'percent', deltaPct: 3.2, higherIsBetter: true, hint: '첫 세션 내 결정 확정' },
        { id: 's2c', label: 'Spin→Confirm 전환', value: 62.5, unit: 'percent', deltaPct: 1.4, higherIsBetter: true },
        { id: 'push', label: '알림 재유입률', value: 18.3, unit: 'percent', deltaPct: 5.9, higherIsBetter: true, hint: '알림 클릭으로 재방문' },
        { id: 'stickiness', label: 'DAU/WAU 점착도', value: 34.5, unit: 'percent', deltaPct: 2.1, higherIsBetter: true, hint: '일간활성/주간활성 비율 — 습관 강도' },
      ],

      northStarTrend: northStarTrend(range),

      acquisition: {
        newUsersTrend: newUsersTrend(range),
        sources: [
          { source: 'instagram', medium: 'social', campaign: 'launch', newUsers: Math.round(620 * scale), activationRate: 44.1 },
          { source: 'push', medium: 'notification', campaign: 'daily-lunch', newUsers: Math.round(410 * scale), activationRate: 58.7 },
          { source: 'naver', medium: 'cpc', campaign: 'brand', newUsers: Math.round(230 * scale), activationRate: 39.5 },
          { source: 'kakao', medium: 'social', campaign: 'share', newUsers: Math.round(180 * scale), activationRate: 51.2 },
          { source: 'toss', medium: 'miniapp', campaign: 'home-feed', newUsers: Math.round(340 * scale), activationRate: 47.9 },
          { source: '(direct)', medium: '(none)', campaign: '(none)', newUsers: Math.round(500 * scale), activationRate: 33.8 },
        ],
        entryShares,
      },

      retention: {
        curve: [
          { week: 0, all: 100, activated: 100, notActivated: 100 },
          { week: 1, all: 41, activated: 58, notActivated: 22 },
          { week: 2, all: 29, activated: 46, notActivated: 12 },
          { week: 3, all: 23, activated: 39, notActivated: 8 },
          { week: 4, all: 19, activated: 34, notActivated: 5 },
        ],
        pushReengagementRate: 18.3,
        resurrectedUsers: Math.round(210 * scale),
        byEntry: [
          { path: 'push', d7: 34.2 },
          { path: 'install', d7: 31.5 },
          { path: 'room', d7: 27.8 },
          { path: 'utm', d7: 21.0 },
          { path: 'direct', d7: 16.4 },
        ],
      },

      roulette: {
        funnel: [
          { step: '세션 시작', users: 4200 },
          { step: '룰렛 돌림', users: 3360 },
          { step: '결과 확정', users: 2100 },
        ],
        spinToConfirmRate: 62.5,
        respinRate: 41.8,
        spinDepth: [
          { spins: '1회', sessions: 1520 },
          { spins: '2회', sessions: 980 },
          { spins: '3회', sessions: 520 },
          { spins: '4회', sessions: 210 },
          { spins: '5회+', sessions: 130 },
        ],
        weeklyDecisionFreq: 3.4,
      },

      featureAdoption: {
        features: [
          { key: 'install', label: '홈 화면 설치', adoptionRate: 22.4, retentionLift: 14.1 },
          { key: 'notify', label: '알림 활성화', adoptionRate: 31.0, retentionLift: 19.6 },
          { key: 'rooms', label: '함께 정하기(룸)', adoptionRate: 17.2, retentionLift: 23.4 },
          { key: 'groups', label: '그룹 사용', adoptionRate: 12.8, retentionLift: 11.2 },
          { key: 'menu_edit', label: '메뉴 수정', adoptionRate: 54.6, retentionLift: 16.8 },
          { key: 'dislikes', label: '못 먹는 음식/제외', adoptionRate: 28.3, retentionLift: 9.4 },
          { key: 'favorites', label: '즐겨찾기', adoptionRate: 19.5, retentionLift: 7.1 },
          { key: 'history', label: '히스토리 조회', adoptionRate: 38.9, retentionLift: 12.5 },
          { key: 'stats', label: '통계 조회', adoptionRate: 24.1, retentionLift: 10.3 },
          { key: 'calendar', label: '캘린더 조회', adoptionRate: 16.7, retentionLift: 8.0 },
          { key: 'search', label: '메뉴 검색', adoptionRate: 20.2, retentionLift: 5.6 },
          { key: 'copy', label: '오늘 후보 복사', adoptionRate: 9.8, retentionLift: 4.2 },
          { key: 'account', label: '계정/동기화', adoptionRate: 33.5, retentionLift: 20.9 },
        ],
      },

      virality: {
        kFactor: 0.35,
        roomCreators: Math.round(540 * scale),
        roomJoiners: Math.round(760 * scale),
        inviteConversion: 63.4,
        roomCohortRetentionLift: 23.4,
        trend: viralityTrend(range),
      },

      channels: {
        rows: [
          { metric: 'WAU', pwa: 2180, toss: 1030, unit: 'count' },
          { metric: '활성화율', pwa: 44.8, toss: 49.1, unit: 'percent' },
          { metric: 'Spin→Confirm', pwa: 61.2, toss: 65.0, unit: 'percent' },
          { metric: 'W2 리텐션', pwa: 27.4, toss: 32.1, unit: 'percent' },
          { metric: '주당 결정 빈도', pwa: 3.2, toss: 3.8, unit: 'ratio' },
        ],
      },

      monetization: { enabled: false },
    }
  },
}
