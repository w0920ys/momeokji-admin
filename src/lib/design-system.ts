/*
 * adminds는 semver를 붙이는 패키지가 아니라 shadcn 레지스트리
 * (https://adminds.vercel.app)에서 컴포넌트를 그때그때 받아오는 방식이라
 * "버전 몇"이라 부를 만한 공식 숫자가 없다. 그래서 실제로 답이 되는
 * 정보 — 마지막으로 언제 동기화했는지, 이 프로젝트가 원본 대비 뭘
 * 더 얹었는지 — 를 여기서 손으로 관리한다.
 *
 * 업스트림에서 `npx shadcn add .../r/<name>.json --overwrite`로 컴포넌트를
 * 새로 받을 때마다 vendoredAt을 그날로 갱신한다. UPSTREAM-COMPONENTS.md의
 * 10개가 실제로 adminds 본체에 반영되면 localExtensions를 0으로 내린다.
 */
export const DESIGN_SYSTEM = {
  /** adminds-starter 템플릿 자체의 package.json 버전(클론 시점 스냅샷). */
  starterVersion: '0.1.0',
  /** 이 프로젝트가 adminds 컴포넌트를 마지막으로 받아온 날짜. */
  vendoredAt: '2026-08-30',
  /** 레지스트리의 registry:ui 항목 수(원본 규모 참고용, registry.json 기준). */
  upstreamComponentCount: 48,
  /** 원본 대비 이 프로젝트가 로컬로 더 얹었거나(신규) 의도적으로 다르게 유지 중인(diverged) 컴포넌트 수. */
  localExtensions: 10,
  /**
   * 로컬 확장 목록 — UPSTREAM-COMPONENTS.md와 동기화해서 관리.
   * chart·chart-line은 이번 동기화로 정식 버전을 그대로 쓰게 됐고(App.tsx의
   * 차트는 그 위에 우리 Card·MetricInfoButton만 얹어 조합할 뿐 chart.tsx
   * 자체는 안 건드린다), chart-bar-horizontal·chart-bar-vertical·chart-donut·
   * chart-view-select는 정식 chart-bar/chart-pie로 대체돼 폐기했다 — 그래서
   * 이 목록에서 전부 빠졌다. 두 갈래만 남는다: (1) 원본에 아예 없는
   * 컴포넌트 — chart-funnel(원본 6종엔 퍼널이 없다)·stat-card·trend-badge·
   * app-shell·page-header·password-input·metric-info-button·
   * component-preview-frame. (2) 원본에 같은 이름이 있지만 실제 버그
   * 수정/기능이 로컬에만 있어 동기화 때 덮어쓰면 안 되는 것 — card(원본엔
   * 아직 없는 CardAction 유무별 grid 버그 수정), table(원본엔 아직 없는
   * 좁은 화면 가로 스크롤 페이드 힌트).
   */
  localExtensionNames: [
    'chart-funnel',
    'card',
    'table',
    'stat-card',
    'trend-badge',
    'app-shell',
    'page-header',
    'password-input',
    'metric-info-button',
    'component-preview-frame',
  ],
} as const
