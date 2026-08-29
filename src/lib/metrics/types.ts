/*
 * 모먹지 애널리틱스 대시보드의 지표 타입.
 * 계획(Part 1)의 KPI 축을 그대로 구조화한다. 화면은 이 타입만 알고,
 * 데이터가 목업인지 PostHog인지는 모른다(MetricsSource 참고).
 */

export type Channel = 'pwa' | 'toss'
export type EntryPath = 'direct' | 'utm' | 'push' | 'room' | 'install'
export type DateRange = '7d' | '28d' | '90d'

export type Unit = 'count' | 'percent' | 'won' | 'ratio' | 'days'

/** 시간축 위 다계열 한 점. date + 각 시리즈 키의 값. */
export interface SeriesPoint {
  date: string
  [seriesKey: string]: number | string
}

/** 상단 KPI 타일 하나. */
export interface KpiStat {
  id: string
  label: string
  value: number
  unit: Unit
  /** 직전 동기간 대비 증감률(%). 양수=증가. */
  deltaPct?: number
  /** 증가가 좋은 지표인지. 가드레일 지표는 false(증가가 나쁨). */
  higherIsBetter?: boolean
  hint?: string
}

/* ── 유입(획득) ── */
export interface SourceRow {
  source: string
  medium: string
  campaign: string
  newUsers: number
  activationRate: number
}
export interface EntryShare {
  path: EntryPath
  users: number
}
export interface Acquisition {
  /** 신규 유입 추세(채널별 시리즈: pwa, toss). */
  newUsersTrend: SeriesPoint[]
  sources: SourceRow[]
  entryShares: EntryShare[]
}

/* ── 재방문(재참여) ── */
export interface RetentionCurvePoint {
  week: number
  all: number
  activated: number
  notActivated: number
}
export interface EntryRetentionRow {
  path: EntryPath
  d7: number
}
export interface Retention {
  curve: RetentionCurvePoint[]
  /** 알림 클릭으로 재유입된 세션 비율(%). */
  pushReengagementRate: number
  resurrectedUsers: number
  byEntry: EntryRetentionRow[]
}

/* ── 룰렛 핵심 사용 ── */
export interface FunnelStep {
  step: string
  users: number
}
export interface SpinDepthBin {
  spins: string
  sessions: number
}
export interface Roulette {
  funnel: FunnelStep[]
  spinToConfirmRate: number
  respinRate: number
  spinDepth: SpinDepthBin[]
  weeklyDecisionFreq: number
}

/* ── 기능 채택 ── */
export interface FeatureRow {
  key: string
  label: string
  /** 이 기능을 1회+ 쓴 유저 비율(%). */
  adoptionRate: number
  /** 채택 코호트의 W2 리텐션 리프트(%p). */
  retentionLift: number
}
export interface FeatureAdoption {
  features: FeatureRow[]
}

/* ── 바이럴(함께 정하기 룸) ── */
export interface Virality {
  kFactor: number
  roomCreators: number
  roomJoiners: number
  /** 생성된 초대당 입장 전환율(%). */
  inviteConversion: number
  roomCohortRetentionLift: number
  /** 룸 생성 vs 입장 추세. */
  trend: SeriesPoint[]
}

/* ── 채널 비교 ── */
export interface ChannelMetricRow {
  metric: string
  pwa: number
  toss: number
  unit: Unit
}
export interface ChannelCompare {
  rows: ChannelMetricRow[]
}

/* ── 수익화(로드맵 2단계) ── */
export interface Monetization {
  /** 광고가 켜졌는지. 지금은 false → 섹션은 placeholder. */
  enabled: boolean
}

export interface DashboardData {
  updatedAt: string
  range: DateRange
  overview: KpiStat[]
  /** 북극성(WRD) 히스토리 추이 — 홈 화면 히어로 차트 전용. */
  northStarTrend: SeriesPoint[]
  acquisition: Acquisition
  retention: Retention
  roulette: Roulette
  featureAdoption: FeatureAdoption
  virality: Virality
  channels: ChannelCompare
  monetization: Monetization
}
