/*
 * PostHog person property 이름 → 유저 상세 패널에서 묶어 보여줄 카테고리.
 * event-catalog.ts의 EVENT_CATALOG가 이벤트마다 들고 있는 personProperties
 * 필드에서 손으로 옮겼다 — 그래서 이 목록도 event-catalog.ts와 같은 유지보수
 * 규칙을 따른다: jeomechu(index.html)의 $set 호출이 person property를
 * 새로 추가/변경하면 이 맵도 같이 고칠 것.
 *
 * 맵에 없는 속성(예: $geoip_* 같은 PostHog 자체 속성, 아직 여기 안 옮긴
 * 새 property)은 categorizeProperty가 조용히 '기타'로 묶는다 — 목록에서
 * 빠뜨리는 것보다는 분류 못 한 채로라도 보이는 편이 낫다.
 */
export type PersonPropertyCategory = '기본 정보' | '방문 패턴' | '핵심 행동' | '기능 채택' | '그룹 · 바이럴' | '기타'

export const PERSON_PROPERTY_CATEGORY_ORDER: PersonPropertyCategory[] = [
  '기본 정보',
  '방문 패턴',
  '핵심 행동',
  '기능 채택',
  '그룹 · 바이럴',
  '기타',
]

export const PERSON_PROPERTY_CATEGORIES: Record<string, Exclude<PersonPropertyCategory, '기타'>> = {
  // 기본 정보 — 계정 자체에 대한 것
  has_account: '기본 정보',
  uses_sync: '기본 정보',

  // 방문 패턴 — 뭘 들여다보는지(조회성 행동)
  uses_calendar: '방문 패턴',
  uses_history: '방문 패턴',
  uses_stats: '방문 패턴',
  uses_copy: '방문 패턴',

  // 핵심 행동 — 메뉴 자체를 다루는 행동
  edited_menus: '핵심 행동',
  menu_pool_size: '핵심 행동',
  uses_categories: '핵심 행동',
  uses_search: '핵심 행동',
  uses_dislikes: '핵심 행동',
  uses_favorites: '핵심 행동',

  // 기능 채택 — 부가 기능 on/off
  notify_enabled: '기능 채택',
  notify_time: '기능 채택',
  installed: '기능 채택',

  // 그룹 · 바이럴 — 혼자가 아니라 누구랑 같이 쓰는지
  uses_groups: '그룹 · 바이럴',
  group_count: '그룹 · 바이럴',
  uses_rooms: '그룹 · 바이럴',
}

export function categorizeProperty(name: string): PersonPropertyCategory {
  return PERSON_PROPERTY_CATEGORIES[name] ?? '기타'
}
