import { METRIC_DEFINITIONS } from '@/lib/metrics/posthog-definitions'
import type { EventScreenKey } from '@/lib/momeokji-event-screens'

/*
 * posthog-definitions.ts가 "지표 하나가 어떤 이벤트들을 합쳐 나온
 * 숫자인지"를 담는다면, 이 파일은 그 반대 방향 — "이벤트 하나하나가
 * index.html 어디에 어떻게 심어져 있는지"를 담는다. jeomechu(index.html)
 * 안의 window.track(...) 호출을 grep으로 뽑아 그대로 옮겼다 — 지어낸
 * 속성이 하나도 없다. 실제 호출 지점은 38곳(menu_added·notify_toggled가
 * 각각 두 지점에서 같은 이름으로 발화)인데, 이 카탈로그는 "호출 지점"이
 * 아니라 "이벤트 이름" 단위라 고유 이벤트 수는 36개다. jeomechu에서
 * track() 호출을 고치면 이 파일도 같이 고칠 것(반대 방향 파일과 동일한
 * 유지보수 규칙).
 */

export interface EventCatalogEntry {
  /** posthog.capture()에 실제로 찍히는 이벤트 이름. */
  name: string
  /** 이벤트 카탈로그 좌측 목록을 묶는 카테고리. */
  category: string
  /** 언제, 어떤 사용자 행동으로 발화되는지. */
  trigger: string
  /** 이 호출과 함께 실리는 이벤트 속성(1회성 — capture의 두 번째 인자). */
  properties: string[]
  /** $set으로 같이 실리는 person property(있으면) — 코호트/필터에 영구히 남는다. */
  personProperties?: string[]
  /** 우측 미리보기 iframe에 그릴 화면 그룹. */
  screen: EventScreenKey
  /** iframe 안에서 이 이벤트를 가리키는 라벨 — SCREENS 마크업의 data-label과 맞춰야 함. */
  screenLabel: string
  /** index.html 안의 대략적 위치(줄 번호) — 코드로 바로 찾아갈 때 씀. */
  sourceLine: number
}

/*
 * 36개 전부가 커밋 하나(03683d9)에서 한 번에 심어졌다 — jeomechu 커밋
 * 로그가 34개뿐이라 git log -S로 이벤트별 도입 시점을 확인했고, 실제로
 * 전부 이 한 커밋 안에 있다(개별 이벤트마다 "버전"이 다르지 않다는 뜻).
 * 대신 "심음"과 "실제 전송 시작"이 다른 커밋이라 그 둘을 나눠 기록한다.
 */
export const EVENT_DEPLOYMENT = {
  appVersion: '1.8',
  date: '2026-08-29',
  instrumented: { commit: '03683d9', message: 'feat: PostHog 계측 붙이기 (유입/재방문/룰렛/기능별 이벤트)' },
  activated: { commit: '8481b60', message: 'feat: PostHog 프로젝트 키 채우기 — 계측 실제 활성화' },
  guarded: [
    { commit: 'cdd302a', message: 'feat: 로컬/리뷰 테스트는 PostHog에 아예 안 보내게 막는다' },
    { commit: 'd4855e4', message: "fix: ?ph_test=1을 '표시만'에서 '전송 자체 차단'으로 바꾼다" },
  ],
  note:
    '36개 이벤트 전부 같은 커밋에서 동시에 심어져서 이벤트별로 버전이 갈리지 않는다. 코드는 03683d9에서 들어갔지만, 프로젝트 키가 비어 있어 실제로 PostHog에 전송되기 시작한 건 8481b60부터다. 그 사이(그리고 이후 로컬 개발 중)의 잡음을 걸러내려 cdd302a·d4855e4에서 로컬/리뷰(?ph_test=1) 트래픽을 아예 차단했다.',
}

