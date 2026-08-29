import type { MetricsSource } from './source'
import { supabase } from '../supabase'
import type { DashboardData, DateRange, EntryPath, SeriesPoint } from './types'

/*
 * PostHog Query API(HogQL)로 실데이터를 읽어오는 MetricsSource.
 *
 * 접근 방식: 여러 개의 좁은 HogQL 쿼리를 따로 던지는 대신, 룩백 윈도우 안의
 * 원시 이벤트를 한 번에 끌어온 뒤 리텐션/퍼널/기능채택 등 파생 지표를 여기서
 * (JS로) 계산한다. 코호트·주차별 리텐션 같은 계산은 순수 HogQL로 짜면 급격히
 * 복잡해지는데, 지금 이벤트 규모(수백~수천 건)에서는 원시 로우를 그대로
 * 들고 와서 계산하는 쪽이 훨씬 정확하고 읽기 쉽다. 트래픽이 커지면(수십만+)
 * 이 방식은 못 버틴다 — 그때는 서버 쪽에서 HogQL GROUP BY/윈도우 함수로
 * 옮겨야 한다(지금은 YAGNI).
 *
 * 정직성 원칙: 신호가 없으면(표본 너무 작음, 아직 존재하지 않는 채널·기능)
 * 그럴듯한 값을 만들어내지 않고 0을 반환한다. 아래 곳곳의 "표본이 작으면
 * 0" 처리가 그 규칙을 지키는 자리다.
 */

const RANGE_DAYS: Record<DateRange, number> = { '7d': 7, '28d': 28, '90d': 90 }
/** 리텐션 코호트 계산에 range보다 더 과거 데이터가 필요해서 여유를 둔다. */
const COHORT_BUFFER_DAYS = 35
const DAY_MS = 86400000

interface RawEvent {
  personId: string
  event: string
  ts: number
  entry?: string
  channel?: string
  spinIndex?: number
}

async function runQuery(query: string): Promise<unknown[][]> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch('/api/posthog-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`PostHog 쿼리 실패: HTTP ${res.status}`)
  const json = (await res.json()) as { results?: unknown[][] }
  return json.results ?? []
}

async function fetchRawEvents(lookbackDays: number): Promise<RawEvent[]> {
  const rows = await runQuery(`
    SELECT person_id, event, timestamp, properties.entry, properties.channel, properties.spin_index
    FROM events
    WHERE timestamp >= now() - INTERVAL ${lookbackDays} DAY
    ORDER BY timestamp
    LIMIT 50000
  `)
  return rows.map((r) => ({
    personId: String(r[0]),
    event: String(r[1]),
    ts: new Date(r[2] as string).getTime(),
    entry: r[3] != null ? String(r[3]) : undefined,
    channel: r[4] != null ? String(r[4]) : undefined,
    spinIndex: typeof r[5] === 'number' ? r[5] : undefined,
  }))
}

const dateLabel = (ts: number) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
const dayKey = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
const withinDays = (ts: number, days: number, now: number) => ts >= now - days * DAY_MS

