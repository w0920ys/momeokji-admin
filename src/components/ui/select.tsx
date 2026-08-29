import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { controlShellVariants } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default' | 'lg'
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        controlShellVariants({ size }),
        'items-center justify-between gap-2 text-left data-[placeholder]:text-muted-foreground',
        className,
      )}
      {...props}
    >
      {/*
       * SelectValue를 직접 감싼다 — Radix의 SelectValue는 받은 className을
       * 렌더링에 쓰지 않고 버린다(내부에서 구조분해만 하고 span에 넘기지
       * 않는다). className="truncate"를 SelectValue에 줘도 아무 효과가
       * 없어 긴 값이 트리거 폭을 넘기면 줄바꿈됐다 — SelectValue 바깥에서
       * 직접 truncate를 걸어야 실제로 먹는다.
       */}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          /*
           * w-(--radix-select-trigger-width) — Radix가 popper 위치를 잡을 때
           * 트리거 크기를 이 CSS 변수로 Content에 내려준다. 메뉴 폭을 여기
           * 맞춰 트리거보다 넓거나 좁게 뜨지 않게 한다. min-w를 따로 두지
           * 않는다 — 바닥값을 두면 트리거가 그보다 좁을 때(예: 페이지당
           * 행 수의 80px 트리거) 메뉴가 트리거보다 넓게 떠 버려 "메뉴가
           * 트리거와 같은 폭"이라는 약속이 깨진다.
           */
          'bg-popover text-popover-foreground z-popover w-(--radix-select-trigger-width) overflow-hidden rounded-md border shadow-md',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-16 outline-none select-none',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 grid place-items-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
