import { PREVIEW_HEAD } from '@/lib/momeokji-preview-html'

/*
 * 이벤트 카탈로그 상세 패널에서 "이 이벤트, 실제 화면 어디서 나요?"에
 * 답하는 미리보기. 픽셀 그대로의 스크린샷은 아니다 — 이 대시보드
 * 실행 환경에는 화면 캡처를 파일로 남길 방법이 없고, 있었더라도
 * index.html이 바뀔 때마다 캡처를 다시 찍어야 해서 정적 자산으로는
 * 금방 낡는다. 대신 momeokji-preview-html.ts와 같은 방식 — 모먹지
 * 앱의 실제 CSS 클래스(.btn/.group-dd/.menu-item/.nav-btn 등)를 그대로
 * 발췌해 iframe에 그려서, "이 이벤트가 실제로 붙어 있는 그 컴포넌트"를
 * 눈으로 확인할 수 있게 한다. 발생 지점은 주황 점선 테두리 + 이벤트명
 * 라벨로 표시한다.
 *
 * 화면을 이벤트 36개만큼 잘게 쪼개지 않고 11개 화면 그룹으로 묶었다 —
 * 예를 들어 menu_result_shown과 menu_confirmed는 같은 "돌리기 결과"
 * 화면 위 서로 다른 두 요소일 뿐이라 화면 하나에 라벨 두 개를 얹는
 * 편이, 똑같은 화면을 두 번 그리는 것보다 실제 위치 관계도 더 잘
 * 보여준다. EventCatalogEntry.screen이 이 키를 가리킨다.
 */
export type EventScreenKey =
  | 'home'
  | 'spin-result'
  | 'today-list'
  | 'menu-list'
  | 'menu-list-edit'
  | 'calendar'
  | 'group-manage'
  | 'notify-install'
  | 'auth'
  | 'feedback'
  | 'room'

const EXTRA_CSS = `
  .phone { max-width: 340px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 20px; padding: 14px 14px 70px; position: relative; background: #fff; }
  .ev-mark { position: relative; display: inline-block; outline: 2.5px dashed #ff5a2c; outline-offset: 3px; border-radius: 10px; }
  .ev-mark-block { position: relative; display: block; outline: 2.5px dashed #ff5a2c; outline-offset: 3px; border-radius: 10px; }
  .ev-mark::after, .ev-mark-block::after {
    content: attr(data-label); position: absolute; left: 0; top: -23px; background: #ff5a2c; color: #fff;
    font: 700 10px ui-monospace, "SF Mono", Menlo, monospace; padding: 2px 7px; border-radius: 6px; white-space: nowrap; z-index: 5;
  }

  .m-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
  .m-logo { width: 26px; height: 26px; border-radius: 8px; background: #FF5A2C; }
  .group-dd-btn { display: inline-flex; align-items: center; gap: 2px; min-height: 36px; padding: 6px 8px 6px 13px; border: 1.5px solid #dfe3e6; border-radius: 100px; font-size: 13px; font-weight: 700; color: #2e3137; background: #fff; }
  .group-dd-btn .material-symbols-rounded { font-size: 18px; color: #6d7583; }

  .notify-banner { background: #fff5f0; border: 1px solid #ffd9c7; border-radius: 14px; padding: 12px; margin-bottom: 14px; }
  .notify-banner-row { display: flex; align-items: flex-start; gap: 8px; }
  .notify-banner-row .material-symbols-rounded:first-child { color: #FF5A2C; font-size: 20px; }
  .notify-banner-text b { display: block; font-size: 13px; font-weight: 800; color: #2e3137; }
  .notify-banner-text span { font-size: 11px; color: #6d7583; }

  .slot-card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 14px; }
  .slot-result { font-size: 20px; font-weight: 800; color: #2e3137; margin: 10px 0; }
  .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border: 1px solid #dfe3e6; border-radius: 12px; font-size: 12px; color: #2e3137; }

  .menu-item { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border: 1px solid #dfe3e6; border-radius: 10px; margin-bottom: 6px; }
  .menu-item .name { flex: 1; font-size: 13px; font-weight: 600; color: #2e3137; display: flex; align-items: center; gap: 6px; }
  .fav-star { color: #d4d4d4; font-size: 18px; }
  .fav-star.on { color: #FFB800; }
  .search-input { width: 100%; padding: 10px 12px; border: 1.5px solid #dfe3e6; border-radius: 10px; font-size: 13px; color: #969fac; margin-bottom: 10px; }
  .row-actions { display: flex; gap: 4px; margin-left: auto; }

  .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #969fac; }
  .nav-btn.active { color: #2e3137; }
  .nav-btn .material-symbols-rounded { font-size: 20px; }
  .bottom-nav-demo { display: flex; border-top: 1px solid #dfe3e6; padding-top: 10px; margin-top: 14px; position: absolute; left: 14px; right: 14px; bottom: 14px; }

  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 10px; }
  .cal-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; border-radius: 8px; color: #6d7583; }
  .cal-cell.has-data { background: #fff0e9; color: #FF5A2C; font-weight: 700; }
  .sub-tab-row { display: flex; gap: 6px; margin-bottom: 12px; }
  .sub-tab { padding: 6px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; color: #6d7583; border: 1px solid #dfe3e6; }
  .sub-tab.active { background: #000; color: #fff; border-color: #000; }

  .grp-card-demo { border: 1px solid #dfe3e6; border-radius: 12px; padding: 12px; margin-bottom: 8px; }
  .grp-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .grp-card-title { font-size: 13px; font-weight: 800; color: #2e3137; }
  .accordion-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6d7583; padding: 6px 0; }

  .pf-row { display: flex; align-items: center; gap: 10px; padding: 11px 4px; font-size: 13px; font-weight: 700; color: #2e3137; }
  .pf-row .material-symbols-rounded:first-child { color: #6d7583; font-size: 19px; }
  .pf-row .pf-sub { font-size: 11px; font-weight: 500; color: #969fac; }

  .auth-field { margin-bottom: 10px; }
  .auth-field label { display: block; font-size: 11px; font-weight: 700; color: #6d7583; margin-bottom: 4px; }
  .auth-field input { width: 100%; padding: 10px 12px; border: 1.5px solid #dfe3e6; border-radius: 10px; font-size: 13px; color: #2e3137; }

  .room-code-badge { display: inline-block; font-family: ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 0.08em; font-weight: 800; font-size: 15px; background: #f8f9fa; padding: 6px 12px; border-radius: 8px; }
`

