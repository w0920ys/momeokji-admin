import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * Radix를 쓰지 않는다. 이 컴포넌트가 하는 일은 방향에 따라 선을 긋고
 * 장식이면 접근성 트리에서 빼는 것 — 두 줄이다. 의존성 하나를 두 줄과
 * 바꾸지 않는다.
 *
 * 두께를 border가 아니라 크기로 준다. border를 쓰면 방향이 바뀔 때마다
 * 어느 변을 그을지 골라야 하고, flex 안에서 두께가 눌린다.
 */
const separatorVariants = cva('bg-border shrink-0', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

type SeparatorProps = React.ComponentProps<'div'> &
  VariantProps<typeof separatorVariants> & {
    /** 눈으로만 나누는 선인지. 참이면 접근성 트리에서 뺀다 */
    decorative?: boolean
  }

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : (orientation ?? 'horizontal')}
      className={cn(separatorVariants({ orientation, className }))}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
