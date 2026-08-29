import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendBadge } from '@/components/ui/trend-badge'

/*
 * KPI 타일. 어느 관리자 대시보드에나 있는 "라벨 + 큰 숫자 + 증감" 조합을
 * Card 위에 고정 배치한 것 — Card 자체는 범용이라 이 조합을 반복해서
 * 손으로 짜지 않도록 별도 컴포넌트로 승격했다.
 *
 * value는 이미 포맷된 문자열을 받는다 — 단위(₩, %, 만 단위 축약 등)는
 * 서비스마다 다른 포맷 규칙이라 이 컴포넌트가 알 필요가 없다(소비자의
 * format 유틸이 책임진다).
 */
export function StatCard({
  label,
  value,
  deltaPct,
  higherIsBetter = true,
  hint,
}: {
  label: string
  value: string
  deltaPct?: number
  higherIsBetter?: boolean
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">{label}</span>
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground/70 hover:text-foreground -m-1 p-1"
                  aria-label={`${label} 설명`}
                >
                  <Info className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{hint}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          {deltaPct != null && (
            <span className="mb-0.5">
              <TrendBadge deltaPct={deltaPct} higherIsBetter={higherIsBetter} />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
