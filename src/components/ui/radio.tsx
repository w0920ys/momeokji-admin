import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

/*
 * 항목을 늘어놓는 방향은 소비자가 className으로 정한다(flex-col/flex-row).
 * 기본값은 세로다 — 항목이 여럿이거나 설명이 붙는 경우가 더 흔하다.
 */
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'peer grid size-4 shrink-0 place-items-center rounded-full border border-input shadow-xs outline-none transition',
        'data-[state=checked]:border-primary',
        /*
         * hover는 Checkbox와 같은 생각(테두리를 한 단계 옮김)을 쓴다.
         * data-state로 가리지 않아도 된다 — checked의 border-primary와
         * hover:border-ring/60은 명시도가 같고, 컴파일된 CSS에서 data-state
         * 규칙이 hover보다 뒤에 나와 소스 순서로 이긴다. Checkbox에서 이미
         * 확인한 순서이므로 여기서도 같은 클래스 나열 순서를 따른다.
         */
        'hover:border-ring/60',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="bg-primary size-2 rounded-full"
      />
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
