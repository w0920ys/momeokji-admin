import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
 * 증감률 배지. 방향(화살표)과 색(success/destructive)이 항상 같이 붙는다
 * — 색만으로 좋고 나쁨을 말하지 않는다(dataviz: 상태는 아이콘+라벨 동반).
 *
 * "증가가 좋은 지표인지"는 호출하는 쪽이 안다(예: 이탈률은 감소가 좋음) —
 * 그래서 higherIsBetter를 받는다. 기본값은 true(대부분의 지표가 그렇다).
 */
export function TrendBadge({
  deltaPct,
  higherIsBetter = true,
  className,
}: {
  deltaPct: number
  higherIsBetter?: boolean
  className?: string
}) {
  const up = deltaPct >= 0
  const good = up === higherIsBetter
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const sign = up ? '+' : ''

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-12 font-semibold tabular-nums',
        good ? 'text-success-on-tint' : 'text-destructive-on-tint',
        className,
      )}
    >
      <Icon className="size-3.5" />
      {sign}
      {deltaPct.toFixed(1)}%
    </span>
  )
}
