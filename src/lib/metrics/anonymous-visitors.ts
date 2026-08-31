import { runPostHogQuery } from './posthog-client'

/*
 * 로그인(회원가입)한 적 없는 PostHog 익명 방문자 — "비회원"으로 유저
 * 목록에 같이 보여주기 위한 조회. 이 저장소가 PostHog persons 테이블을
 * 쿼리하는 첫 지점이다(지금까지 user-activity.ts·posthog.ts는 전부
 * events 테이블만 썼다) — 그래서 아래 쿼리는 PostHog HogQL 공식 문서
 * 기준(persons: id/created_at/properties/is_identified, distinct_id는
 * persons에 직접 없고 person_distinct_ids를 조인해야 얻는다)으로 작성했지
 * 실제 이 프로젝트 데이터로 한 번도 쏴본 적은 없다 — 처음 실행할 때
 * 컬럼명·형태가 다르면 이 파일부터 의심할 것.
 *
 * "사용자 수가 많아지면 뺄 수도 있다"는 게 이 기능을 요청한 사람의
 * 전제라, 처음부터 무제한 조회가 아니라 최근 N일 + 상한 개수로 가볍게
 * 잡는다 — 방문자 수가 늘면 이 두 숫자(days/limit)만 줄이면 되고, 아예
 * 뺄 땐 UsersSection에서 listAnonymousVisitors 호출 한 줄만 지우면 된다.
 */
export interface AnonymousVisitor {
  /** PostHog person.id — 이 사람 전체 활동을 묶는 진짜 식별자. */
  personId: string
  /** 이벤트 재조회(getUserActivity 등)에 쓸 대표 distinct_id. 못 찾으면 null. */
  distinctId: string | null
  createdAt: string
  country: string | null
  region: string | null
  city: string | null
  /** 상세 패널의 "속성" 리스트가 그대로 렌더링할 person.properties 원본. */
  properties: Record<string, unknown>
}

function parseProperties(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return {}
}

export async function listAnonymousVisitors(opts?: { days?: number; limit?: number }): Promise<AnonymousVisitor[]> {
  const days = opts?.days ?? 30
  const limit = opts?.limit ?? 200

  const rows = await runPostHogQuery(`
    SELECT persons.id, any(person_distinct_ids.distinct_id), persons.created_at, persons.properties
    FROM persons
    LEFT JOIN person_distinct_ids ON person_distinct_ids.person_id = persons.id
    WHERE persons.is_identified = 0
      AND persons.created_at >= now() - INTERVAL ${days} DAY
    GROUP BY persons.id, persons.created_at, persons.properties
    ORDER BY persons.created_at DESC
    LIMIT ${limit}
  `)

  return rows.map((r) => {
    const properties = parseProperties(r[3])
    return {
      personId: String(r[0]),
      distinctId: r[1] != null ? String(r[1]) : null,
      createdAt: String(r[2]),
      country: (properties.$geoip_country_name as string | undefined) ?? null,
      region: (properties.$geoip_region_name as string | undefined) ?? null,
      city: (properties.$geoip_city_name as string | undefined) ?? null,
      properties,
    }
  })
}
