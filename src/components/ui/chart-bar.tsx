import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

/*
 * shadcn 공식 chart-bar-default·chart-bar-horizontal·chart-bar-stacked를
 * 옮긴 계열 컴포넌트. config 키가 하나면 default, 둘 이상이면 legend가
 * 자동으로 붙는다(multiple). 음수 값은 data에 그대로 넣으면 recharts가
 * 알아서 그린다 — 별도 prop 없음.
 *
 * showLegend를 명시하지 않으면 계열이 둘 이상일 때 자동으로 범례가
 * 붙는다(기존 관례). showLegend={false}로 계열이 여럿이어도 범례를
 * 끌 수 있고, showLegend={true}로 강제로 켤 수도 있다.
 */
export function ChartBar({
  title,
  description,
  data,
  config,
  categoryKey,
  orientation = 'columns',
  stacked = false,
  showLegend,
}: {
  title: string
  description: string
  data: Array<Record<string, string | number>>
  config: ChartConfig
  categoryKey: string
  /** columns: 세로 막대(기본). bars: 가로 막대 — recharts의 layout="vertical"에 대응한다 */
  orientation?: 'columns' | 'bars'
  stacked?: boolean
  /** 안 정하면 계열이 둘 이상일 때 자동으로 켜진다 */
  showLegend?: boolean
}) {
  const seriesKeys = Object.keys(config).filter((key) => key !== categoryKey)
  const isBars = orientation === 'bars'
  const resolvedShowLegend = showLegend ?? seriesKeys.length > 1

  return (
    <Card className="w-full">
      <CardHeader className="gap-2">
        <CardTitle className="text-16">{title}</CardTitle>
        <CardDescription className="text-14">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart
            /*
             * key를 orientation·stacked·showLegend에 묶어 리마운트를 강제한다 —
             * recharts 3.10.1은 이미 마운트된 BarChart의 layout·stackId만 바뀌면
             * 축·막대 스케일을 다시 계산하지 않는다(Playground 토글이 화면상 안
             * 바뀌는 것으로 드러났다. SVG의 실제 x/y/width/height 속성을 읽어
             * 확인했다). showLegend도 이제 명시적으로 켜고 끌 수 있는 구조적
             * 변화라 같은 취급을 한다. 단일 조합 안에서는 렌더링 결과에 영향
             * 없다 — 토글할 때만 새로 마운트되게 한다.
             */
            key={`${orientation}-${stacked}-${resolvedShowLegend}`}
            accessibilityLayer
            data={data}
            layout={isBars ? 'vertical' : 'horizontal'}
            margin={isBars ? { left: 12, right: 44 } : { left: 12, right: 12 }}
          >
            <CartesianGrid vertical={isBars} horizontal={!isBars} />
            {isBars ? (
              <>
                <XAxis type="number" hide />
                <YAxis dataKey={categoryKey} type="category" tickLine={false} axisLine={false} tickMargin={8} />
              </>
            ) : (
              <XAxis dataKey={categoryKey} tickLine={false} axisLine={false} tickMargin={8} />
            )}
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={seriesKeys.length === 1} />} />
            {resolvedShowLegend && <ChartLegend content={<ChartLegendContent />} />}
            {seriesKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId={stacked ? 'a' : undefined}
                fill={`var(--color-${key})`}
                /*
                 * shadcn 원본은 radius를 숫자 하나로 준다(네 모서리 전부 둥글게).
                 * 축에 닿는 쪽까지 둥글면 막대가 축에서 떠 보이고, 막대 폭이 좁을
                 * 때(카테고리가 많을 때) 반지름이 폭의 절반에 가까워져 알약처럼
                 * 보인다(실제로 확인함) — [좌상, 우상, 우하, 좌하] 배열로 진행
                 * 방향의 앞쪽 두 모서리만 둥글게 한다. columns(세로)는 위쪽,
                 * bars(가로)는 오른쪽(축 반대편)이 진행 방향이다.
                 */
                radius={isBars ? [0, 4, 4, 0] : [8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
