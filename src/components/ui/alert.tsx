import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * 아이콘은 CSS로 색만 물려받는다. 어떤 아이콘을 넣을지는 문서 페이지가 정하고,
 * 이 컴포넌트는 variant에 맞는 색만 [&>svg]로 물려준다 — Button이 svg에
 * 크기를 물려주는 것과 같은 방식이라 이 시스템에서 새 규칙이 아니다.
 *
 * lucide 아이콘은 획(stroke)만 있고 채움(fill)이 없는 선 아이콘이라, 옅게
 * 탄 배경(bg 계열 10% 탄색) 위에서는 가는 선 하나로만 존재해 존재감이 약했다.
 * svg에 fill=currentColor를 그냥 주면 "채워지긴" 하지만 세모(경고)·원
 * (안내) 같은 바깥 도형의 닫힌 path만 통째로 칠해질 뿐, 느낌표·체크
 * 표시처럼 안쪽에 획으로만 그려진 기호는 바탕과 같은 색이 되어 오히려
 * 사라진다(실측: TriangleAlert의 느낌표, Info의 점이 통째로 안 보였다).
 * 그래서 진짜 채움은 아이콘 자신이 아니라 아이콘을 담는 자리에 준다 —
 * Button의 solid variant와 같은 짝(bg-info + text-info-foreground 등)으로
 * 작은 배지를 만들고, 아이콘 선 자체는 그 배지 위에서 그대로 흰/검
 * 대비를 받는다. warning만 text-warning-foreground가 검정이다 —
 * --warning 자체가 밝은 색이라 흰 글자를 얹으면 Button에조차 없는 조합을
 * 새로 만드는 셈이라, 이미 검증된 --warning-foreground(검정)를 그대로
 * 물려쓴다. size-2.5(10px) 아이콘 + p-[3px] + box-content로 바깥 눈금은
 * 이전과 같은 16px을 유지해 레이아웃이 밀리지 않는다.
 */
const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-md border p-4 text-16 [&>svg]:mt-0.5 [&>svg]:box-content [&>svg]:size-2.5 [&>svg]:shrink-0 [&>svg]:rounded-md [&>svg]:p-[3px]',
  {
    variants: {
      variant: {
        info: 'border-info/30 bg-info/10 [&>svg]:bg-info [&>svg]:text-info-foreground',
        success: 'border-success/30 bg-success/10 [&>svg]:bg-success [&>svg]:text-success-foreground',
        warning: 'border-warning/30 bg-warning/10 [&>svg]:bg-warning [&>svg]:text-warning-foreground',
        destructive:
          'border-destructive/30 bg-destructive/10 [&>svg]:bg-destructive dark:[&>svg]:bg-destructive/60 [&>svg]:text-destructive-foreground',
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
