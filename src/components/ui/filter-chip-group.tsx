import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

/*
 * 여러 값을 동시에 켤 수 있는 칩 줄. 유저 관리 화면에서 두 곳이 이걸
 * 공유한다 — 목록의 "구분"(회원/비회원) 필터, 상세 패널의 속성 카테고리
 * 필터. 이 킷엔 팝오버/멀티셀렉트 드롭다운이 없고(select.tsx는 단일
 * 선택뿐), 사용자가 승인한 목업도 숨겨진 드롭다운이 아니라 항상 보이는
 * 인라인 칩이었다 — 그래서 새 프리미티브를 만들지 않고 Checkbox +
 * 라벨 하나로 짠다.
 *
 * 체크 상태에 따라 라벨(=칩) 배경을 바꾸는 데 Tailwind v4의
 * has-[...]를 쓴다 — card.tsx의 CardHeader가 이미 같은 방식(has-[[data-slot=card-action]])을
 * 쓰고 있어 이 킷의 관례에 맞춘다. 체크박스 자체도 실제 클릭 가능한
 * 요소로 남겨둔다(칩 전체가 label이라 어디를 눌러도 토글되지만, 시각
 * 표시기가 있는 편이 "이게 토글 가능한 필터"라는 신호를 더 분명히 준다).
 */
export interface FilterChipOption<T extends string> {
  value: T
  label: string
  count?: number
}

export function FilterChipGroup<T extends string>({
  options,
  selected,
  onChange,
  groupLabel,
}: {
  options: FilterChipOption<T>[]
  selected: Set<T>
  onChange: (next: Set<T>) => void
  /** sr-only 그룹 이름 — "이 칩 줄이 뭘 거르는가". */
  groupLabel: string
}) {
  function toggle(value: T, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(value)
    else next.delete(value)
    onChange(next)
  }

  return (
    <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-12 font-medium transition-colors',
            'text-muted-foreground border-input',
            'has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground has-[[data-state=checked]]:border-primary',
          )}
        >
          <Checkbox
            checked={selected.has(opt.value)}
            onCheckedChange={(v) => toggle(opt.value, v === true)}
            className="size-3.5 border-current data-[state=checked]:bg-transparent data-[state=checked]:text-current"
          />
          {opt.label}
          {opt.count != null && <span className="opacity-70">{opt.count}</span>}
        </label>
      ))}
    </div>
  )
}
