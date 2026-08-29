import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & {
  /*
   * 즉시 반영이 서버 응답을 기다리는 동안이다. disabled와 다르게
   * disabled:opacity-50을 쓰지 않는다 — 불투명도는 이미 disabled가
   * 쓰고 있어서 겹치면 disabled인지 pending인지 구분할 수 없다.
   * 그래서 실제 disabled 어트리뷰트는 건드리지 않고, 손잡이 자리를
   * 스피너로 바꿔서 트랙의 색(목표 상태)은 그대로 보이게 한다.
   * 클릭과 키보드 조작은 onCheckedChange를 끊고 pointer-events로 막는다.
   */
  pending?: boolean
  /*
   * 손잡이(Thumb)는 Root 안에 있어 소비자가 직접 닿을 수 없다.
   * 임의의 속성을 손잡이에 그대로 전달하는 통로만 열어 둔다 — 무엇을
   * 전달할지는 소비자가 정하므로 이 컴포넌트는 그 내용을 알지 못한다.
   */
  thumbProps?: React.ComponentProps<typeof SwitchPrimitive.Thumb> & {
    [dataAttr: `data-${string}`]: string
  }
}

function Switch({
  className,
  pending,
  disabled,
  onCheckedChange,
  thumbProps,
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-pending={pending ? '' : undefined}
      disabled={disabled}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      onCheckedChange={pending ? undefined : onCheckedChange}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent shadow-xs outline-none transition-colors',
        'data-[state=unchecked]:bg-input data-[state=checked]:bg-primary',
        /*
         * hover는 Checkbox·Radio와 같은 생각(테두리를 한 단계 옮김)을 쓴다.
         * 트랙의 배경은 이미 켜짐·꺼짐을 나타내는 자리라 hover까지 배경을
         * 다투게 하지 않는다 — border-transparent로 자리만 미리 잡아 두고
         * hover에서 색만 채운다.
         */
        'hover:border-ring/60',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[pending]:pointer-events-none data-[pending]:cursor-wait',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        {...thumbProps}
        className={cn(
          'bg-background pointer-events-none grid size-5 place-items-center rounded-full shadow-lg ring-0 transition-transform',
          'data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5',
          thumbProps?.className,
        )}
      >
        {pending && (
          <Loader2 className="text-muted-foreground size-3 animate-spin" aria-hidden />
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
