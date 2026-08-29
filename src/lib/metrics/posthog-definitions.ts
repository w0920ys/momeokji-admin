/*
 * 이 대시보드의 각 지표가 PostHog에서 실제로 어떤 이벤트를, 어떻게
 * 집계해서 나온 값인지 손으로 관리하는 사전. mock.ts의 숫자 자체는
 * 가짜지만, 여기 적힌 "무엇을 어떻게 셀지"는 jeomechu(index.html)에
 * 이미 심어져 있는 실제 계측(window.track 호출)을 그대로 옮긴 것이다.
 *
 * PostHogSource(source.ts 참고, 아직 미구현)로 교체할 때 이 파일이
 * 바로 "무슨 인사이트를 만들어야 하는지"의 설계도가 된다 — 그래서
 * mock.ts처럼 숫자를 지어내는 파일이 아니라, jeomechu 쪽 이벤트 이름과
 * 반드시 실제로 일치해야 한다. jeomechu의 window.track 호출을 고치면
 * 이 파일도 같이 고칠 것.
 *
 * 키는 두 종류다 — KpiStat.id와 겹치는 키(overview 그리드 어디서든
 * 자동으로 매칭됨)와, overview에 없는 섹션 전용 차트/표를 위해 화면
 * 코드가 명시적으로 넘기는 키.
 */

export interface PostHogEventRef {
  /** posthog.capture()에 실제로 찍히는 이벤트 이름. */
  name: string
  /** 언제 발화되는지(한국어 설명). */
  trigger: string
  /** 같이 실리는 주요 속성(있으면). */
  properties?: string[]
}

export interface MetricDefinition {
  title: string
  /** 이 값을 어떻게 계산하는지 한두 문장. */
  aggregation: string
  events: PostHogEventRef[]
  /** identify된 사람에 $set으로 붙는 person property(있으면) — 코호트/필터에 쓰임. */
  personProperties?: string[]
  notes?: string
}