function shell(title: string, body: string): string {
  return `<!doctype html><html><head>${PREVIEW_HEAD}<style>${EXTRA_CSS}</style></head><body><div class="phone"><div class="m-header"><span class="m-logo"></span><span style="font-size:12px;font-weight:800;color:#969fac;">${title}</span></div>${body}</div></body></html>`
}

const SCREENS: Record<EventScreenKey, () => string> = {
  home: () =>
    shell(
      '슬롯 (홈)',
      `
      <div class="notify-banner"><div class="notify-banner-row"><span class="material-symbols-rounded">notifications_active</span><div class="notify-banner-text"><b>퇴근 시간 알림을 받아보세요</b><span>오늘 뭐 먹을지 깜빡하지 않게 알려드려요</span></div></div></div>
      <div style="margin-bottom:14px;"><span class="ev-mark" data-label="group_switched"><button class="group-dd-btn">남자친구랑 먹을래<span class="material-symbols-rounded">expand_more</span></button></span></div>
      <div class="slot-card">
        <div style="font-size:13px;color:#969fac;">후라이드</div>
        <div class="slot-result">돌려라!</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <span class="ev-mark" data-label="menu_spun"><button class="btn btn-brand"><span class="material-symbols-rounded">casino</span>돌리기</button></span>
          <button class="btn btn-outline" disabled>선택</button>
        </div>
      </div>
      <span class="ev-mark-block" data-label="exclude_used"><div class="switch-row"><span>이미 나온 메뉴는 다음 슬롯에서 제외</span><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div></span>
      <div class="bottom-nav-demo">
        <span class="nav-btn active"><span class="material-symbols-rounded">casino</span>슬롯</span>
        <span class="nav-btn"><span class="material-symbols-rounded">restaurant_menu</span>메뉴</span>
        <span class="nav-btn"><span class="material-symbols-rounded">insights</span>분석</span>
        <span class="nav-btn"><span class="material-symbols-rounded">person</span>프로필</span>
      </div>
    `,
    ),

  'spin-result': () =>
    shell(
      '슬롯 — 돌린 직후',
      `
      <div class="slot-card">
        <div style="font-size:13px;color:#969fac;">결과</div>
        <span class="ev-mark" data-label="menu_result_shown"><div class="slot-result">양념치킨</div></span>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button class="btn btn-soft"><span class="material-symbols-rounded">casino</span>다시 돌리기</button>
          <span class="ev-mark" data-label="menu_confirmed"><button class="btn btn-brand"><span class="material-symbols-rounded">add_task</span>선택</button></span>
        </div>
      </div>
      <div class="grp-note" style="font-size:11px;color:#969fac;">spin_index·spins_before_confirm처럼 "몇 번째 시도인지"를 같이 실어 재돌림 패턴을 분석합니다.</div>
    `,
    ),

  'today-list': () =>
    shell(
      '분석 — 오늘 뭐 먹지',
      `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:800;">오늘 뭐 먹지</span>
        <span class="ev-mark" data-label="today_copied"><button class="icon-btn"><span class="material-symbols-rounded">content_copy</span></button></span>
      </div>
      <span class="ev-mark-block" data-label="menu_reordered">
        <div class="menu-item"><span class="material-symbols-rounded" style="color:#c4c4c4;">drag_indicator</span><span class="name">점심 · 초밥</span></div>
        <div class="menu-item"><span class="material-symbols-rounded" style="color:#c4c4c4;">drag_indicator</span><span class="name">저녁 · 파스타</span></div>
      </span>
      <div class="grp-note" style="font-size:11px;color:#969fac;margin-top:8px;">순서를 드래그로 바꾸면 즉시 발생 (edited_menus person property 동반).</div>
    `,
    ),

  'menu-list': () =>
    shell(
      '메뉴 — 목록',
      `
      <span class="ev-mark" data-label="menu_searched"><input class="search-input" placeholder="메뉴 검색" value="치킨" readonly /></span>
      <div class="sub-tab-row">
        <span class="sub-tab active">전체 107</span>
        <span class="sub-tab">한식</span>
        <span class="sub-tab">중식</span>
      </div>
      <div class="menu-item"><span class="material-symbols-rounded fav-star on">star</span><span class="name">양념치킨</span></div>
      <span class="ev-mark-block" data-label="favorite_toggled"><div class="menu-item"><span class="material-symbols-rounded fav-star">star</span><span class="name">초밥</span></div></span>
      <span class="ev-mark-block" data-label="menu_added" style="margin-top:8px;">
        <div class="menu-item" style="border-style:dashed;color:#969fac;"><span class="material-symbols-rounded">add</span><span class="name">새 메뉴 이름 입력…</span></div>
      </span>
    `,
    ),

  'menu-list-edit': () =>
    shell(
      '메뉴 — 편집 모드',
      `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:800;">전체 107개</span>
        <div style="display:flex;gap:6px;">
          <span class="ev-mark" data-label="category_added"><button class="btn-ghost btn btn-xs">카테고리 관리</button></span>
          <span class="ev-mark" data-label="edit_mode_toggled"><button class="icon-btn active"><span class="material-symbols-rounded">edit</span></button></span>
        </div>
      </div>
      <span class="ev-mark-block" data-label="menu_deleted">
        <div class="menu-item"><span class="name">양념치킨</span><span class="row-actions"><button class="icon-btn" style="width:28px;height:28px;color:#e74c3c;"><span class="material-symbols-rounded" style="font-size:16px;">close</span></button></span></div>
      </span>
      <div class="grp-note" style="font-size:11px;color:#969fac;margin-top:8px;">category_deleted는 같은 "카테고리 관리" 팝업 안 삭제 아이콘에서 발생합니다.</div>
    `,
    ),

  calendar: () =>
    shell(
      '분석 — 캘린더 / 통계',
      `
      <span class="ev-mark" data-label="tab_switched · history_viewed">
        <div class="bottom-nav-demo" style="position:static;border-top:none;padding-top:0;margin-top:0;margin-bottom:12px;">
          <span class="nav-btn"><span class="material-symbols-rounded">casino</span>슬롯</span>
          <span class="nav-btn"><span class="material-symbols-rounded">restaurant_menu</span>메뉴</span>
          <span class="nav-btn active"><span class="material-symbols-rounded">insights</span>분석</span>
          <span class="nav-btn"><span class="material-symbols-rounded">person</span>프로필</span>
        </div>
      </span>
      <span class="ev-mark" data-label="stats_viewed"><span class="sub-tab-row"><span class="sub-tab">캘린더</span><span class="sub-tab active">통계</span></span></span>
      <div class="cal-grid">
        ${Array.from({ length: 21 }, (_, i) => `<span class="cal-cell${[3, 8, 14, 17].includes(i) ? ' has-data' : ''}">${i + 1}</span>`).join('')}
      </div>
      <span class="ev-mark" data-label="calendar_date_viewed"><span class="cal-cell has-data" style="display:inline-flex;width:32px;outline:2px solid #FF5A2C;">14</span></span>
    `,
    ),

  'group-manage': () =>
    shell(
      '프로필 — 그룹 관리',
      `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;font-weight:800;">그룹 관리</span>
        <span class="ev-mark" data-label="group_added"><button class="btn btn-soft btn-xs"><span class="material-symbols-rounded">add</span>그룹 추가</button></span>
      </div>
      <div class="grp-card-demo">
        <div class="grp-card-head">
          <span class="grp-card-title">남자친구랑 먹을래</span>
          <span class="ev-mark" data-label="group_deleted"><button class="icon-btn" style="width:28px;height:28px;"><span class="material-symbols-rounded" style="font-size:16px;">delete</span></button></span>
        </div>
        <span class="ev-mark-block" data-label="dislike_added">
          <div class="accordion-row"><span class="member-chip on">나연</span><span>· 못 먹는 음식: 새우, 오이</span></div>
        </span>
      </div>
    `,
    ),

  'notify-install': () =>
    shell(
      '프로필 — 설정',
      `
      <span class="ev-mark-block" data-label="notify_toggled · push_subscribed">
        <div class="pf-row"><span class="material-symbols-rounded">notifications</span><span style="flex:1;">푸시 알림<span class="pf-sub" style="display:block;">매일 오후 6:30</span></span><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
      </span>
      <span class="ev-mark-block" data-label="install_clicked · pwa_installed">
        <div class="pf-row"><span class="material-symbols-rounded">install_mobile</span><span style="flex:1;">홈 화면에 설치</span><span class="material-symbols-rounded" style="color:#969fac;font-size:18px;">chevron_right</span></div>
      </span>
      <span class="ev-mark-block" data-label="sync_completed · user_resurrected">
        <div class="pf-row"><span class="material-symbols-rounded">cloud_done</span><span style="flex:1;">test-admin-verify2<span class="pf-sub" style="display:block;">동기화됨 · 방금 전</span></span></div>
      </span>
    `,
    ),

  auth: () =>
    shell(
      '로그인 / 회원가입',
      `
      <span class="ev-mark-block" data-label="logged_in">
        <div class="dialog-demo" style="max-width:none;margin-bottom:14px;">
          <h3>로그인</h3>
          <div class="auth-field"><label>이메일</label><input value="you@example.com" readonly /></div>
          <div class="auth-field"><label>비밀번호</label><input type="password" value="••••••••" readonly /></div>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#6d7583;margin:6px 0 10px;"><input type="checkbox" checked style="accent-color:#000;" />로그인 유지</label>
          <button class="btn btn-primary" style="width:100%;justify-content:center;">로그인</button>
        </div>
      </span>
      <span class="ev-mark-block" data-label="signed_up">
        <div class="dialog-demo" style="max-width:none;">
          <h3>회원가입</h3>
          <div class="auth-field"><label>비밀번호</label><input type="password" value="••••••••" readonly /></div>
          <div class="pw-hint" style="font-size:11px;color:#969fac;margin:-6px 0 10px;">8자 이상, 영문+숫자 포함</div>
          <button class="btn btn-primary" style="width:100%;justify-content:center;">가입하기</button>
        </div>
      </span>
    `,
    ),

  feedback: () =>
    shell(
      '피드백 남기기',
      `
      <div class="dialog-demo" style="max-width:none;">
        <h3>피드백 남기기</h3>
        <span class="ev-mark" data-label="feedback_sent (type)">
          <div style="display:flex;gap:8px;margin:12px 0;">
            <button class="fb-type active" style="flex:1;">새로운 기능이<br>필요해요</button>
            <button class="fb-type" style="flex:1;">버그를<br>발견했어요</button>
          </div>
        </span>
        <textarea readonly style="width:100%;min-height:60px;border:1.5px solid #dfe3e6;border-radius:10px;padding:10px;font-size:12px;color:#6d7583;font-family:inherit;">자세한 내용을 10자 이상 적어주세요…</textarea>
        <span class="ev-mark" data-label="feedback_sent"><button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:10px;">보내기</button></span>
      </div>
    `,
    ),

  room: () =>
    shell(
      '함께 정하기 · 룸',
      `
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <span class="ev-mark" data-label="room_created"><button class="btn btn-brand btn-sm">방 만들기</button></span>
        <span class="ev-mark" data-label="room_joined"><button class="btn btn-outline btn-sm">코드로 참여</button></span>
      </div>
      <div style="text-align:center;margin-bottom:12px;">방 코드 <span class="room-code-badge">NHV9BC</span></div>
      <span class="ev-mark-block" data-label="room_entry_submitted">
        <div class="room-entry-row-demo" style="max-width:none;margin-bottom:6px;"><span class="re-name">나연 (나)</span><span class="re-menu">초밥</span></div>
      </span>
      <div class="room-entry-row-demo" style="max-width:none;margin-bottom:10px;"><span class="re-name">민지</span><span class="re-menu" style="font-style:italic;color:#969fac;">대기중</span></div>
      <span class="ev-mark" data-label="room_spun"><button class="btn btn-brand" style="width:100%;justify-content:center;"><span class="material-symbols-rounded">casino</span>다 같이 돌리기</button></span>
    `,
    ),
}

/** 이벤트 카탈로그 상세 패널의 iframe(srcDoc)에 넣을 화면 미리보기 HTML을 만든다. */
export function buildEventScreenHtml(screen: EventScreenKey): string {
  return SCREENS[screen]()
}
