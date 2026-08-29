import * as RechartsPrimitive from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

/*
 * 가로 막대. 항목 이름이 길거나(유입경로·기능명) 항목 수가 적어 순위
 * 비교가 목적일 때 세로 막대보다 읽기 쉽다. 기본은 단일 계열(chart-1)
 * 이고, perItemColor 로 항목마다 고정 팔레트 색을 순서대로 줄 수도 있다.
 */
export interface HBarDatum {
  label: string
  value: number
}

export function ChartBarHorizontal({
  data,
  height = 220,
  valueFormatter = (v: number) => String(v),
  perItemColor = false,
}: {
  data: HBarDatum[]
  height?: number
  valueFormatter?: (v: number) => string
  perItemColor?: boolean
}) {
  const config: ChartConfig = perItemColor
    ? Object.fromEntries(data.map((d, i) => [d.label, { label: d.label, color: `var(--chart-${(i % 6) + 1})` }]))
    : { value: { label: '값', color: 'var(--chart-1)' } }

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <RechartsPrimitive.BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 44, bottom: 4, left: 8 }}
        barCategoryGap={10}
      >
        <RechartsPrimitive.XAxis type="number" hide />
        <RechartsPrimitive.YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={96} fontSize={12} />
        <ChartTooltip cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.4 }} content={<ChartTooltipContent valueFormatter={valueFormatter} />} />
        <RechartsPrimitive.Bar
          dataKey="value"
          radius={[4, 4, 4, 4]}
          isAnimationActive={false}
          maxBarSize={26}
          fill="var(--chart-1)"
        >
          {perItemColor &&
            data.map((d, i) => <RechartsPrimitive.Cell key={d.label} fill={`var(--chart-${(i % 6) + 1})`} />)}
          <RechartsPrimitive.LabelList
            dataKey="value"
            position="right"
            formatter={(v: unknown) => (typeof v === 'number' ? valueFormatter(v) : '')}
            className="fill-muted-foreground text-11"
          />
        </RechartsPrimitive.Bar>
      </RechartsPrimitive.BarChart>
    </ChartContainer>
  )
}
