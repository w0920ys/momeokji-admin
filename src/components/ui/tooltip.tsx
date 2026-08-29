import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

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
          'bg-popover text-popover-foreground z-popover w-fit max-w-64 text-balance rounded-md border px-3 py-1.5 text-xs shadow-md',
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
