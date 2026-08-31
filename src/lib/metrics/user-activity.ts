import { runPostHogQuery } from './posthog-client'
import type { EntryPath } from './types'

/*
 * 유저 1명의 PostHog 행동. 목록에서 행을 클릭했을 때만 온디맨드로 부른다
 * (목록 로드 시 전원 조회하면 유저 수만큼 쿼리가 나가서 비쌈).
 *
 * key가 두 갈래인 이유: 회원(로그인해서 posthog.identify(supabaseUserId)를
 * 부른 적 있는 사람)은 distinct_id로 person_id를 거꾸로 찾을 수 있지만,
 * 비회원(anonymous-visitors.ts가 넘겨주는 PostHog person)은 애초에
 * Supabase UUID가 없다 — 이미 알고 있는 person_id로 곧장 조회한다.
 *
 * distinct_id vs person_id: 로그인 시 posthog.identify(supabase user id)를
 * 부르므로, 로그인 이후 이벤트는 distinct_id가 이 UUID와 정확히 같다. 하지만
 * PostHog는 내부적으로 별도의 person_id(로그인 전 익명 활동까지 병합한
 * synthetic UUID)로 사람을 묶는다 — 그래서 회원 쪽은 이 UUID로 곧바로
 * person_id를 찾은 뒤, 그 person_id로 전체 활동(로그인 전 익명 스핀 포함)을
 * 가져온다.
 */
export type ActivityKey = { distinctId: string } | { personId: string }

export interface ActivityEvent {
  event: string
  timestamp: string
  properties: Record<string, unknown>
}

export interface UserActivitySummary {
  /** 이 유저의 PostHog 이벤트가 하나도 없으면 false(설치 전이거나 ?ph_test=1로 테스트만 한 경우 등). */
  found: boolean
  device: string | null
  entry: EntryPath | null
  firstSeen: string | null
  lastActive: string | null
  totalEvents: number
  spins: number
  confirms: number
  spinToConfirmRate: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** person_id는 UUID가 아닐 수도 있어 좀 더 느슨하게 — SQL 인젝션만 막는 최소 검증. */
const SAFE_ID_RE = /^[0-9a-zA-Z-]+$/

const EMPTY: UserActivitySummary = {
  found: false,
  device: null,
  entry: null,
  firstSeen: null,
  lastActive: null,
  totalEvents: 0,
  spins: 0,
  confirms: 0,
  spinToConfirmRate: 0,
}

function personIdWhereClause(key: ActivityKey): string {
  if ('distinctId' in key) {
    if (!UUID_RE.test(key.distinctId)) throw new Error('잘못된 사용자 id입니다.')
    return `person_id = (SELECT any(person_id) FROM events WHERE distinct_id = '${key.distinctId}')`
  }
  if (!SAFE_ID_RE.test(key.personId)) throw new Error('잘못된 person id입니다.')
  return `person_id = '${key.personId}'`
}

/*
 * getUserActivity(집계)와 getUserEventFeed(원본 타임라인)가 둘 다 필요로
 * 하는 500건짜리 이벤트 조회를 한 번만 하려고 뺐다 — 상세 패널을 열 때마다
 * 이벤트 쿼리를 두 번 부르면 그만큼 PostHog 쪽에 비용이 든다.
 */
async function fetchPersonEvents(key: ActivityKey, limit = 500): Promise<ActivityEvent[]> {
  const where = personIdWhereClause(key)
  const rows = await runPostHogQuery(`
    SELECT event, timestamp, properties
    FROM events
    WHERE ${where}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `)
  return rows.map((r) => {
    const raw = r[2]
    let properties: Record<string, unknown> = {}
    if (raw && typeof raw === 'object') properties = raw as Record<string, unknown>
    else if (typeof raw === 'string') {
      try {
        properties = JSON.parse(raw) as Record<string, unknown>
      } catch {
        properties = {}
      }
    }
    return { event: String(r[0]), timestamp: String(r[1]), properties }
  })
}

/** Activity Feed가 그대로 시간순으로 렌더링할 원본 이벤트 목록. */
export async function getUserEventFeed(key: ActivityKey, limit = 500): Promise<ActivityEvent[]> {
  return fetchPersonEvents(key, limit)
}

export function summarizeUserActivity(events: ActivityEvent[]): UserActivitySummary {
  if (events.length === 0) return EMPTY

  let spins = 0
  let confirms = 0
  let firstSeen = Infinity
  let lastActive = -Infinity
  let device: string | null = null
  let entry: EntryPath | null = null

  // events는 최신순(DESC)이다.
  for (const e of events) {
    const ts = new Date(e.timestamp).getTime()
    const browser = e.properties.$browser != null ? String(e.properties.$browser) : null
    const os = e.properties.$os != null ? String(e.properties.$os) : null
    const deviceType = e.properties.$device_type != null ? String(e.properties.$device_type) : null
    const rowEntry = e.properties.entry != null ? String(e.properties.entry) : null

    if (e.event === 'menu_spun') spins++
    if (e.event === 'menu_confirmed') confirms++
    if (ts < firstSeen) firstSeen = ts
    if (ts > lastActive) {
      lastActive = ts
      // 가장 최근 이벤트에 기기 정보가 있으면 그걸 우선한다 — "지금 이 사람이
      // 뭘 쓰는지"가 예전 기기 정보보다 유용하다.
      if (browser || os || deviceType) device = [deviceType, os, browser].filter(Boolean).join(' · ')
    }
    // entry(유입 경로)는 세션 시작 시 한 번 정해지는 값이라 가장 오래된
    // 이벤트 쪽이 "최초 유입 경로"에 더 가깝다. events는 최신순(DESC)이라
    // 루프가 오래된 행으로 갈수록 나중에 도니, 계속 덮어써서 마지막(=가장
    // 오래된 행)에서 확정된 값이 남게 한다.
    if (rowEntry) entry = rowEntry as EntryPath
  }

  return {
    found: true,
    device,
    entry,
    firstSeen: new Date(firstSeen).toISOString(),
    lastActive: new Date(lastActive).toISOString(),
    totalEvents: events.length,
    spins,
    confirms,
    spinToConfirmRate: spins ? Math.round((confirms / spins) * 1000) / 10 : 0,
  }
}

export async function getUserActivity(key: ActivityKey): Promise<UserActivitySummary> {
  const events = await fetchPersonEvents(key)
  return summarizeUserActivity(events)
}

export interface DailyVisitPoint {
  date: string
  visits: number
}

/*
 * "하루에 몇 번 들어왔는지" — 28일 막대그래프용. "방문"은 app_opened /
 * app_reengaged(EVENT_CATALOG의 "앱 진입" 카테고리)로 잡는다 — 전체
 * 이벤트를 세면 "방문 횟수"가 아니라 "한 방문 안에서 한 행동 수"와
 * 섞인다. ClickHouse GROUP BY는 이벤트가 0건인 날은 행 자체를 안 주므로,
 * 여기서 days만큼 0으로 채워 돌려준다(막대그래프가 빈 날을 그냥 건너뛰지
 * 않게).
 */
/*
 * ClickHouse GROUP BY는 이벤트가 0건인 날은 행 자체를 안 주므로, 순수
 * 함수로 뺴서 "오늘 기준으로 days일치 빈 날을 0으로 채운다"만 따로
 * 테스트할 수 있게 한다(runPostHogQuery를 목업하지 않고도 검증 가능).
 */
export function zeroFillDailyVisits(rows: Array<[string, number]>, days: number, today = new Date()): DailyVisitPoint[] {
  const byDate = new Map<string, number>()
  for (const [date, visits] of rows) byDate.set(date.slice(0, 10), visits)

  const points: DailyVisitPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    points.push({ date: key, visits: byDate.get(key) ?? 0 })
  }
  return points
}

