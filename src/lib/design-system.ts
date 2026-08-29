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
  vendoredAt: '2026-08-29',
  /** 레지스트리의 registry:ui 항목 수(원본 규모 참고용, registry.json 기준). */
  upstreamComponentCount: 40,
  /** 원본 대비 이 프로젝트가 로컬로 더 얹은 컴포넌트 수(아직 업스트림 미반영). */
  localExtensions: 10,
  /** 로컬 확장 목록 — UPSTREAM-COMPONENTS.md와 동기화해서 관리. */
  localExtensionNames: [
    'chart',
    'chart-line',
    'chart-bar-horizontal',
    'chart-bar-vertical',
    'chart-funnel',
    'chart-donut',
    'stat-card',
    'trend-badge',
    'app-shell',
    'page-header',
  ],
} as const
