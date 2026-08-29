import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * hover 변형을 두지 않는다. Badge는 누를 수 있는 요소가 아니므로
 * hover 효과가 있으면 사용자가 누를 수 있다고 착각한다.
 *
 * 글자는 *-on-tint 토큰을 쓴다 — text-12(12px) font-bold는 WCAG가
 * 4.5:1을 요구하는데, 옅게 탄 배경 위에 원래 색(text-info 등)을 그대로
 * 쓰면 라이트 테마에서 그 기준에 못 미친다.
 *
 * text-11에서 text-12로 올렸다(text-size-floor 규칙). py-0.5를 py-0으로
 * 낮춰 높이를 그대로 20px에 묶어 뒀다 — text-12의 줄 상자가 이미 20px라
 * 위아래 패딩 없이도 이전 높이(패딩 4px + 줄 상자 16px)와 같다.
 */
const badgeVariants = cva(
  'inline-flex w-fit items-center gap-1 rounded px-2 py-0 text-12 font-bold whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-neutral-on-tint',
        info: 'bg-info/15 text-info-on-tint',
        success: 'bg-success/15 text-success-on-tint',
        warning: 'bg-warning/15 text-warning-on-tint',
        destructive: 'bg-destructive/15 text-destructive-on-tint',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
