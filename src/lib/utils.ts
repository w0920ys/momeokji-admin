import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/*
 * tailwind-merge는 이 프로젝트가 tokens.css에 심은 --spacing-control·
 * --spacing-control-sm·--spacing-control-lg를 모른다 — h·min-h·size
 * 같은 그룹의 기본 테마 매처는 표준 스페이싱 스케일(숫자·px·fraction 등)만
 * 인식하므로 h-control 같은 클래스는 어느 그룹에도 잡히지 않고
 * "알 수 없는 클래스"로 그냥 통과한다. 그 상태에서 뒤에 h-auto를
 * 덧붙이면 h-auto는 h 그룹의 정식 멤버라 인식되지만 h-control은
 * 그룹 밖에 있어 둘이 충돌로 잡히지 않는다 — twMerge가 아무것도
 * 지우지 않고 두 클래스를 그대로 남기면, 실제로 이기는 쪽은 최종
 * 스타일시트에서 나중에 정의된 규칙이지 class 속성에서 나중에 적힌
 * 클래스가 아니다. Combobox의 multiple 트리거가 배지 줄바꿈으로
 * 자라야 할 때 h-control(고정 높이)이 h-auto를 누르고 이겨 내용이
 * 테두리 밖으로 넘치던 결함이 바로 이 틈에서 났다.
 *
 * control·control-sm·control-lg를 h·min-h·size 세 그룹 모두에
 * 빠짐없이 직접 등록해 이 프로젝트의 컨트롤 높이 유틸을 표준
 * 스케일과 같은 그룹으로 묶는다 — 이후로는 h-control 뒤에 오는
 * h-auto(또는 그 반대 순서)가 twMerge 단계에서 정상적으로 하나만
 * 남는다. size 그룹은 지금 당장 겹치는 override 자리가 없지만(
 * size-control-sm·size-control-lg는 Avatar·Breadcrumb가 쓰고,
 * size-control은 Button의 icon 크기가 쓴다), 세 토큰 중 하나만
 * 빠뜨리면 나중에 누가 그 하나 위에 size-auto 같은 표준 크기를
 * 덧붙일 때 똑같은 틈에 빠진다 — h·min-h와 다르게 세 토큰을
 * 고르지 않고 전부 등록해야 이 그룹이 실제로 안전하다.
 *
 * --spacing-row·--spacing-row-compact(Table의 행 높이)도 같은 종류의
 * 토큰이라 같은 틈에 빠져 있었다 — TableRow가 h-row를 className보다
 * 먼저 내보내므로, 등록하기 전에는 호출처가 뒤에 h-auto를 붙여도 둘 다
 * 살아남았다. 등록한 지금은 h-auto만 남는다.
 * h·min-h 두 그룹에 함께 등록해 컨트롤 높이 토큰과 정책을 하나로
 * 맞춘다. size 그룹에는 넣지 않는다 — 행 높이 토큰으로 정사각형
 * 크기를 잡는 자리가 없고, 실제로 이 저장소에 size-row·size-row-compact
 * 를 쓰는 곳이 없다(control 쪽은 size-control·size-control-sm·
 * size-control-lg를 Button·Avatar·Breadcrumb가 실제로 쓴다).
 *
 * 가로 쪽 토큰 유틸도 같은 틈에 있었다. min-w-control 계열(Toggle의
 * 세 크기와 DataTable의 선택 칸)과 left-control-lg(DataTable이 sticky
 * 열을 선택 칸 폭만큼 미는 자리)가 그것이다. left 쪽은 실제로 한
 * 요소에서 만난다 — table.tsx의 sticky 칸이 left-0을 먼저 내보내고
 * DataTable이 그 뒤에 left-control-lg를 얹는데, 등록하기 전에는 둘 다
 * 살아남아 이기는 쪽을 최종 스타일시트의 정의 순서가 정하고 있었다.
 * 지금은 뒤에 온 left-control-lg만 남는다. 이 두 그룹에도 다섯 토큰을
 * 모두 등록한다 — left-row·min-w-row를 쓰는 자리는 아직 없지만, 위와
 * 같은 이유로 그룹 안을 비워 두면 나중에 그 하나가 틈이 된다.
 *
 * theme.spacing 쪽의 일반 매처를 넓히는 대신 classGroups를 직접
 * 확장한 것은 의도적이다 — theme.spacing을 건드리면 p-·m-·gap-·w-
 * 등 스페이싱 스케일을 쓰는 모든 그룹이 영향을 받아 파급 범위를
 * 가늠하기 어렵다. 실제로 토큰 유틸이 쓰이는 그룹만 정확히 넓히면
 * 다른 유틸리티의 병합 규칙은 그대로다.
 */
/*
 * font-size 스케일도 같은 틈에 빠진다 — tailwind-merge의 기본 text 테마는
 * xs·sm·base·lg·xl·2xl 같은 T셔츠 사이즈 이름만 알아본다. 이 프로젝트가
 * tokens.css에 심은 text-11·text-12·text-14 같은 순수 숫자 이름은 그
 * 패턴에 안 걸려 font-size 그룹 밖으로 밀려나고, tailwind-merge는 색
 * 이름을 뭐든 다 받아주는 text-color 그룹(color: [isAny])에 대신 떨어뜨린다.
 * 그 상태에서 Badge처럼 text-11 뒤에 text-success-on-tint 같은 색 유틸이
 * 오면 둘 다 text-color 그룹 소속으로 잡혀 충돌 처리되고, 나중에 온
 * text-success-on-tint가 이겨 text-11이 통째로 지워진다 — 브라우저 실측
 * 결과 배지 글자가 11px가 아니라 상속된 16px로 나온 원인이 이거였다.
 *
 * theme.text에 스케일 열두 값을 전부 등록해 font-size 그룹이 먼저
 * 그 값들을 가져가게 한다. 그러면 같은 문자열이 더는 text-color의
 * isAny에 떨어질 일이 없어 색 유틸과 충돌하지 않고, text-11과 text-14가
 * 나란히 오면 font-size 그룹 안에서 정상적으로 하나만 남는다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['11', '12', '14', '16', '18', '20', '22', '24', '28', '32', '40', '48'],
    },
    classGroups: {
      h: [{ h: ['control', 'control-sm', 'control-lg', 'row', 'row-compact'] }],
      'min-h': [{ 'min-h': ['control', 'control-sm', 'control-lg', 'row', 'row-compact'] }],
      size: [{ size: ['control', 'control-sm', 'control-lg'] }],
      'min-w': [{ 'min-w': ['control', 'control-sm', 'control-lg', 'row', 'row-compact'] }],
      left: [{ left: ['control', 'control-sm', 'control-lg', 'row', 'row-compact'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
