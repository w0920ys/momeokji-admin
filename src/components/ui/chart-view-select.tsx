import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/*
 * 차트 카드 하나가 같은 데이터를 다른 모양으로도 보여줄 수 있을 때 쓰는
 * 작은 드롭다운. CardHeader의 card-action 자리에 꽂는다 — CardHeader가
 * card-action 유무로 grid-cols를 켜고 끄므로(card.tsx 로컬 수정 참고),
 * 이 컴포넌트를 CardAction으로 감싸면 자동으로 우측 상단에 정렬된다.
 *
 * "이 지표를 다른 모양으로도 보고 싶다"는 요청에 대한 답이지만, 데이터가
 * 실제로 그 모양을 지지할 때만 쓴다 — 예를 들어 다계열 추세선(날짜별
 * PWA/앱인토스처럼 시리즈가 여럿인 데이터)은 막대로 억지로 바꾸면 계열이
 * 뭉개지므로 여기 옵션에 넣지 않는다. {label, value} 하나로 도넛·가로
 * 막대·세로 막대를 오가거나, {step, value}를 퍼널·막대로 오가는 것처럼
 * 같은 데이터 shape으로 뜻이 바뀌지 않는 조합에만 쓴다.
 */
export interface ChartViewOption {
  value: string
  label: string
}

export function ChartViewSelect({
  value,
  onValueChange,
  options,
  label,
}: {
  value: string
  onValueChange: (value: string) => void
  options: ChartViewOption[]
  /** sr-only 트리거 이름 — "이 드롭다운이 무엇의 보기 방식을 바꾸는가" */
  label: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className="h-7 w-auto gap-1 px-2 text-12" aria-label={`${label} 보기 방식`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
