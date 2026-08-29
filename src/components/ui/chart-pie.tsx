import { Pie, PieChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

/*
 * shadcn 공식 chart-pie-simple·chart-pie-donut·chart-pie-legend를 옮긴
 * 계열 컴포넌트. data의 각 행은 categoryKey(이름)·valueKey(값)와, 조각별
 * 색을 가리키는 fill(예: 'var(--color-chrome)')을 함께 가져야 한다(config의
 * 각 키에 짝지어 둔 색을 그대로 쓰기 위해서다, shadcn 원본과 같은 방식).
 * shadcn 원본과 동일하게 <Cell>은 쓰지 않는다.
 *
 * 자동화된 브라우저 도구로 검증할 때 조각이 안 보이면 recharts의 진입
 * 애니메이션이 requestAnimationFrame 정지로 멈춰 있는 것일 수 있다(원인·검증
 * 방법은 docs/superpowers/plans/2026-08-29-shadcn-charts.md의 Task 5 참고).
 */
export interface ChartPieDatum {
  [key: string]: string | number
  fill: string
}

export function ChartPie({
  title,
  description,
  data,
  config,
  categoryKey,
  valueKey,
  variant = 'pie',
  showLegend = false,
}: {
  title: string
  description: string
  data: ChartPieDatum[]
  config: ChartConfig
  categoryKey: string
  valueKey: string
  variant?: 'pie' | 'donut'
  showLegend?: boolean
}) {
  return (
    <Card className="w-full">
      <CardHeader className="gap-2">
        <CardTitle className="text-16">{title}</CardTitle>
        <CardDescription className="text-14">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
          {/*
           * key를 variant·showLegend에 묶어 리마운트를 강제한다 — Chart Bar의
           * layout·stackId, Chart Area의 stacked와 같은 recharts 3.10.1 버그를
           * 여기서도 재현했다(Playground에서 donut+범례 켬으로 순서대로 토글하면
           * 조각이 하나도 안 그려짐 — sector layer는 만들어지는데 그 안의 실제
           * path가 비어 있었다. SVG를 직접 읽어 확인함). 단일 조합 안에서는
           * 렌더링 결과에 영향 없다.
           */}
          <PieChart key={`${variant}-${showLegend}`}>
            {!showLegend && <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey={categoryKey} />} />}
            <Pie data={data} dataKey={valueKey} nameKey={categoryKey} innerRadius={variant === 'donut' ? '48%' : 0} />
            {showLegend && (
              // recharts 3.10.1의 Legend 선언 타입에는 className이 없다(런타임은 실제로
              // ChartLegendContent까지 그대로 전달돼 동작한다 — Legend.js가 content로
              // 넘기는 모든 props를 cloneElement로 그대로 얹는다, node_modules에서 직접
              // 확인함). shadcn 공식 소스도 같은 코드를 쓴다(그쪽은 recharts 3.8.0을 써서
              // 이 타입 에러가 없다). chart.tsx의 ChartLegend 타입을 넓히는 대신, 여기
              // 호출부 하나에만 스프레드로 좁게 우회한다.
              <ChartLegend
                content={<ChartLegendContent nameKey={categoryKey} />}
                {...{ className: 'flex-wrap gap-2 *:basis-1/4 *:justify-center' }}
              />
            )}
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
