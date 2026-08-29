/*
 * '컴포넌트' 탭에서 iframe(srcDoc)에 그대로 꽂아 넣는 라이브 프리뷰 HTML.
 * 모먹지 앱(index.html)의 실제 컴포넌트 CSS를 그대로 발췌해서 쓴다 — 그래서
 * 여기서 그려지는 버튼·칩·토글은 이 대시보드의 디자인이 아니라 모먹지 앱
 * 그 자체의 디자인이다.
 *
 * iframe으로 격리하는 이유: 모먹지 앱은 .btn·.chip·.card처럼 아주 짧은
 * 클래스 이름을 쓰는데, 이 대시보드는 Tailwind + shadcn 계열이라 같은
 * 이름이 우연히 다른 뜻으로 이미 쓰이고 있을 수 있다. 같은 문서에 두 CSS를
 * 섞으면 클래스가 서로의 스타일을 덮어써 버릴 위험이 있어, 아예 별개
 * document(iframe)로 완전히 분리한다.
 *
 * 모먹지 앱은 다크모드가 없다 — 그래서 이 프리뷰는 이 대시보드의 다크/라이트
 * 토글과 무관하게 항상 라이트로 고정한다(실제 앱 화면과 다르게 보이면
 * 오히려 오해를 만든다).
 */

const PREVIEW_HEAD = `
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 20px; background: #fff; color: #2e3137;
    font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24; line-height: 1; vertical-align: middle; }

  /* ---- index.html에서 그대로 발췌한 컴포넌트 CSS ---- */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex-shrink: 0; padding: 12px 22px; font-size: 16px; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; white-space: nowrap; font-family: inherit; }
  .btn .material-symbols-rounded { font-size: 20px; }
  .btn:disabled { opacity: .35; }
  .btn-primary { background: #000; color: #fff; }
  .btn-brand { background: #FF5A2C; color: #fff; }
  .btn-outline { background: #fff; color: #000; border: 1.5px solid #000; }
  .btn-soft { background: #f8f9fa; color: #2e3137; }
  .btn-ghost { background: none; border: 1px solid #dfe3e6; color: #6d7583; }
  .btn-sm { padding: 8px 15px; font-size: 14px; }
  .btn-sm .material-symbols-rounded { font-size: 18px; }
  .btn-xs { padding: 7px 11px; font-size: 12px; gap: 5px; }
  .btn-pill { border-radius: 100px; }
  .btn.is-on { background: #000; color: #fff; }

  .icon-btn { display: inline-flex; align-items: center; justify-content: center; border: 1px solid #dfe3e6; background: #fff; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; color: #2e3137; }
  .icon-btn .material-symbols-rounded { font-size: 20px; }
  .icon-btn.active { background: #000; border-color: #000; color: #fff; }

  .chip, .cat-tab, .cat-choice, .member-chip { display: inline-flex; align-items: center; cursor: pointer; border-radius: 100px; background: #fff; }
  .chip { gap: 6px; min-height: 40px; padding: 0 16px; border: 1.5px solid #dfe3e6; }
  .chip .chip-label { font-size: 14px; font-weight: 700; color: #2e3137; }
  .chip.on { border-color: #c8c8c8; background: #ececec; }
  .cat-tab { min-height: 34px; padding: 7px 14px; border: 1px solid #dfe3e6; font-size: 13px; font-weight: 700; color: #6d7583; gap: 6px; }
  .cat-tab.active { background: #000; border-color: #000; color: #fff; }
  .cat-tab .tab-dot { width: 9px; height: 9px; border-radius: 999px; background: #e17055; }
  .member-chip { font-size: 12px; padding: 4px 9px; border: 1.5px solid #dfe3e6; color: #6d7583; }
  .member-chip.on { color: #fff; background: #6c5ce7; border-color: transparent; }

  .switch { position: relative; display: inline-block; width: 46px; height: 28px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .switch .slider { position: absolute; inset: 0; background: #d4d4d4; border-radius: 999px; transition: background .2s; }
  .switch .slider::before { content: ""; position: absolute; width: 22px; height: 22px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .switch input:checked + .slider { background: #000; }
  .switch input:checked + .slider::before { transform: translateX(18px); }

  .dow-chip { min-width: 0; height: 38px; padding: 0 12px; border: 1.5px solid #dfe3e6; border-radius: 10px; background: #fff; font-size: 13px; font-weight: 700; color: #6d7583; cursor: pointer; font-family: inherit; }
  .dow-chip.on { background: #000; border-color: #000; color: #fff; }

  .fb-type { padding: 12px 14px; border: 1.5px solid #dfe3e6; border-radius: 11px; background: #fff; font-size: 13px; font-weight: 700; color: #6d7583; cursor: pointer; text-align: center; }
  .fb-type.active { border-color: #000; background: #000; color: #fff; }

  .pf-card-demo { background: #fff; border: 1px solid #dfe3e6; border-radius: 16px; padding: 6px 4px; max-width: 340px; }
  .pf-nav-row-demo { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 12px 14px; border: none; background: none; cursor: pointer; text-align: left; font-size: 15px; font-weight: 700; color: #2e3137; border-radius: 12px; font-family: inherit; }
  .pf-nav-row-demo > .material-symbols-rounded:first-child { font-size: 22px; color: #6d7583; }
  .pf-nav-row-demo .pf-nav-main { display: flex; flex-direction: column; gap: 2px; flex: 1; text-align: left; }
  .pf-nav-row-demo .pf-nav-title { font-size: 15px; font-weight: 700; color: #2e3137; }
  .pf-nav-row-demo .pf-nav-sub { font-size: 12px; color: #969fac; }
  .pf-nav-row-demo .pf-chev { font-size: 20px; color: #969fac; margin-left: auto; }

  .toast-demo { display: inline-flex; background: #2e3137; color: #fff; padding: 11px 18px; border-radius: 999px; font-size: 13px; font-weight: 700; }

  .room-entry-row-demo { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #dfe3e6; border-radius: 10px; max-width: 340px; }
  .room-entry-row-demo.is-winner { border-color: #000; background: #fafafa; }
  .room-entry-row-demo .re-name { font-weight: 700; font-size: 14px; }
  .room-entry-row-demo .re-menu { margin-left: auto; font-size: 13px; color: #6d7583; }
  .room-code-demo { font-family: ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 0.08em; font-weight: 700; }

  .dialog-demo { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #dfe3e6; max-width: 300px; }
  .dialog-demo h3 { font-size: 17px; font-weight: 800; margin: 0 0 6px; color: #2e3137; }
  .dialog-demo p { font-size: 13px; color: #6d7583; margin: 0; }

  /* ---- 이 프리뷰 문서 자체의 레이아웃(모먹지 앱 CSS와는 무관) ---- */
  .grp { border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .grp:last-child { margin-bottom: 0; }
  .grp-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .grp-name { font-size: 13px; font-weight: 800; color: #18181b; }
  .grp-classes { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11px; color: #71717a; }
  .grp-body { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .grp-note { font-size: 12px; color: #52525b; margin-top: 14px; line-height: 1.6; border-top: 1px solid #f4f4f5; padding-top: 12px; }
</style>
`

