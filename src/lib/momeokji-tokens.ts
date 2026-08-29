/*
 * 모먹지 앱(별도 저장소 w0920ys/food-rollet의 index.html)에 실제로 적용된
 * 디자인 토큰·컴포넌트 인벤토리. adminds 쪽 design-system.ts가 "이 대시보드가
 * 쓰는 UI 키트의 상태"를 손으로 관리하는 것과 같은 방식으로, 여기서는
 * "관리 대상 서비스(모먹지 앱)의 디자인 시스템 상태"를 손으로 관리한다.
 *
 * 이 파일은 두 저장소를 잇는 자동 파이프라인이 없어 손으로 최신화한다 —
 * index.html의 :root 토큰이나 공통 컴포넌트 CSS가 바뀌면 이 파일도 같이
 * 고쳐야 한다. asOf를 반드시 그날로 갱신할 것.
 */

export const MOMEOKJI_SNAPSHOT = {
  /** 이 스냅샷을 뜬 시점의 모먹지 앱 버전(index.html의 APP_VERSION). */
  appVersion: '1.8',
  /** 이 파일을 마지막으로 index.html과 맞춰 넣은 날짜. */
  asOf: '2026-08-29',
  /** 원본 위치 — 어디를 보고 다시 맞춰야 하는지. */
  sourceRepo: 'w0920ys/food-rollet',
  sourceFile: 'index.html',
  /** 사용자가 부르는 이름과 파일 내부 표기가 달라 둘 다 남긴다. */
  designLanguage: 'Tabling (사용자 호칭: 캐치테이블)',
} as const

export interface ColorToken {
  token: string
  hex: string
  usage: string
}

export interface ColorGroup {
  title: string
  colors: ColorToken[]
}

export const FOUNDATION_COLORS: ColorGroup[] = [
  {
    title: '브랜드',
    colors: [
      { token: '--brand', hex: '#FF5A2C', usage: '로고·강조 CTA 전용, 넓게 칠하지 않음' },
      { token: '--brand-tint', hex: '#fff7eb', usage: '따뜻한 오렌지-크림 틴트 면' },
      { token: '--brand-wash', hex: '#ffece8', usage: '핑크빛 오렌지 워시' },
    ],
  },
  {
    title: '텍스트 / 잉크',
    colors: [
      { token: '--black', hex: '#000000', usage: '헤딩용 순검정' },
      { token: '--ink', hex: '#2e3137', usage: '본문/UI 기본' },
      { token: '--ink-strong', hex: '#131517', usage: '평점 등 강조 수치' },
      { token: '--slate', hex: '#505c81', usage: '구조적 라벨' },
      { token: '--gray-1', hex: '#6d7583', usage: '보조 텍스트' },
      { token: '--gray-2', hex: '#969fac', usage: '3차/플레이스홀더' },
    ],
  },
  {
    title: '면 / 선',
    colors: [
      { token: '--surface', hex: '#ffffff', usage: '카드/캔버스' },
      { token: '--bg', hex: '#f0f0f0', usage: '바깥/섹션 배경' },
      { token: '--soft', hex: '#f8f9fa', usage: '호버·소프트 면' },
      { token: '--chip', hex: '#f0f4ff', usage: '칩/필터 틴트' },
      { token: '--line', hex: '#dfe3e6', usage: '헤어라인/구분선' },
      { token: '--border', hex: '#d7dbdf', usage: '1px 카드 아웃라인' },
      { token: '--danger', hex: '#c62828', usage: '경고·삭제' },
    ],
  },
]

export interface TypeStep {
  token: string
  size: number
  weight: number
  sample: string
}

export const TYPE_SCALE: TypeStep[] = [
  { token: '--fs-hero', size: 24, weight: 700, sample: '히어로 헤딩' },
  { token: '--fs-emphasis', size: 22, weight: 700, sample: '강조 헤드라인' },
  { token: '--fs-section', size: 20, weight: 700, sample: '섹션 제목' },
  { token: '--fs-title', size: 18, weight: 700, sample: '리스트/카드 제목' },
  { token: '--fs-search', size: 16, weight: 600, sample: '검색 입력' },
  { token: '--fs-body', size: 14, weight: 400, sample: '본문/UI 기본' },
  { token: '--fs-rating', size: 13, weight: 700, sample: '평점 값' },
  { token: '--fs-meta', size: 13, weight: 400, sample: '메타데이터' },
  { token: '--fs-badge', size: 12, weight: 700, sample: '배지' },
]

export const SPACING_SCALE: { token: string; px: number }[] = [
  { token: '--sp-xs', px: 4 },
  { token: '--sp-sm', px: 8 },
  { token: '--sp-md', px: 12 },
  { token: '--sp-base', px: 16 },
  { token: '--sp-lg', px: 24 },
  { token: '--sp-xl', px: 40 },
]

export const RADIUS_SCALE: { token: string; label: string; px: number }[] = [
  { token: '--r-xs', label: '4', px: 4 },
  { token: '--r-sm', label: '8', px: 8 },
  { token: '--r-md', label: '12', px: 12 },
  { token: '--r-chip', label: '24', px: 24 },
  { token: '--r-pill', label: '100', px: 28 },
  { token: '--r-full', label: '9999', px: 28 },
]

export interface SemanticToken {
  token: string
  refPrimitive: string
  hex: string
  description: string
}

