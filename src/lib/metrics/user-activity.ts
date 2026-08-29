import { runPostHogQuery } from './posthog-client'
import type { EntryPath } from './types'

/*
 * 유저 1명의 PostHog 행동 요약. Users 테이블에서 행을 클릭했을 때만 온디맨드로
 * 부른다(목록 로드 시 전원 조회하면 유저 수만큼 쿼리가 나가서 비쌈).
 *
 * distinct_id vs person_id: 로그인 시 posthog.identify(supabase user id)를
 * 부르므로, 로그인 이후 이벤트는 distinct_id가 이 UUID와 정확히 같다. 하지만
 * PostHog는 내부적으로 별도의 person_id(로그인 전 익명 활동까지 병합한
 * synthetic UUID)로 사람을 묶는다 — 그래서 이 UUID로 곧바로 person_id를
 * 찾은 뒤, 그 person_id로 전체 활동(로그인 전 익명 스핀 포함)을 가져온다.
 */
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

export async function getUserActivity(supabaseUserId: string): Promise<UserActivitySummary> {
  if (!UUID_RE.test(supabaseUserId)) throw new Error('잘못된 사용자 id입니다.')

  const rows = await runPostHogQuery(`
    SELECT event, timestamp, properties.$browser, properties.$os, properties.$device_type, properties.entry
    FROM events
    WHERE person_id = (
      SELECT any(person_id) FROM events WHERE distinct_id = '${supabaseUserId}'
    )
    ORDER BY timestamp DESC
    LIMIT 500
  `)
  if (rows.length === 0) return EMPTY

  let spins = 0
  let confirms = 0
  let firstSeen = Infinity
  let lastActive = -Infinity
  let device: string | null = null
  let entry: EntryPath | null = null

  for (const r of rows) {
    const event = String(r[0])
    const ts = new Date(r[1] as string).getTime()
    const browser = r[2] != null ? String(r[2]) : null
    const os = r[3] != null ? String(r[3]) : null
    const deviceType = r[4] != null ? String(r[4]) : null
    const rowEntry = r[5] != null ? String(r[5]) : null

    if (event === 'menu_spun') spins++
    if (event === 'menu_confirmed') confirms++
    if (ts < firstSeen) firstSeen = ts
    if (ts > lastActive) {
      lastActive = ts
      // 가장 최근 이벤트에 기기 정보가 있으면 그걸 우선한다 — "지금 이 사람이
      // 뭘 쓰는지"가 예전 기기 정보보다 유용하다.
      if (browser || os || deviceType) device = [deviceType, os, browser].filter(Boolean).join(' · ')
    }
    // entry(유입 경로)는 세션 시작 시 한 번 정해지는 값이라 가장 오래된
    // 이벤트 쪽이 "최초 유입 경로"에 더 가깝다. rows는 최신순(DESC)이라
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
    totalEvents: rows.length,
    spins,
    confirms,
    spinToConfirmRate: spins ? Math.round((confirms / spins) * 1000) / 10 : 0,
  }
}
