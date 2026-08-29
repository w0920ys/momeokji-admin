import * as RechartsPrimitive from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatNumber } from '@/lib/format'

/*
 * 도넛 + 옆 범례. 조각 각도만으로 비율을 비교하게 두지 않고, 값과
 * 백분율을 범례 목록에 직접 적어 정확한 비교를 돕는다.
 */
export interface DonutDatum {
  label: string
  value: number
}

export function ChartDonut({ data, height = 200 }: { data: DonutDatum[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.label, { label: d.label, color: `var(--chart-${(i % 6) + 1})` }]),
  )

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer config={config} className="shrink-0" style={{ height, width: height }}>
        <RechartsPrimitive.PieChart>
          <ChartTooltip content={<ChartTooltipContent valueFormatter={formatNumber} hideLabel />} />
          <RechartsPrimitive.Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="58%"
            outerRadius="86%"
            paddingAngle={2}
            stroke="var(--color-background)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <RechartsPrimitive.Cell key={d.label} fill={`var(--chart-${(i % 6) + 1})`} />
            ))}
          </RechartsPrimitive.Pie>
        </RechartsPrimitive.PieChart>
      </ChartContainer>
      {/*
       * 라벨과 수치(값·비율)를 같은 줄에 억지로 욱여넣지 않는다 — 도넛이
       * 좁은 3분할 그리드 카드 안에 놓이면 남는 폭이 값+비율 텍스트만으로도
       * 이미 부족해져(예: "1,840 39.4%" ≈ 86px인데 남는 폭이 74px), 같은
       * 줄에 있던 라벨이 flex-1로 밀려 0px까지 찌그러져 통째로 사라지는
       * 실패를 겪었다. 라벨을 한 줄 통째로 쓰고 수치는 그 아래 보조줄로
       * 내리면, 폭이 아무리 좁아도 라벨은 늘 자기 줄 전체를 쓸 수 있다.
       */}
      <ul className="flex min-w-0 flex-1 flex-col gap-3">
        {data.map((d, i) => {
          const pct = total ? (d.value / total) * 100 : 0
          return (
            <li key={d.label} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: `var(--chart-${(i % 6) + 1})` }}
                />
                <span className="text-foreground truncate text-14">{d.label}</span>
              </div>
              <div className="text-muted-foreground pl-4 text-12 tabular-nums">
                {formatNumber(d.value)} · {pct.toFixed(1)}%
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