export const posthogSource: MetricsSource = {
  async getDashboard(range: DateRange): Promise<DashboardData> {
    const rangeDays = RANGE_DAYS[range]
    const lookbackDays = rangeDays + COHORT_BUFFER_DAYS
    const now = Date.now()
    const events = await fetchRawEvents(lookbackDays)

    // 사람별 최초 접촉 시각(이 룩백 창 안에서 — 데이터가 아직 며칠 안 됐으니
    // 사실상 진짜 최초 방문과 같다).
    const firstSeen = new Map<string, number>()
    for (const e of events) {
      const cur = firstSeen.get(e.personId)
      if (cur === undefined || e.ts < cur) firstSeen.set(e.personId, e.ts)
    }
    const allUsers = new Set(events.map((e) => e.personId))
    const confirmedPersons = new Set(events.filter((e) => e.event === 'menu_confirmed').map((e) => e.personId))

    const inRange = events.filter((e) => withinDays(e.ts, rangeDays, now))

    // ---- WAU/DAU: range 선택과 무관한 정의(항상 트레일링 7일/1일) ----
    const wauSet = new Set(events.filter((e) => withinDays(e.ts, 7, now)).map((e) => e.personId))
    const dauSet = new Set(events.filter((e) => withinDays(e.ts, 1, now)).map((e) => e.personId))

    // ---- 북극성(WRD): windowEnd 기준 최근 7일 중 menu_confirmed 2일+ ----
    function wrdCount(windowEnd: number): number {
      const daysByPerson = new Map<string, Set<string>>()
      for (const e of events) {
        if (e.event !== 'menu_confirmed') continue
        if (e.ts > windowEnd || e.ts <= windowEnd - 7 * DAY_MS) continue
        const set = daysByPerson.get(e.personId) ?? new Set<string>()
        set.add(dayKey(e.ts))
        daysByPerson.set(e.personId, set)
      }
      let n = 0
      for (const set of daysByPerson.values()) if (set.size >= 2) n++
      return n
    }

    const newUserIds = [...firstSeen.entries()].filter(([, ts]) => withinDays(ts, rangeDays, now)).map(([id]) => id)
    const activation = newUserIds.length
      ? (newUserIds.filter((id) => confirmedPersons.has(id)).length / newUserIds.length) * 100
      : 0

    const spins = inRange.filter((e) => e.event === 'menu_spun').length
    const confirms = inRange.filter((e) => e.event === 'menu_confirmed').length
    const s2c = spins ? (confirms / spins) * 100 : 0

    const opens = inRange.filter((e) => e.event === 'app_opened' || e.event === 'app_reengaged')
    const pushOpens = opens.filter((e) => e.event === 'app_reengaged' || e.entry === 'push')
    const pushReengagementRate = opens.length ? (pushOpens.length / opens.length) * 100 : 0

    const spinEvents = inRange.filter((e) => e.event === 'menu_spun')
    const respinCount = spinEvents.filter((e) => (e.spinIndex ?? 1) > 1).length
    const respinRate = spinEvents.length ? (respinCount / spinEvents.length) * 100 : 0
    const spinDepth = [1, 2, 3, 4, 5].map((n) => ({
      spins: n === 5 ? '5회+' : `${n}회`,
      sessions: spinEvents.filter((e) => (n === 5 ? (e.spinIndex ?? 1) >= 5 : (e.spinIndex ?? 1) === n)).length,
    }))

    const weeks = Math.max(rangeDays / 7, 1)
    const weeklyDecisionFreq = wauSet.size ? confirms / wauSet.size / weeks : 0

    // ---- 일별 시계열 ----
    function dailyTrend(filter: (e: RawEvent) => boolean, keyer: (e: RawEvent) => string, keys: string[]): SeriesPoint[] {
      const days: string[] = []
      for (let i = rangeDays - 1; i >= 0; i--) days.push(dateLabel(now - i * DAY_MS))
      const buckets = new Map<string, Record<string, number>>()
      for (const d of days) buckets.set(d, Object.fromEntries(keys.map((k) => [k, 0])))
      for (const e of inRange) {
        if (!filter(e)) continue
        const bucket = buckets.get(dateLabel(e.ts))
        if (!bucket) continue
        const k = keyer(e)
        if (k in bucket) bucket[k]++
      }
      return days.map((d) => ({ date: d, ...buckets.get(d)! }))
    }

    const newUserIdSet = new Set(newUserIds)
    const newUsersTrend = dailyTrend(
      (e) => newUserIdSet.has(e.personId) && firstSeen.get(e.personId) === e.ts,
      (e) => (e.channel === 'toss' ? 'toss' : 'pwa'),
      ['pwa', 'toss'],
    )

    const northStarTrend: SeriesPoint[] = Array.from({ length: rangeDays }, (_, i) => {
      const windowEnd = now - (rangeDays - 1 - i) * DAY_MS
      return { date: dateLabel(windowEnd), wrd: wrdCount(windowEnd) }
    })

    // ---- 유입 경로 구성(사람별 최초 entry) ----
    const entryPaths: EntryPath[] = ['direct', 'utm', 'push', 'room', 'install']
    const personEntry = new Map<string, EntryPath>()
    for (const e of events) {
      if (!e.entry || personEntry.has(e.personId)) continue
      if ((entryPaths as string[]).includes(e.entry)) personEntry.set(e.personId, e.entry as EntryPath)
    }
    const entryShares = entryPaths.map((path) => ({
      path,
      users: [...personEntry.values()].filter((p) => p === path).length,
    }))

    const funnel = [
      { step: '세션 시작', users: new Set(inRange.filter((e) => e.event === 'app_opened').map((e) => e.personId)).size },
      { step: '룰렛 돌림', users: new Set(inRange.filter((e) => e.event === 'menu_spun').map((e) => e.personId)).size },
      { step: '결과 확정', users: new Set(inRange.filter((e) => e.event === 'menu_confirmed').map((e) => e.personId)).size },
    ]

    // ---- 기능 채택 + 채택별 리텐션 리프트 ----
    const FEATURES: { key: string; label: string; events: string[] }[] = [
      { key: 'install', label: '홈 화면 설치', events: ['pwa_installed'] },
      { key: 'notify', label: '알림 활성화', events: ['push_subscribed'] },
      { key: 'rooms', label: '함께 정하기(룸)', events: ['room_created', 'room_joined'] },
      { key: 'groups', label: '그룹 사용', events: ['group_added', 'group_switched'] },
      { key: 'menu_edit', label: '메뉴 수정', events: ['menu_added', 'menu_deleted', 'menu_reordered'] },
      { key: 'dislikes', label: '못 먹는 음식/제외', events: ['dislike_added', 'exclude_used'] },
      { key: 'favorites', label: '즐겨찾기', events: ['favorite_toggled'] },
      { key: 'history', label: '히스토리 조회', events: ['history_viewed'] },
      { key: 'stats', label: '통계 조회', events: ['stats_viewed'] },
      { key: 'calendar', label: '캘린더 조회', events: ['calendar_date_viewed'] },
      { key: 'search', label: '메뉴 검색', events: ['menu_searched'] },
      { key: 'copy', label: '오늘 후보 복사', events: ['today_copied'] },
      { key: 'account', label: '계정/동기화', events: ['signed_up', 'logged_in', 'sync_completed'] },
    ]
    /** adopters/비adopters의 7~14일차 재방문율 차이. 표본이 작으면(5명 미만) 신호가 아니라 노이즈라 0. */
    function retentionLift(adopters: Set<string>): number {
      const nonAdopters = [...allUsers].filter((id) => !adopters.has(id))
      if (adopters.size < 5 || nonAdopters.length < 5) return 0
      const returnRate = (ids: string[]) => {
        if (!ids.length) return 0
        const returned = ids.filter((id) => {
          const fs = firstSeen.get(id)
          if (fs === undefined) return false
          return events.some((e) => e.personId === id && e.ts >= fs + 7 * DAY_MS && e.ts < fs + 14 * DAY_MS)
        })
        return (returned.length / ids.length) * 100
      }
      return Math.round((returnRate([...adopters]) - returnRate(nonAdopters)) * 10) / 10
    }
    const featureAdoption = {
      features: FEATURES.map((f) => {
        const adopters = new Set(events.filter((e) => f.events.includes(e.event)).map((e) => e.personId))
        return {
          key: f.key,
          label: f.label,
          adoptionRate: allUsers.size ? Math.round((adopters.size / allUsers.size) * 1000) / 10 : 0,
          retentionLift: retentionLift(adopters),
        }
      }),
    }

    // ---- 리텐션 곡선(주차별) ----
    function retentionAt(week: number, activatedFilter?: boolean): number {
      if (week === 0) return 100
      const cohort = [...firstSeen.entries()].filter(
        ([id, fs]) =>
          fs <= now - week * 7 * DAY_MS &&
          fs >= now - lookbackDays * DAY_MS &&
          (activatedFilter === undefined || confirmedPersons.has(id) === activatedFilter),
      )
      if (!cohort.length) return 0
      const returned = cohort.filter(
        ([id, fs]) => events.some((e) => e.personId === id && e.ts >= fs + week * 7 * DAY_MS && e.ts < fs + (week + 1) * 7 * DAY_MS),
      )
      return Math.round((returned.length / cohort.length) * 1000) / 10
    }
    const curve = [0, 1, 2, 3, 4].map((week) => ({
      week,
      all: retentionAt(week),
      activated: retentionAt(week, true),
      notActivated: retentionAt(week, false),
    }))

    const resurrectedUsers = inRange.filter((e) => e.event === 'user_resurrected').length

    const byEntry = entryPaths.map((path) => {
      const cohort = [...personEntry.entries()].filter(([, p]) => p === path).map(([id]) => id)
      const eligible = cohort.filter((id) => {
        const fs = firstSeen.get(id)
        return fs !== undefined && fs <= now - 7 * DAY_MS
      })
      const returned = eligible.filter((id) => {
        const fs = firstSeen.get(id)!
        return events.some((e) => e.personId === id && e.ts >= fs + 7 * DAY_MS && e.ts < fs + 14 * DAY_MS)
      })
      return { path, d7: eligible.length ? Math.round((returned.length / eligible.length) * 1000) / 10 : 0 }
    })

    // ---- 바이럴(함께 정하기) ----
    const roomCreators = new Set(inRange.filter((e) => e.event === 'room_created').map((e) => e.personId)).size
    const roomJoiners = new Set(inRange.filter((e) => e.event === 'room_joined').map((e) => e.personId)).size
    const roomAdopters = new Set(events.filter((e) => e.event === 'room_created' || e.event === 'room_joined').map((e) => e.personId))
    const virality = {
      kFactor: roomCreators ? Math.round((roomJoiners / roomCreators) * 100) / 100 : 0,
      roomCreators,
      roomJoiners,
      inviteConversion: roomCreators ? Math.min(100, Math.round((roomJoiners / roomCreators) * 1000) / 10) : 0,
      roomCohortRetentionLift: retentionLift(roomAdopters),
      trend: dailyTrend(
        (e) => e.event === 'room_created' || e.event === 'room_joined',
        (e) => (e.event === 'room_created' ? 'created' : 'joined'),
        ['created', 'joined'],
      ),
    }

    return {
      updatedAt: new Date(now).toISOString().slice(0, 16).replace('T', ' '),
      range,
      overview: [
        { id: 'wrd', label: '주간 반복 결정자 (북극성)', value: wrdCount(now), unit: 'count', higherIsBetter: true, hint: '한 주 2일+ 룰렛 결정 확정' },
        { id: 'wau', label: '주간 활성 사용자 (WAU)', value: wauSet.size, unit: 'count', higherIsBetter: true },
        { id: 'newusers', label: '신규 유입', value: newUserIds.length, unit: 'count', higherIsBetter: true },
        { id: 'activation', label: '활성화율', value: Math.round(activation * 10) / 10, unit: 'percent', higherIsBetter: true, hint: '첫 세션 내 결정 확정' },
        { id: 's2c', label: 'Spin→Confirm 전환', value: Math.round(s2c * 10) / 10, unit: 'percent', higherIsBetter: true },
        { id: 'push', label: '알림 재유입률', value: Math.round(pushReengagementRate * 10) / 10, unit: 'percent', higherIsBetter: true, hint: '알림 클릭으로 재방문' },
        {
          id: 'stickiness',
          label: 'DAU/WAU 점착도',
          value: wauSet.size ? Math.round((dauSet.size / wauSet.size) * 1000) / 10 : 0,
          unit: 'percent',
          higherIsBetter: true,
          hint: '일간활성/주간활성 비율 — 습관 강도',
        },
      ],
      northStarTrend,
      // sources(utm 캠페인 브레이크다운)는 아직 캠페인 링크를 안 뿌려서 비워둔다 —
      // Part 1의 "utm_source=...&utm_medium=..." 컨벤션대로 링크를 뿌리기 시작하면
      // person property($initial_utm_source 등)로 채우는 쿼리를 추가한다.
      acquisition: { newUsersTrend, sources: [], entryShares },
      retention: { curve, pushReengagementRate: Math.round(pushReengagementRate * 10) / 10, resurrectedUsers, byEntry },
      roulette: {
        funnel,
        spinToConfirmRate: Math.round(s2c * 10) / 10,
        respinRate: Math.round(respinRate * 10) / 10,
        spinDepth,
        weeklyDecisionFreq: Math.round(weeklyDecisionFreq * 10) / 10,
      },
      featureAdoption,
      virality,
      // toss는 앱인토스 입점 전이라 실제로 0이 맞다 — 채워진 것처럼 보이면 그게 거짓말.
      channels: {
        rows: [
          { metric: 'WAU', pwa: wauSet.size, toss: 0, unit: 'count' },
          { metric: '활성화율', pwa: Math.round(activation * 10) / 10, toss: 0, unit: 'percent' },
          { metric: 'Spin→Confirm', pwa: Math.round(s2c * 10) / 10, toss: 0, unit: 'percent' },
          { metric: 'W2 리텐션', pwa: curve[2]?.all ?? 0, toss: 0, unit: 'percent' },
          { metric: '주당 결정 빈도', pwa: Math.round(weeklyDecisionFreq * 10) / 10, toss: 0, unit: 'ratio' },
        ],
      },
      monetization: { enabled: false },
    }
  },
}
