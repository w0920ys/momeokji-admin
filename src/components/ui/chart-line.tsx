import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

/*
 * shadcn 공식 chart-line-default·chart-line-multiple·chart-line-step·
 * chart-line-dots를 옮긴 계열 컴포넌트. config 키가 둘 이상이면 범례가
 * 자동으로 붙는다(multiple).
 *
 * showLegend를 명시하지 않으면 계열이 둘 이상일 때 자동으로 범례가
 * 붙는다(기존 관례). showLegend={false}로 계열이 여럿이어도 범례를
 * 끌 수 있고, showLegend={true}로 강제로 켤 수도 있다.
 */
export function ChartLine({
  title,
  description,
  data,
  config,
  categoryKey,
  curveType = 'monotone',
  showDots = false,
  showLegend,
}: {
  title: string
  description: string
  data: Array<Record<string, string | number>>
  config: ChartConfig
  categoryKey: string
  curveType?: 'monotone' | 'step'
  showDots?: boolean
  /** 안 정하면 계열이 둘 이상일 때 자동으로 켜진다 */
  showLegend?: boolean
}) {
  const seriesKeys = Object.keys(config).filter((key) => key !== categoryKey)
  const resolvedShowLegend = showLegend ?? seriesKeys.length > 1

  return (
    <Card className="w-full">
      <CardHeader className="gap-2">
        <CardTitle className="text-16">{title}</CardTitle>
        <CardDescription className="text-14">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          {/*
           * key를 showLegend에 묶는다 — Chart Bar·Area·Pie에서 이미 겪은 recharts
           * 3.10.1 리마운트 버그가 있어(마운트 후 구조가 바뀌는 chart-level prop은
           * 전부 의심해야 안전하다는 게 이 계획 전체에서 반복 확인된 결론이다).
           * curveType·showDots는 이전 Task에서 이미 SVG d 속성으로 직접 검증해
           * key 없이도 안전함을 확인했다 — 여기서는 새로 추가하는 showLegend만
           * key에 묶는다.
           */}
          <LineChart key={String(resolvedShowLegend)} accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={categoryKey} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={seriesKeys.length === 1} />} />
            {resolvedShowLegend && <ChartLegend content={<ChartLegendContent />} />}
            {seriesKeys.map((key) => (
              <Line
                key={key}
                dataKey={key}
                type={curveType}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={showDots ? { r: 3, fill: `var(--color-${key})` } : false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
