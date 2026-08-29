import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

/*
 * Radix 기본값은 트리거를 클릭하면 오히려 닫힌다 — pointerdown을
 * '상호작용 시작'으로 보고 열려 있던 말풍선을 지운다. 이 프로젝트는
 * 반대를 원한다: 트리거를 클릭하면 열리고, 바깥을 클릭해야 닫힌다.
 * 그래서 open을 이 컴포넌트가 직접 들고 있다가(Radix가 보내는 모든
 * onOpenChange 신호는 그대로 반영한다 — 호버·포커스·Escape·바깥 클릭은
 * 손대지 않는다) 트리거의 click에서만 강제로 연다. pointerdown이
 * click보다 먼저 오므로, Radix의 닫힘 처리가 지나간 뒤에 이 click이
 * 다시 연다 — 실제로 열려 있던 걸 지웠다가 같은 클릭 안에서 다시 켜는
 * 셈이라 화면엔 깜빡임 없이 그대로 열린 채로 보인다.
 */
type TooltipContextValue = { forceOpen: () => void }
const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const context = React.useMemo<TooltipContextValue>(() => ({ forceOpen: () => setOpen(true) }), [setOpen])

  return (
    <TooltipContext.Provider value={context}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen} {...props} />
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({ onClick, ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const context = React.useContext(TooltipContext)
  return (
    <TooltipPrimitive.Trigger
      onClick={(event) => {
        onClick?.(event)
        context?.forceOpen()
      }}
      {...props}
    />
  )
}

/*
 * Radix Tooltip은 DismissableLayer를 쓰지만 disableOutsidePointerEvents를
 * 명시적으로 false로 둔다(react-tooltip 패키지 소스 확인). RemoveScroll·
 * FocusScope·hideOthers는 아예 쓰지 않는다 — 포커스를 빼앗으면 안 되는
 * 물건이라 설계상 비모달이다. 그래서 Select와 달리 열려 있어도 body가
 * 잠기거나 GNB·LNB가 aria-hidden되지 않는다.
 *
 * Portal은 뺄 수 없다 — 표 헤더나 잘린 글처럼 overflow가 있는 컨테이너
 * 안에서 트리거를 쓰는 것이 이 컴포넌트의 실제 용도이고(Usage의
 * '표 머리의 설명'), 이 문서 자체의 ExampleFrame도 overflow-hidden을
 * 쓴다. Portal로 나가면 Anatomy 무대의 stage.querySelector가 말풍선을
 * 찾지 못한다 — Select가 열린 목록을 anatomy에서 뺀 것과 같은 이유로
 * 이 컴포넌트도 트리거만 부위로 남긴다.
 */
function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          /*
           * text-12(설명·캡션 티어)가 원래 값이었으나 실측 결과 너무 작다는
           * 피드백을 받아 text-14로 올렸다 — 이 스케일에서 text-14의
           * 공식 역할은 "조밀 모드 전용(표 셀 등)"이라 말풍선 안 텍스트가
           * 그 역할과 완전히 맞진 않지만, 사용자가 짧게 읽고 넘어가는
           * 텍스트의 최소 크기를 12px 아래로 두지 않기로 한 결정에 따른
           * 예외다. text-11(11px)을 쓰는 다른 컴포넌트 114곳은 이 결정과
           * 별개로 남아 있다 — 그쪽은 아직 검토 전이다.
           */
          'bg-popover text-popover-foreground z-popover w-fit max-w-64 text-balance rounded-md border px-3 py-1.5 text-14 shadow-md',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-popover" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
