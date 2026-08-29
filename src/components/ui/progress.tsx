import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

type ProgressVariant = 'default' | 'success' | 'warning' | 'destructive'
type ProgressSize = 'sm' | 'default'

/*
 * Track은 늘 bg-muted다 — variant는 Indicator의 배경색만 바꾼다.
 * overflow-hidden이 있어야 Indicator가 translateX로 밀려나거나
 * indeterminate에서 좌우로 움직일 때 track 밖으로 새지 않는다.
 */
const progressVariants = cva('bg-muted relative w-full overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'h-1.5',
      default: 'h-2',
    },
  },
  defaultVariants: { size: 'default' },
})

/*
 * Indicator는 늘 track 전체 폭(w-full)으로 그리고 translateX로 값만큼만
 * 보이게 민다 — width를 바꾸는 것보다 부드럽다(shadcn의 방식). 그 이동은
 * 동적인 값이라 인라인 style로 준다. indeterminate(Radix가 다는
 * data-state="indeterminate")에서는 값이 없으므로 폭 자체를 좁혀
 * animate-progress-indeterminate(tokens.css)로 좌우로 오간다.
 */
const progressIndicatorVariants = cva(
  'h-full w-full rounded-full transition-transform duration-300 ease-out data-[state=indeterminate]:w-1/3 data-[state=indeterminate]:animate-progress-indeterminate',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        success: 'bg-success',
        warning: 'bg-warning',
        destructive: 'bg-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type ProgressProps = Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, 'value'> &
  VariantProps<typeof progressVariants> & {
    variant?: ProgressVariant
    value?: number | null
    /*
     * Indicator(내부 요소)는 소비자가 직접 닿을 수 없다. data-anatomy 같은
     * 임의 속성을 그대로 전달하는 통로만 열어 둔다 — Step의 connectorProps와
     * 같은 자리다.
     */
    indicatorProps?: React.ComponentProps<typeof ProgressPrimitive.Indicator> & {
      [dataAttr: `data-${string}`]: string
    }
  }

function Progress({
  className,
  size,
  variant,
  value,
  indicatorProps,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(progressVariants({ size, className }))}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        {...indicatorProps}
        className={cn(progressIndicatorVariants({ variant }), indicatorProps?.className)}
        style={
          value != null
            ? { transform: `translateX(-${100 - value}%)`, ...indicatorProps?.style }
            : indicatorProps?.style
        }
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
export type { ProgressVariant, ProgressSize }
