import type { DashboardData, DateRange } from './types'

/*
 * 대시보드가 의존하는 유일한 데이터 계약.
 * 지금은 MockSource(mock.ts)가 구현하고, Phase 0 계측·데이터 확보 후
 * PostHogSource(posthog.ts, Query API)로 교체한다 — 화면 코드는 이
 * 인터페이스만 알기에 소스만 바꾸면 라이브로 전환된다.
 */
export interface MetricsSource {
  getDashboard(range: DateRange): Promise<DashboardData>
}