export const EVENT_CATALOG: EventCatalogEntry[] = [
  // ── 앱 진입 ──
  { name: 'app_opened', category: '앱 진입', trigger: '앱 최초 로드(load) 또는 백그라운드에서 포그라운드로 돌아올 때(visibilitychange)', properties: [], screen: 'home', screenLabel: '', sourceLine: 98 },
  { name: 'app_reengaged', category: '앱 진입', trigger: '알림을 눌렀는데 이미 열려있던 창이 포커스만 받을 때(서비스워커 → postMessage)', properties: ['source'], screen: 'home', screenLabel: '', sourceLine: 108 },
  { name: 'group_switched', category: '앱 진입', trigger: '헤더의 그룹 드롭다운에서 다른 그룹을 고를 때', properties: [], screen: 'home', screenLabel: 'group_switched', sourceLine: 1522 },

  // ── 룰렛 ──
  { name: 'menu_spun', category: '룰렛', trigger: "'돌리기' 버튼을 눌러 슬롯이 실제로 돌 때", properties: ['pool_size', 'excluded_count', 'spin_index', 'group', 'exclude_on'], screen: 'home', screenLabel: 'menu_spun', sourceLine: 1613 },
  { name: 'menu_result_shown', category: '룰렛', trigger: '슬롯이 멈추고 결과가 화면에 표시될 때', properties: ['menu_name'], screen: 'spin-result', screenLabel: 'menu_result_shown', sourceLine: 1626 },
  { name: 'menu_confirmed', category: '룰렛', trigger: "결과를 '선택'해서 오늘 후보에 담을 때", properties: ['menu_name', 'categories', 'group', 'spins_before_confirm'], screen: 'spin-result', screenLabel: 'menu_confirmed', sourceLine: 1639 },
  { name: 'menu_reordered', category: '룰렛', trigger: "'오늘 뭐 먹지' 목록에서 순서를 드래그로 바꿀 때", properties: [], personProperties: ['edited_menus'], screen: 'today-list', screenLabel: 'menu_reordered', sourceLine: 1760 },

  // ── 캘린더 · 히스토리 ──
  { name: 'calendar_date_viewed', category: '캘린더 · 히스토리', trigger: '캘린더에서 날짜 하나를 클릭해 그날 상세를 볼 때', properties: [], personProperties: ['uses_calendar'], screen: 'calendar', screenLabel: 'calendar_date_viewed', sourceLine: 1855 },
  { name: 'today_copied', category: '캘린더 · 히스토리', trigger: "'오늘' 후보 목록을 복사 버튼으로 복사할 때", properties: [], personProperties: ['uses_copy'], screen: 'today-list', screenLabel: 'today_copied', sourceLine: 1953 },
  { name: 'tab_switched', category: '캘린더 · 히스토리', trigger: '하단 탭바(슬롯/메뉴/분석/프로필)를 눌러 탭을 바꿀 때', properties: ['tab'], screen: 'calendar', screenLabel: 'tab_switched · history_viewed', sourceLine: 2322 },
  { name: 'history_viewed', category: '캘린더 · 히스토리', trigger: "'분석' 탭 중 히스토리 뷰로 들어갈 때(tab_switched 직후)", properties: [], personProperties: ['uses_history'], screen: 'calendar', screenLabel: 'tab_switched · history_viewed', sourceLine: 2323 },
  { name: 'stats_viewed', category: '캘린더 · 히스토리', trigger: "'분석' 탭에서 캘린더 대신 통계 서브탭을 볼 때", properties: [], personProperties: ['uses_stats'], screen: 'calendar', screenLabel: 'stats_viewed', sourceLine: 2330 },

  // ── 메뉴 관리 ──
  { name: 'favorite_toggled', category: '메뉴 관리', trigger: '메뉴 목록에서 별표(즐겨찾기)를 켜거나 끌 때', properties: ['favorited'], personProperties: ['uses_favorites'], screen: 'menu-list', screenLabel: 'favorite_toggled', sourceLine: 2159 },
  { name: 'menu_deleted', category: '메뉴 관리', trigger: '편집 모드에서 메뉴 항목을 삭제할 때', properties: [], personProperties: ['edited_menus'], screen: 'menu-list-edit', screenLabel: 'menu_deleted', sourceLine: 2185 },
  { name: 'edit_mode_toggled', category: '메뉴 관리', trigger: '메뉴 목록의 편집 아이콘을 눌러 편집 모드로 들어갈 때', properties: [], screen: 'menu-list-edit', screenLabel: 'edit_mode_toggled', sourceLine: 2191 },
  { name: 'menu_added', category: '메뉴 관리', trigger: '새 메뉴 이름을 입력해 목록에 추가할 때', properties: ['menu_pool_size'], personProperties: ['menu_pool_size'], screen: 'menu-list', screenLabel: 'menu_added', sourceLine: 2219 },
  { name: 'category_deleted', category: '메뉴 관리', trigger: '카테고리 관리 팝업에서 카테고리를 삭제할 때', properties: [], screen: 'menu-list-edit', screenLabel: 'category_added', sourceLine: 2305 },
  { name: 'category_added', category: '메뉴 관리', trigger: '카테고리 관리 팝업에서 새 카테고리를 추가할 때', properties: [], personProperties: ['uses_categories'], screen: 'menu-list-edit', screenLabel: 'category_added', sourceLine: 2312 },
  { name: 'menu_searched', category: '메뉴 관리', trigger: '메뉴 검색창에 입력 후 타이핑이 600ms 멈췄을 때(디바운스, 재입력 시 중복 전송 안 함)', properties: [], personProperties: ['uses_search'], screen: 'menu-list', screenLabel: 'menu_searched', sourceLine: 2491 },
  { name: 'exclude_used', category: '메뉴 관리', trigger: "'이미 나온 메뉴는 다음 슬롯에서 제외' 스위치를 켤 때", properties: [], personProperties: ['uses_dislikes'], screen: 'home', screenLabel: 'exclude_used', sourceLine: 2494 },

  // ── 그룹 · 알러지 ──
  { name: 'dislike_added', category: '그룹 · 알러지', trigger: '그룹관리에서 구성원의 못 먹는 음식/알러지를 추가할 때', properties: [], personProperties: ['uses_dislikes'], screen: 'group-manage', screenLabel: 'dislike_added', sourceLine: 2421 },
  { name: 'group_added', category: '그룹 · 알러지', trigger: '그룹관리에서 새 그룹을 추가할 때', properties: [], personProperties: ['uses_groups', 'group_count'], screen: 'group-manage', screenLabel: 'group_added', sourceLine: 2454 },
  { name: 'group_deleted', category: '그룹 · 알러지', trigger: '그룹관리에서 그룹을 삭제할 때', properties: [], personProperties: ['group_count'], screen: 'group-manage', screenLabel: 'group_deleted', sourceLine: 2469 },

  // ── 알림 · 설치 ──
  { name: 'notify_toggled', category: '알림 · 설치', trigger: '프로필의 푸시 알림 스위치를 켜거나 끌 때', properties: ['enabled'], personProperties: ['notify_enabled'], screen: 'notify-install', screenLabel: 'notify_toggled · push_subscribed', sourceLine: 2788 },
  { name: 'push_subscribed', category: '알림 · 설치', trigger: '알림을 켜서 실제 브라우저 푸시 구독이 완료됐을 때(notify_toggled(on) 직후)', properties: [], personProperties: ['notify_enabled', 'notify_time'], screen: 'notify-install', screenLabel: 'notify_toggled · push_subscribed', sourceLine: 2789 },
  { name: 'install_clicked', category: '알림 · 설치', trigger: "프로필의 '홈 화면에 설치' 버튼을 눌렀을 때(설치 프롬프트를 띄우기 직전)", properties: [], screen: 'notify-install', screenLabel: 'install_clicked · pwa_installed', sourceLine: 2945 },
  { name: 'pwa_installed', category: '알림 · 설치', trigger: 'PWA 설치가 실제로 완료됐을 때(appinstalled 브라우저 이벤트)', properties: [], personProperties: ['installed'], screen: 'notify-install', screenLabel: 'install_clicked · pwa_installed', sourceLine: 2934 },

  // ── 계정 · 동기화 ──
  { name: 'signed_up', category: '계정 · 동기화', trigger: '회원가입 폼 제출이 성공했을 때', properties: [], personProperties: ['has_account'], screen: 'auth', screenLabel: 'signed_up', sourceLine: 3287 },
  { name: 'logged_in', category: '계정 · 동기화', trigger: '로그인 폼 제출이 성공했을 때', properties: [], screen: 'auth', screenLabel: 'logged_in', sourceLine: 3297 },
  { name: 'sync_completed', category: '계정 · 동기화', trigger: '로그인된 상태에서 로컬 데이터를 Supabase로 업로드/동기화를 마쳤을 때', properties: [], personProperties: ['has_account', 'uses_sync'], screen: 'notify-install', screenLabel: 'sync_completed · user_resurrected', sourceLine: 3122 },
  { name: 'user_resurrected', category: '계정 · 동기화', trigger: '로그인에 성공했는데 마지막 로그인이 30일 이상 전이었을 때', properties: ['days_since_last_login'], screen: 'notify-install', screenLabel: 'sync_completed · user_resurrected', sourceLine: 3193 },

  // ── 피드백 ──
  { name: 'feedback_sent', category: '피드백', trigger: "피드백 다이얼로그에서 '새로운 기능/버그' 중 하나를 고르고 10자 이상 적어 보낼 때", properties: ['type'], screen: 'feedback', screenLabel: 'feedback_sent', sourceLine: 3337 },

  // ── 함께 정하기 (룸) ──
  { name: 'room_joined', category: '함께 정하기', trigger: '초대 코드로 남의 방에 실제로 입장했을 때', properties: [], personProperties: ['uses_rooms'], screen: 'room', screenLabel: 'room_joined', sourceLine: 3461 },
  { name: 'room_created', category: '함께 정하기', trigger: "'방 만들기'로 새 함께정하기 룸을 만들 때", properties: [], personProperties: ['uses_rooms'], screen: 'room', screenLabel: 'room_created', sourceLine: 3478 },
  { name: 'room_entry_submitted', category: '함께 정하기', trigger: '룸 참여자가 자기 후보 메뉴를 제출할 때', properties: [], screen: 'room', screenLabel: 'room_entry_submitted', sourceLine: 3506 },
  { name: 'room_spun', category: '함께 정하기', trigger: "방장이 참여자들의 후보를 모아 '다 같이 돌리기'를 누를 때", properties: ['candidate_count'], screen: 'room', screenLabel: 'room_spun', sourceLine: 3522 },
]

