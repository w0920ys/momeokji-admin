# momeokji-admin

모먹지(점심 메뉴 추첨 PWA) 운영자를 위한 애널리틱스 대시보드입니다.
[adminds 디자인 시스템](https://github.com/w0920ys/adminds-starter) 위에 지어졌고,
관리자 1인(`VITE_ADMIN_EMAIL`)만 로그인할 수 있는 내부 도구입니다.

adminds-starter 자체는 디자인 시스템 컴포넌트 검토용 템플릿/레지스트리이고, 이
저장소는 그 위에 실제로 지은 서비스입니다 — 그래서 별도 저장소·별도 배포
URL로 분리되어 있습니다.

## 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev      # http://localhost:5173
npm run build
npm test
npm run lint
```

## 구성

- `src/pages/` — 로그인/비밀번호 재설정, 홈(전체 추이), 설정(디자인 시스템
  버전, 계정, KPI 알림 규칙) 등 이 서비스만의 화면.
- `src/lib/auth.tsx`, `src/lib/supabase.ts` — Supabase Auth 기반 관리자 전용
  로그인.
- `src/lib/metrics/` — 대시보드 데이터 접근 심(`MetricsSource`). 지금은
  `mock.ts`, PostHog 계측 완료 후 `posthog.ts`로 교체 예정.
- `src/lib/alerts.ts` — KPI 임계값 알림 규칙 평가.
- `src/components/ui/` — adminds 디자인 시스템 컴포넌트(클론 시점의 스냅샷).
  직접 고치지 않는 한, 갱신은 아래 방법으로 받습니다.

## 디자인 시스템 갱신 받기

이 저장소의 `src/components/ui/`, `src/styles/tokens.css`는 adminds-starter의
복사본입니다. 원본이 바뀌어도 저절로 따라오지 않습니다.

```bash
npx shadcn@latest add https://adminds.vercel.app/r/table.json --overwrite   # 컴포넌트 하나
npx shadcn@latest add https://adminds.vercel.app/r/tokens.json --overwrite  # 토큰만
```

이 대시보드를 만들며 새로 짠 차트·레이아웃 컴포넌트(`chart*.tsx`,
`stat-card.tsx`, `trend-badge.tsx`, `app-shell.tsx`, `page-header.tsx`,
`password-input.tsx`)는 아직 레지스트리에 없는, adminds 쪽으로 올려야 할
후보입니다 — 자세한 스펙은 adminds-starter의 `UPSTREAM-COMPONENTS.md` 참고.
올라간 뒤에는 이 저장소의 로컬 사본을 레지스트리 버전으로 교체합니다.
