import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-sm border border-input shadow-xs outline-none transition',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground',
        /*
         * hover는 Input · Select 트리거와 같은 생각(테두리를 한 단계 옮김)을
         * 쓴다. data-state로 가리지 않아도 된다 — checked·indeterminate의
         * border-primary와 hover:border-ring/60은 명시도가 같고(둘 다
         * 클래스 하나 + 속성/의사클래스 하나), 컴파일된 CSS에서
         * data-state 규칙이 hover보다 뒤에 나와 소스 순서로 이긴다.
         * npm run build 후 순서를 확인했다 — 켜진 상자 위에서 hover가
         * border-primary를 가리는 일은 생기지 않는다.
         */
        'hover:border-ring/60',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    >
      {/*
        표시자는 Radix가 내부적으로 관리하는 상태(data-state)로 고른다.
        비제어로 쓰일 때는 props.checked가 undefined라 값만으로는 중간 상태를
        가려낼 수 없다 — Check와 Minus를 함께 두고 data-state로 전환한다.
      */}
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="group grid place-items-center text-current"
      >
        <Check className="size-3 group-data-[state=indeterminate]:hidden" />
        <Minus className="hidden size-3 group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