/** jeomechu의 window.track 래퍼가 실제로 호출되는 곳 — 이 파일과 반드시 맞춰 둘 것. */
export const POSTHOG_SOURCE_NOTE =
  'index.html의 window.track(name, props, personProps)가 posthog.capture(name, {...props, $set: personProps})를 그대로 호출한다. 로그인 시 Supabase user id(UUID)로 identify, 로그아웃 시 reset — 익명 이벤트도 나중에 같은 사람으로 합쳐진다.'

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // ── overview KPI (StatCard가 stat.id로 자동 매칭) ──
  wrd: {
    title: '주간 반복 결정자 (북극성 · WRD)',
    aggregation: '최근 7일 동안 menu_confirmed를 서로 다른 날짜에 2일 이상 발생시킨 고유 사용자 수.',
    events: [{ name: 'menu_confirmed', trigger: "슬롯 결과를 '선택'해서 오늘 후보에 담을 때(confirmWinner)", properties: ['menu_name', 'categories', 'group', 'spins_before_confirm'] }],
    notes: '북극성 지표라 daysActive ≥ 2인 사람만 세는 게 핵심 — PostHog에서는 menu_confirmed 트렌드를 사람별로 그룹핑한 뒤 distinct day count ≥2 필터로 만든다.',
  },
  wau: {
    title: '주간 활성 사용자 (WAU)',
    aggregation: '최근 7일 동안 app_opened를 1회 이상 발생시킨 고유 사용자(또는 익명 distinct_id) 수.',
    events: [{ name: 'app_opened', trigger: '앱 최초 로드 시(load) + 백그라운드에서 포그라운드로 돌아올 때(visibilitychange)' }],
  },
  newusers: {
    title: '신규 유입',
    aggregation: '선택한 기간 동안 처음으로 app_opened를 발생시킨 고유 사용자(=PostHog 기준 First Time) 수.',
    events: [{ name: 'app_opened', trigger: '이 사람의 첫 이벤트가 app_opened인 경우' }],
    notes: 'channel 속성(pwa/toss)으로 나누면 유입 추이 차트의 두 시리즈가 된다.',
  },
  activation: {
    title: '활성화율',
    aggregation: "첫 세션($session_id) 안에서 menu_confirmed가 1회 이상 발생한 사용자 비율 = 활성화 사용자 수 ÷ 신규 유입 수.",
    events: [
      { name: 'app_opened', trigger: '세션 시작 판단 기준' },
      { name: 'menu_confirmed', trigger: "그 세션 안에서 슬롯 결과를 '선택'했는지 여부" },
    ],
    notes: '재방문(리텐션) 커브의 activated/notActivated 코호트를 가르는 기준과 동일하다.',
  },
  s2c: {
    title: 'Spin→Confirm 전환율',
    aggregation: '기간 내 menu_confirmed 발생 세션 수 ÷ menu_spun 발생 세션 수.',
    events: [
      { name: 'menu_spun', trigger: "'돌리기' 버튼을 눌러 슬롯이 실제로 돌 때", properties: ['pool_size', 'excluded_count', 'spin_index', 'group', 'exclude_on'] },
      { name: 'menu_confirmed', trigger: "결과를 '선택'해서 담을 때", properties: ['menu_name', 'categories', 'group', 'spins_before_confirm'] },
    ],
    notes: '룰렛 핵심 사용 섹션의 세션→스핀→확정 퍼널과 같은 두 이벤트를 쓴다.',
  },
  push: {
    title: '알림 재유입률',
    aggregation: "app_reengaged(source=push) 세션 수 ÷ 전체 세션(app_opened) 수. 알림을 눌러 돌아온 비율.",
    events: [
      { name: 'app_reengaged', trigger: '알림을 눌러 이미 열려있던 창이 포커스만 받을 때(sw.js → postMessage)', properties: ['source'] },
    ],
    notes: 'URL에 ?entry=push가 붙어 새로 열린 경우는 app_opened 쪽에서 entry 속성(super property)으로 잡히고, 이미 열려 있던 창이 포커스만 받는 경우만 이 이벤트가 별도로 필요하다.',
  },
  stickiness: {
    title: 'DAU/WAU 점착도',
    aggregation: '(오늘 app_opened 고유 사용자 수) ÷ (최근 7일 app_opened 고유 사용자 수).',
    events: [{ name: 'app_opened', trigger: '앱 로드 + 포그라운드 복귀' }],
    notes: '숫자가 높을수록 "매일 쓰는" 습관형 사용자 비중이 크다는 뜻.',
  },

  // ── 유입(획득) ──
  newUsersTrend: {
    title: '채널별 신규 유입 추세',
    aggregation: '일자별 app_opened의 First Time 사용자 수를 channel 속성(pwa/toss)으로 나눠 집계.',
    events: [{ name: 'app_opened', trigger: '앱 최초 로드' }],
    personProperties: ['channel'],
    notes: 'channel은 지금 URL의 ?channel= 파라미터가 없으면 항상 "pwa"다. 앱인토스 WebView 연동 시 그 안내가 ?channel=toss를 붙이도록 한 줄만 추가하면 toss 시리즈가 실데이터로 채워진다(index.html PH_CHANNEL 참고).',
  },
  entryShares: {
    title: '유입 경로 구성',
    aggregation: '기간 내 세션을 entry 속성(direct/utm/push/room/install) 값별로 묶어 세션 수 비교.',
    events: [{ name: 'app_opened', trigger: '세션 시작 시 entry가 함께 실림(super property)' }],
    notes:
      'entry 판정 순서: URL에 entry=push면 push, room=CODE가 있으면 room, utm_* 파라미터가 있으면 utm, 참조 URL 없이 standalone(홈 화면 설치) 상태면 install, 나머지는 direct(index.html phClassifyEntry 참고).',
  },
  sources: {
    title: '유입 소스 (UTM)',
    aggregation: 'PostHog가 자동 수집하는 $utm_source/$utm_medium/$utm_campaign 별로 신규 유입·활성화율 집계.',
    events: [{ name: 'app_opened', trigger: 'UTM 파라미터가 붙은 링크로 처음 들어왔을 때' }],
    notes: '활성화율 열은 위 activation KPI와 같은 정의를 이 소스 세그먼트에만 적용한 것.',
  },

  // ── 재방문(재참여) ──
  retentionCurve: {
    title: '주간 리텐션 곡선',
    aggregation: 'PostHog Retention 인사이트 — app_opened를 시작 이벤트/복귀 이벤트로 두고, activated(첫 세션 내 menu_confirmed 있음) vs notActivated 두 코호트로 나눠 비교.',
    events: [
      { name: 'app_opened', trigger: '시작·복귀 판단' },
      { name: 'menu_confirmed', trigger: '코호트를 activated/notActivated로 가르는 기준' },
    ],
  },
  resurrectedUsers: {
    title: '부활 사용자 (30일+)',
    aggregation: 'user_resurrected 이벤트가 발생한 고유 사용자 수(기간 내).',
    events: [
      { name: 'user_resurrected', trigger: '로그인 성공 시, 이 사람의 마지막 로그인이 30일 이상 전이었을 때만 발화', properties: ['days_since_last_login'] },
    ],
    notes: '로그인(계정) 기준이라 로그인 안 하고 쓰는 사용자의 부활은 잡지 못한다 — 순수 방문 기준 부활은 app_opened의 리텐션 인사이트로 별도 확인 필요.',
  },
  byEntryRetention: {
    title: '유입 경로별 D7 리텐션',
    aggregation: '유입 시점 entry 값별로 세그먼트를 나눈 뒤, 각 세그먼트의 7일 리텐션(Retention 인사이트)을 비교.',
    events: [{ name: 'app_opened', trigger: '유입 시 entry 세그먼트 결정 + 7일 뒤 복귀 여부 판단' }],
  },

  // ── 룰렛 핵심 사용 ──
  funnel: {
    title: '세션 → 스핀 → 확정 퍼널',
    aggregation: 'PostHog Funnel 인사이트: app_opened → menu_spun → menu_confirmed 3단계, 각 단계를 거친 고유 사용자 수.',
    events: [
      { name: 'app_opened', trigger: '세션 시작' },
      { name: 'menu_spun', trigger: '슬롯을 돌림', properties: ['spin_index'] },
      { name: 'menu_confirmed', trigger: '결과를 확정', properties: ['spins_before_confirm'] },
    ],
  },
  spinDepth: {
    title: '스핀 깊이 분포',
    aggregation: 'menu_confirmed 이벤트의 spins_before_confirm 속성값을 1회/2회/3회/4회/5회+로 구간화해서 세션 수 집계.',
    events: [{ name: 'menu_confirmed', trigger: '결과 확정 시점의 누적 스핀 횟수', properties: ['spins_before_confirm'] }],
  },
  respinRate: {
    title: '재돌림율',
    aggregation: 'menu_confirmed 중 spins_before_confirm > 1인 비율 — 처음 나온 결과를 바로 받아들이지 않고 최소 1번 더 돌린 세션의 비율.',
    events: [{ name: 'menu_confirmed', trigger: '결과 확정', properties: ['spins_before_confirm'] }],
    notes: '가드레일 지표 — 너무 높으면 첫 결과 품질(후보 필터링 등)에 문제가 있다는 신호일 수 있음.',
  },
  weeklyDecisionFreq: {
    title: '주당 결정 빈도',
    aggregation: '사용자 1인당 menu_confirmed 발생 횟수 ÷ 활성 주(週) 수의 평균.',
    events: [{ name: 'menu_confirmed', trigger: '결과 확정' }],
  },

  // ── 기능 채택 ──
  featureAdoption: {
    title: '기능 채택 매트릭스',
    aggregation: '각 기능마다 지정된 person property가 true로 설정된 사용자 비율(채택률) × 그 코호트와 나머지의 W2 리텐션 차이(리프트).',
    events: [
      { name: 'pwa_installed', trigger: '홈 화면 설치 완료(appinstalled)' },
      { name: 'push_subscribed / notify_toggled', trigger: '알림을 켬' },
      { name: 'room_created / room_joined', trigger: "'함께 정하기' 방을 만들거나 들어감" },
      { name: 'group_added', trigger: '그룹을 추가함' },
      { name: 'menu_deleted / menu_reordered', trigger: '메뉴를 삭제하거나 순서를 바꿈' },
      { name: 'dislike_added / exclude_used', trigger: '못 먹는 음식 등록 또는 중복 제외 옵션 사용' },
      { name: 'favorite_toggled', trigger: '즐겨찾기 별표를 켬' },
      { name: 'history_viewed', trigger: '히스토리 탭을 봄' },
      { name: 'stats_viewed', trigger: '통계 서브탭을 봄' },
      { name: 'calendar_date_viewed', trigger: '캘린더에서 날짜를 클릭함' },
      { name: 'menu_searched', trigger: '메뉴 검색창에 입력 후 600ms 정지(디바운스)' },
      { name: 'today_copied', trigger: "오늘 후보를 '복사'함" },
      { name: 'signed_up / logged_in / sync_completed', trigger: '계정을 만들거나 로그인하거나 클라우드 동기화가 끝남' },
    ],
    personProperties: [
      'installed', 'notify_enabled', 'uses_rooms', 'uses_groups', 'edited_menus',
      'uses_dislikes', 'uses_favorites', 'uses_history', 'uses_stats', 'uses_calendar',
      'uses_search', 'uses_copy', 'has_account', 'uses_sync',
    ],
    notes: '13개 행 각각이 위 person property 중 하나가 true인 사람들의 비율이다 — 표의 "기능" 열 이름이 property 이름과 거의 1:1로 대응한다(예: 즐겨찾기 행 = uses_favorites).',
  },

  // ── 바이럴 ──
  viralityTrend: {
    title: '룸 생성 → 입장 추세',
    aggregation: '일자별 room_created / room_joined 이벤트 발생 건수.',
    events: [
      { name: 'room_created', trigger: '방장이 새 방을 만들 때' },
      { name: 'room_joined', trigger: '초대 링크로 들어와 방에 실제 입장했을 때' },
    ],
  },
  kFactor: {
    title: 'K-factor',
    aggregation: '고유 room_joined 사용자 수 ÷ 고유 room_created 사용자 수 — 방을 만든 사람 1명이 평균 몇 명을 데려오는지.',
    events: [
      { name: 'room_created', trigger: '방 생성' },
      { name: 'room_joined', trigger: '초대받은 사람의 입장' },
    ],
  },
  inviteConversion: {
    title: '초대 전환율',
    aggregation: 'room_joined 건수 ÷ room_created 건수(방 하나당 평균 몇 명이 실제로 들어왔는지의 근사치).',
    events: [
      { name: 'room_created', trigger: '방 생성' },
      { name: 'room_joined', trigger: '입장' },
    ],
    notes: '카카오톡 공유 시점을 잡는 별도의 "초대 발송" 이벤트는 없다 — 그래서 "보낸 초대 대비 클릭률"이 아니라 "만든 방 대비 입장 수"로 근사한다.',
  },
  roomCohortRetentionLift: {
    title: '룸 코호트 리텐션 리프트',
    aggregation: 'uses_rooms=true 코호트의 W2 리텐션 − 전체 평균 W2 리텐션.',
    events: [{ name: 'room_created / room_joined', trigger: '함께 정하기 사용(person property uses_rooms를 true로 설정)' }],
  },

  // ── 채널 비교 ──
  channelsCompare: {
    title: '채널 비교 (PWA vs 앱인토스)',
    aggregation: '위 각 지표(WAU·활성화율·Spin→Confirm·W2 리텐션·주당 결정 빈도)를 channel 속성(pwa/toss)으로 나눠 같은 기간에 다시 계산.',
    events: [{ name: '(여러 이벤트 공통)', trigger: '모든 이벤트에 channel super property가 함께 실린다(posthog.register)' }],
    notes: '앱인토스 입점 전까지는 channel이 항상 "pwa"라 toss 열은 아직 실데이터가 없다 — mock에만 있는 예시 값.',
  },
}