/** 컴포넌트 프리뷰 전체 문서를 하나의 HTML 문자열로 만든다(iframe srcDoc에 그대로 넣음). */
export function buildComponentPreviewHtml(): string {
  const body = `
    <div class="grp">
      <div class="grp-head"><span class="grp-name">버튼</span><span class="grp-classes">.btn + 변형 + 크기 + 모양 + 상태</span></div>
      <div class="grp-body">
        <button class="btn btn-primary"><span class="material-symbols-rounded">check</span>Primary</button>
        <button class="btn btn-brand"><span class="material-symbols-rounded">casino</span>Brand</button>
        <button class="btn btn-outline">Outline</button>
        <button class="btn btn-soft">Soft</button>
        <button class="btn btn-ghost">Ghost</button>
        <button class="btn btn-primary btn-sm">Sm</button>
        <button class="btn btn-soft btn-xs">Xs</button>
        <button class="btn btn-outline btn-pill">Pill</button>
        <button class="btn btn-outline is-on">Is-on</button>
        <button class="btn btn-primary" disabled>Disabled</button>
      </div>
      <div class="grp-note">변형 5종(primary/brand/outline/soft/ghost) × 크기 3종 × 모양(pill) × 상태(is-on/done) 조합. brand는 앱 전체에서 3곳에만 씁니다.</div>
    </div>

    <div class="grp">
      <div class="grp-head"><span class="grp-name">칩 계열</span><span class="grp-classes">.chip / .cat-tab / .member-chip 등 — pill 골격 공유</span></div>
      <div class="grp-body">
        <span class="chip"><span class="chip-label">즐겨찾기</span></span>
        <span class="chip on"><span class="chip-label">선택됨</span></span>
        <span class="cat-tab active">전체<span style="opacity:.7;">107</span></span>
        <span class="cat-tab"><span class="tab-dot"></span>한식</span>
        <span class="member-chip on">엄마</span>
        <span class="member-chip">아빠</span>
      </div>
      <div class="grp-note">서로 다른 5개 클래스가 "둥근 pill + 흰 배경" 골격 하나를 공유하고, 크기·테두리 굵기·색만 개별 지정합니다.</div>
    </div>

    <div class="grp">
      <div class="grp-head"><span class="grp-name">아이콘 버튼 / 토글 스위치</span><span class="grp-classes">.icon-btn · .switch</span></div>
      <div class="grp-body">
        <button class="icon-btn"><span class="material-symbols-rounded">edit</span></button>
        <button class="icon-btn active"><span class="material-symbols-rounded">settings</span></button>
        <label class="switch"><input type="checkbox"><span class="slider"></span></label>
        <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
      </div>
    </div>

    <div class="grp">
      <div class="grp-head"><span class="grp-name">프로필 리스트 행</span><span class="grp-classes">.pf-card · .pf-nav-row (2줄: 제목+부제)</span></div>
      <div class="pf-card-demo">
        <button class="pf-nav-row-demo">
          <span class="material-symbols-rounded">notifications</span>
          <span class="pf-nav-main"><span class="pf-nav-title">푸시알림</span><span class="pf-nav-sub">매일 오후 6:30</span></span>
          <span class="material-symbols-rounded pf-chev">chevron_right</span>
        </button>
      </div>
      <div class="grp-note">프로필 탭 전용 행 컴포넌트. 뎁스 이동(하위 화면)이 필요한 항목에 씁니다.</div>
    </div>

    <div class="grp">
      <div class="grp-head"><span class="grp-name">요일 칩 / 라디오 카드</span><span class="grp-classes">.dow-chip · .fb-type</span></div>
      <div style="display:flex; gap:6px; margin-bottom:14px;">
        <button class="dow-chip on">월</button><button class="dow-chip on">화</button><button class="dow-chip">수</button><button class="dow-chip">목</button><button class="dow-chip">금</button><button class="dow-chip">토</button><button class="dow-chip">일</button>
      </div>
      <div style="display:flex; gap:8px; max-width:320px;">
        <button class="fb-type active" style="flex:1;">새로운 기능이<br>필요해요</button>
        <button class="fb-type" style="flex:1;">버그를<br>발견했어요</button>
      </div>
      <div class="grp-note">fb-type은 시각적으로는 버튼이지만 실제로는 input[type=radio]를 감싼 라디오 — 2택 1만 가능합니다.</div>
    </div>

    <div class="grp">
      <div class="grp-head"><span class="grp-name">함께 정하기 · 참여자 행</span><span class="grp-classes">.room-entry-row</span></div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div class="room-entry-row-demo is-winner"><span class="re-name">나연 (나)</span><span class="re-menu">초밥</span></div>
        <div class="room-entry-row-demo"><span class="re-name">민지</span><span class="re-menu" style="font-style:italic;color:#969fac;">대기중</span></div>
      </div>
      <div class="grp-note">방 코드 표기(<span class="room-code-demo">NHV9BC</span>)만 monospace를 예외적으로 씁니다 — 코드처럼 오독 없이 읽혀야 해서.</div>
    </div>

    <div class="grp">
      <div class="grp-head"><span class="grp-name">토스트 / 다이얼로그</span><span class="grp-classes">.toast · .dialog</span></div>
      <div class="grp-body" style="margin-bottom:14px;">
        <span class="toast-demo">닉네임이 저장됐어요.</span>
      </div>
      <div class="dialog-demo"><h3>로그인이 필요해요</h3><p>그룹을 추가하거나 수정하려면 로그인이 필요해요.</p></div>
    </div>
  `

  return `<!doctype html><html><head>${PREVIEW_HEAD}</head><body>${body}</body></html>`
}
