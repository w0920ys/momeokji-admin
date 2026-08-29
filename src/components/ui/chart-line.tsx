import * as RechartsPrimitive from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

/*
 * 시간축 위 다계열 추세선. 유입 추세·리텐션 곡선·바이럴 추세처럼
 * "시간에 따라 무엇이 늘고 주는가"를 보여줄 때 쓴다.
 *
 * 색은 소비자가 정하지 않는다 — series 배열의 등장 순서대로
 * --chart-1..6(검증된 범주형 6색, chart-tokens.css)을 고정 배정한다.
 * dataviz 원칙: 범주형 색은 고정 순서로만 쓰고 절대 순환하지 않는다.
 *
 * xKey 기본값은 'date'다 — recharts는 XAxis의 dataKey가 실제 데이터에
 * 없는 필드를 가리키면 카테고리 축의 도메인 자체가 비어 Line이 점 하나도
 * 못 그리고 조용히 사라진다(축·범례는 그려지는데 곡선만 없는 형태로
 * 보인다 — 조합하는 쪽에서 오탐하기 쉬운 실패 모드). 시간축 데이터는
 * 거의 항상 'date' 필드를 쓰므로 그걸 기본값으로 둔다 — 다른 이름을
 * 쓰는 데이터는 xKey를 명시하면 된다.
 */
export interface LineChartSeries {
  key: string
  label: string
}

export function ChartLine({
  data,
  series,
  xKey = 'date',
  height = 240,
  valueFormatter = (v: number) => String(v),
  yDomain,
}: {
  data: Array<Record<string, string | number>>
  series: LineChartSeries[]
  xKey?: string
  height?: number
  valueFormatter?: (v: number) => string
  yDomain?: [number | 'auto', number | 'auto']
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label, color: `var(--chart-${(i % 6) + 1})` }]),
  )

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <RechartsPrimitive.LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <RechartsPrimitive.CartesianGrid vertical={false} />
        <RechartsPrimitive.XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <RechartsPrimitive.YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          fontSize={12}
          domain={yDomain}
          tickFormatter={valueFormatter}
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--color-muted-foreground)', strokeOpacity: 0.25 }}
          content={<ChartTooltipContent indicator="line" valueFormatter={valueFormatter} />}
        />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <RechartsPrimitive.Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: `var(--color-${s.key})` }}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-background)' }}
            isAnimationActive={false}
          />
        ))}
      </RechartsPrimitive.LineChart>
    </ChartContainer>
  )
}