export const EVENT_CATEGORIES: string[] = Array.from(new Set(EVENT_CATALOG.map((e) => e.category)))

/*
 * EVENT_CATALOG은 "이벤트 하나 → 그 프로퍼티들"을 담는다. 이 아래는
 * 그 반대 방향 — "프로퍼티 하나 → 그걸 갖고 있는 이벤트들"이다. "group
 * 이라는 프로퍼티가 어디어디에 쓰이지?" 같은 역방향 조회에 쓴다.
 *
 * event property와 person property는 이름이 같아도 분리해서 센다
 * (kind로 구분) — 하나는 이벤트 발생 1회성 값이고 하나는 사용자에게
 * 영구히 남는 코호트 속성이라 의미가 다르다. UI에서도 이미 다른
 * Badge variant(neutral vs warning)로 구분해 보여주고 있다.
 */
export interface PropertyCatalogEntry {
  name: string
  kind: 'event' | 'person'
  /** 이 프로퍼티를 싣는 이벤트 이름들. */
  events: string[]
}

export const PROPERTY_CATALOG: PropertyCatalogEntry[] = (() => {
  const map = new Map<string, PropertyCatalogEntry>()
  const add = (name: string, kind: PropertyCatalogEntry['kind'], eventName: string) => {
    const key = `${kind}:${name}`
    const existing = map.get(key)
    if (existing) {
      existing.events.push(eventName)
    } else {
      map.set(key, { name, kind, events: [eventName] })
    }
  }
  for (const e of EVENT_CATALOG) {
    for (const p of e.properties) add(p, 'event', e.name)
    for (const p of e.personProperties ?? []) add(p, 'person', e.name)
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})()

/**
 * 이벤트 이름·카테고리·트리거 설명·프로퍼티·person property 전부를
 * 대상으로 대소문자 구분 없이 부분일치 검색한다. 빈 문자열이면 전체를
 * 그대로 돌려준다. "이 프로퍼티를 가진 이벤트가 뭐지"(역방향)와 "이
 * 이벤트 이름이 뭐였더라"(정방향) 둘 다 같은 검색창 하나로 처리하려는
 * 의도 — 카탈로그를 쓰는 사람이 어느 방향에서 출발할지 미리 알 수 없다.
 */
export function searchEventCatalog(query: string): EventCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return EVENT_CATALOG
  return EVENT_CATALOG.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.trigger.toLowerCase().includes(q) ||
      e.properties.some((p) => p.toLowerCase().includes(q)) ||
      (e.personProperties ?? []).some((p) => p.toLowerCase().includes(q)),
  )
}

/**
 * 이 이벤트를 events[].name에 걸고 있는 지표 정의를 전부 찾는다. 지표
 * 쪽 event ref는 "push_subscribed / notify_toggled"처럼 여러 이벤트를
 * 슬래시로 묶어 한 줄에 적어둔 경우가 있어 단순 === 비교로는 못 찾는다
 * — 슬래시/공백으로 쪼갠 토큰 중 하나로 일치하는지 본다. channelsCompare
 * 처럼 "(여러 이벤트 공통)"이라 적어 둔 건 사실상 전체 이벤트에 걸리는
 * channel super property 얘기라 모든 이벤트에 매칭시킨다.
 */
export function getMetricsForEvent(eventName: string): Array<{ key: string; title: string }> {
  const results: Array<{ key: string; title: string }> = []
  for (const [key, def] of Object.entries(METRIC_DEFINITIONS)) {
    const hit = def.events.some((ev) => {
      if (ev.name === '(여러 이벤트 공통)') return true
      return ev.name
        .split('/')
        .map((s) => s.trim())
        .includes(eventName)
    })
    if (hit) results.push({ key, title: def.title })
  }
  return results
}