export async function getUserDailyVisits(key: ActivityKey, days = 28): Promise<DailyVisitPoint[]> {
  const where = personIdWhereClause(key)
  const rows = await runPostHogQuery(`
    SELECT toDate(timestamp) AS day, count() AS visits
    FROM events
    WHERE ${where}
      AND event IN ('app_opened', 'app_reengaged')
      AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY day
    ORDER BY day
  `)
  return zeroFillDailyVisits(
    rows.map((r): [string, number] => [String(r[0]), Number(r[1])]),
    days,
  )
}

export interface PersonProfile {
  properties: Record<string, unknown>
  /** person이 마지막으로 갱신된 시각(있으면) — 인물 카드의 updated_at. */
  createdAt: string | null
}

/*
 * 회원 1명의 "지금 상태"(person property 값)를 가져온다. events.properties는
 * 발생 시점 스냅샷이라 person property 값 리스트(기본정보/방문패턴/핵심행동
 * 카테고리)를 채우기엔 안 맞는다 — HogQL의 events.person.* 가상 필드(각
 * 이벤트에 이미 조인돼 있는 그 시점 person row)를 쓴다. anonymous-visitors.ts처럼
 * persons 테이블을 직접 조인하는 대신 이미 이 파일 전체가 쓰는 events
 * 기반 쿼리 패턴을 그대로 따른다 — 검증된 경로를 재사용하는 편이 새
 * persons 조인보다 안전하다. 그래도 person.created_at이 실제로 "마지막
 * 갱신 시각"을 뜻하는지는 이 프로젝트 데이터로 아직 안 쏴봤다 — 처음
 * 돌릴 때 값이 이상하면 이 함수부터 의심할 것.
 *
 * 비회원은 이 함수를 안 쓴다 — anonymous-visitors.ts가 목록 조회 때 이미
 * properties를 통째로 들고 있어(AnonymousVisitor.properties) 다시 쿼리할
 * 필요가 없다.
 */
export async function getPersonProperties(key: ActivityKey): Promise<PersonProfile> {
  const where = personIdWhereClause(key)
  const rows = await runPostHogQuery(`
    SELECT any(person.properties), any(person.created_at)
    FROM events
    WHERE ${where}
    LIMIT 1
  `)
  if (rows.length === 0) return { properties: {}, createdAt: null }

  const raw = rows[0][0]
  let properties: Record<string, unknown> = {}
  if (raw && typeof raw === 'object') properties = raw as Record<string, unknown>
  else if (typeof raw === 'string') {
    try {
      properties = JSON.parse(raw) as Record<string, unknown>
    } catch {
      properties = {}
    }
  }
  return { properties, createdAt: rows[0][1] != null ? String(rows[0][1]) : null }
}
