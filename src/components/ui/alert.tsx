import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * 아이콘은 CSS로 색만 물려받는다. 어떤 아이콘을 넣을지는 문서 페이지가 정하고,
 * 이 컴포넌트는 variant에 맞는 색만 [&>svg]로 물려준다 — Button이 svg에
 * 크기를 물려주는 것과 같은 방식이라 이 시스템에서 새 규칙이 아니다.
 *
 * 아이콘 색도 Badge와 같은 *-on-tint 토큰을 쓴다 — 옅게 탄 배경 위에
 * 원래 색을 그대로 얹는 같은 패턴이라 대비가 낮아지는 문제를 똑같이 안고
 * 있었다.
 */
const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-md border p-4 text-16 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        info: 'border-info/30 bg-info/10 [&>svg]:text-info-on-tint',
        success: 'border-success/30 bg-success/10 [&>svg]:text-success-on-tint',
        warning: 'border-warning/30 bg-warning/10 [&>svg]:text-warning-on-tint',
        destructive: 'border-destructive/30 bg-destructive/10 [&>svg]:text-destructive-on-tint',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

/*
 * role="alert"는 aria-live="assertive"를 뜻한다 — 마운트되는 순간 스크린
 * 리더가 하던 일을 끊고 읽는다. Alert 대부분은 화면에 계속 머무르는
 * 정적인 배너(권한 안내, 점검 공지)이고 그런 곳에는 실시간 알림이 전혀
 * 어울리지 않는다. 그래서 기본값은 role을 아예 두지 않는 'off'다.
 * 저장 완료처럼 사용자의 행동 직후에 결과를 즉시 알려야 하는 예외적인
 * 경우에만 호출한 쪽이 'assertive'(role="alert")나 'polite'(role="status")를
 * 골라 켠다.
 */
type AlertLive = 'assertive' | 'polite' | 'off'

const ALERT_LIVE_ROLE: Record<AlertLive, React.AriaRole | undefined> = {
  assertive: 'alert',
  polite: 'status',
  off: undefined,
}

function Alert({
  className,
  variant,
  live = 'off',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants> & { live?: AlertLive }) {
  return (
    <div
      role={ALERT_LIVE_ROLE[live]}
      data-slot="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="alert-title" className={cn('font-medium', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p data-slot="alert-description" className={cn('text-muted-foreground', className)} {...props} />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
