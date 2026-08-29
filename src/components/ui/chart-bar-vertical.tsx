import * as RechartsPrimitive from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

/*
 * 세로 막대. 짧은 카테고리 라벨의 분포(히스토그램)에 쓴다 — 스핀 깊이
 * ("1회","2회",...) 처럼 순서가 있는 구간을 좌→우로 읽는 자연스러움이
 * 가로 막대보다 낫다.
 */
export interface VBarDatum {
  label: string
  value: number
}

const config: ChartConfig = { value: { label: '값', color: 'var(--chart-1)' } }

export function ChartBarVertical({
  data,
  height = 220,
  valueFormatter = (v: number) => String(v),
}: {
  data: VBarDatum[]
  height?: number
  valueFormatter?: (v: number) => string
}) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <RechartsPrimitive.BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 4 }}>
        <RechartsPrimitive.CartesianGrid vertical={false} />
        <RechartsPrimitive.XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <RechartsPrimitive.YAxis tickLine={false} axisLine={false} width={40} fontSize={12} tickFormatter={valueFormatter} />
        <ChartTooltip cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.4 }} content={<ChartTooltipContent valueFormatter={valueFormatter} />} />
        <RechartsPrimitive.Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={48} fill="var(--chart-1)">
          <RechartsPrimitive.LabelList
            dataKey="value"
            position="top"
            formatter={(v: unknown) => (typeof v === 'number' ? valueFormatter(v) : '')}
            className="fill-muted-foreground text-2xs"
          />
        </RechartsPrimitive.Bar>
      </RechartsPrimitive.BarChart>
    </ChartContainer>
  )
}