/** 시맨틱(역할) 토큰 17개 전체 — index.html :root의 SEMANTIC 블록과 1:1. */
export const SEMANTIC_TOKENS: SemanticToken[] = [
  { token: '--text-heading', refPrimitive: '--black', hex: '#000000', description: '헤딩·강조 제목·버튼 라벨' },
  { token: '--text-body', refPrimitive: '--ink', hex: '#2e3137', description: '본문/UI 기본' },
  { token: '--text-secondary', refPrimitive: '--gray-1', hex: '#6d7583', description: '보조 라벨' },
  { token: '--text-muted', refPrimitive: '--gray-2', hex: '#969fac', description: '3차/플레이스홀더' },
  { token: '--text-danger', refPrimitive: '--danger', hex: '#c62828', description: '경고·삭제' },
  { token: '--text-on-fill', refPrimitive: '고정값', hex: '#ffffff', description: '다크/브랜드 배경 위 글자' },
  { token: '--surface-page', refPrimitive: '--bg', hex: '#f0f0f0', description: '페이지/섹션 배경' },
  { token: '--surface-card', refPrimitive: '--surface', hex: '#ffffff', description: '흰 카드' },
  { token: '--surface-subtle', refPrimitive: '--soft', hex: '#f8f9fa', description: '호버·옅은 면' },
  { token: '--surface-brand', refPrimitive: '--brand', hex: '#FF5A2C', description: '돌리기 등 히어로 CTA 전용' },
  { token: '--state-selected', refPrimitive: '--black', hex: '#000000', description: '활성 칩·탭·토글 배경' },
  { token: '--action-primary', refPrimitive: '--black', hex: '#000000', description: '일반 primary 버튼 배경' },
  { token: '--accent-fill', refPrimitive: '--black', hex: '#000000', description: '배지·오늘 점·최종 카드' },
  { token: '--border-default', refPrimitive: '--line', hex: '#dfe3e6', description: '헤어라인/구분선' },
  { token: '--border-strong', refPrimitive: '--black', hex: '#000000', description: '활성·포커스·선택 테두리' },
  { token: '--border-muted', refPrimitive: '--gray-2', hex: '#969fac', description: '점선/호버 옅은 테두리' },
  { token: '--form-accent', refPrimitive: '--black', hex: '#000000', description: '체크박스·라디오 accent-color' },
]

/**
 * 시맨틱 토큰이 실제 index.html에서 var(--token) 형태로 몇 번 참조되는지
 * grep으로 직접 센 값(2026-08-29 기준, v1.8). 하드코딩 색 없이 토큰만으로
 * 얼마나 그려졌는지 보여주는 지표라 이 파일에서만 손으로 관리한다.
 */
export const TOKEN_USAGE: { token: string; count: number }[] = [
  { token: '--text-secondary', count: 50 },
  { token: '--text-muted', count: 41 },
  { token: '--border-default', count: 37 },
  { token: '--border-strong', count: 17 },
  { token: '--surface-subtle', count: 21 },
  { token: '--state-selected', count: 10 },
  { token: '--text-danger', count: 9 },
  { token: '--accent-fill', count: 7 },
  { token: '--form-accent', count: 5 },
  { token: '--action-primary', count: 3 },
  { token: '--surface-brand', count: 3 },
]

export interface UsageHighlight {
  title: string
  body: string
  where?: string[]
}

export const USAGE_HIGHLIGHTS: UsageHighlight[] = [
  {
    title: '브랜드 오렌지는 절제해서 3곳에만',
    body: '"일부만 오렌지, 절제해서" 원칙이 코드에 그대로 지켜지고 있습니다. --surface-brand(.btn-brand)는 앱 전체에서 딱 3개 버튼에만 쓰입니다 — 나머지는 전부 검정(--action-primary) 또는 중립 톤입니다.',
    where: ['슬롯 탭 · 돌리기', '함께 정하기 · 다같이 돌리기!', '홈 배너 · 알림 켜기'],
  },
  {
    title: 'pill 칩 골격 하나를 5개 컴포넌트가 공유',
    body: '즐겨찾기 칩, 카테고리 탭, 카테고리 선택, 그룹 구성원 칩, 그룹 드롭다운 버튼 — 생김새는 다 다르지만 "둥근 pill + 흰 배경" 골격은 CSS 한 규칙(.chip, .cat-tab, .cat-choice, .member-chip, .group-dd-btn)에서만 정의됩니다.',
  },
  {
    title: '"선택됨" 상태는 어디서든 같은 토큰',
    body: '--state-selected 하나가 활성 칩, 활성 탭, 켜진 토글, 방장 표시 등 "지금 선택된/켜진" 상태를 전부 담당합니다(10곳). 지금은 전부 검정이지만 토큰이 분리돼 있어 나중에 이 역할만 다른 색으로 바꿀 수 있습니다.',
  },
]

export const AUDIT_FINDINGS: { summary: string; detail: string }[] = [
  {
    summary: '미사용 레거시 CSS: .account-btn',
    detail:
      '클래스가 정의만 되어 있고 index.html의 HTML 어디에서도 쓰이지 않습니다(이전 계정 버튼 UI가 프로필 탭으로 옮겨가며 남은 것으로 보임). 지우면 코드가 조금 더 깔끔해지지만 화면에는 영향 없습니다.',
  },
]
