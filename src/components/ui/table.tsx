import * as React from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type TableDensity = 'default' | 'compact'

/*
 * density는 표 전체가 한 값을 공유한다. 행마다 값을 다시 넘기지 않도록
 * Context로 내려보낸다 — Table이 정하고 TableRow가 읽는다.
 */
const TableDensityContext = React.createContext<TableDensity>('default')

/*
 * 열이 화면보다 넓으면 가로로 스크롤한다. overflow-x-auto를 표 자체에
 * 두어, 이 표를 담는 문서 예시 상자(overflow-hidden)에 잘리기 전에
 * 표 안에서 먼저 스크롤이 생긴다. className은 이 바깥 스크롤 그릇에
 * 적용된다 — <table>은 항상 w-full이다.
 *
 * 스크롤 그릇은 role="region"·tabIndex={0}으로 키보드 포커스를 받는다
 * (WCAG 2.1.1) — sticky 첫 열은 가로 스크롤 자체를 대신하지 않는다.
 * 포인터가 없으면 이 칸으로 Tab이 와서 방향키로 훑을 수 있어야 한다.
 * label은 필수다 — region에는 이름이 있어야 하는데 이 컴포넌트는 표
 * 안의 내용을 모르므로 호출한 쪽이 채워야 한다.
 */
function Table({
  className,
  density = 'default',
  label,
  children,
  ...props
}: React.ComponentProps<'table'> & { density?: TableDensity; label: string }) {
  return (
    <TableDensityContext.Provider value={density}>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          'w-full overflow-x-auto rounded-md border outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
          className,
        )}
      >
        <table data-slot="table" className="w-full caption-bottom text-14" {...props}>
          {children}
        </table>
      </div>
    </TableDensityContext.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('bg-surface', className)} {...props} />
}

/*
 * 마지막 행의 아래 테두리를 지운다 — 표 바깥에 이미 wrapper 테두리가
 * 있어 겹치면 두 줄로 보인다. thead의 머리 행은 건드리지 않아야 하므로
 * (본문과 갈라주는 테두리는 항상 있어야 한다) TableRow 자체가 아니라
 * TableBody의 직계 자식에만 건다.
 */
function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody data-slot="table-body" className={cn('[&>tr:last-child]:border-b-0', className)} {...props} />
  )
}

/*
 * 행은 면이지 테두리 있는 컨트롤이 아니다 — hover를 배경으로 나타낸다
 * (Input·Select·Checkbox의 hover는 테두리지만, 그건 테두리 있는
 * 껍데기를 가진 컨트롤이라서다). group을 달아 sticky 칸이 행의
 * hover·selected 배경을 함께 따라가게 한다 — sticky 칸은 자기 배경을
 * 따로 칠하므로 group 없이는 행이 물들어도 그 칸만 그대로다.
 */
function TableRow({
  className,
  selected,
  ...props
}: React.ComponentProps<'tr'> & { selected?: boolean }) {
  const density = React.useContext(TableDensityContext)
  return (
    <tr
      data-slot="table-row"
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'group border-b transition-colors',
        'hover:bg-muted/50 data-[state=selected]:bg-accent',
        density === 'compact' ? 'h-row-compact' : 'h-row',
        className,
      )}
      {...props}
    />
  )
}

/*
 * sticky는 첫 열을 고정할 때만 켠다. 배경은 group-hover·
 * group-data-[state=selected]로 부모 행의 배경을 그대로 따라간다 —
 * 그렇지 않으면 스크롤로 다른 칸이 밑을 지나갈 때 고정된 칸만 색이
 * 어긋난다.
 */
function TableHead({
  className,
  numeric,
  sticky,
  sortable,
  sortDirection = false,
  onClick,
  children,
  ...props
}: React.ComponentProps<'th'> & {
  numeric?: boolean
  sticky?: boolean
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | false
}) {
  const ariaSort = sortDirection === false ? 'none' : sortDirection === 'asc' ? 'ascending' : 'descending'

  return (
    <th
      scope="col"
      data-slot="table-head"
      /*
       * aria-sort는 정렬 가능한 열에만 싣는다. 정렬 가능하지 않은 열에
       * 'none'을 실으면 보조 기술에 정렬할 수 있다고 말하는 것이 된다.
       */
      aria-sort={sortable ? ariaSort : undefined}
      onClick={sortable ? undefined : onClick}
      className={cn(
        'text-muted-foreground h-full px-3 text-left align-middle text-12 font-bold whitespace-nowrap',
        numeric && 'text-right',
        sticky && 'bg-surface sticky left-0 z-sticky',
        className,
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          data-slot="table-sort-button"
          /*
           * TableHead의 공개 onClick은 보통 올라앉는 th를 기준으로
           * 타입이 잡혀 있다(정렬 불가능한 열은 currentTarget.scope
           * 같은 th 전용 멤버를 그대로 읽을 수 있어야 하므로 props
           * 전체를 넓히지 않는다). 정렬 가능한 열은 같은 핸들러를
           * 안쪽 button으로 그대로 넘길 뿐이라 여기서만 좁혀 쓴다.
           */
          onClick={onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
          className={cn(
            'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -mx-1 inline-flex items-center gap-1 rounded px-1 outline-none focus-visible:ring-2',
            numeric && 'flex-row-reverse',
          )}
        >
          {children}
          {/*
           * 방향 아이콘 자리는 정렬되지 않은 열에도 남긴다. 나타났다 사라지면
           * 누를 때마다 머리의 너비가 바뀌어 표가 튄다.
           */}
          <ChevronUp
            data-slot="table-sort-indicator"
            size={12}
            aria-hidden
            className={cn(
              'shrink-0 transition-transform',
              sortDirection === false && 'opacity-0',
              sortDirection === 'desc' && 'rotate-180',
            )}
          />
        </button>
      ) : (
        children
      )}
    </th>
  )
}

function TableCell({
  className,
  numeric,
  sticky,
  ...props
}: React.ComponentProps<'td'> & { numeric?: boolean; sticky?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-3 align-middle text-14 whitespace-nowrap',
        numeric && 'text-right tabular-nums',
        sticky && 'bg-background sticky left-0 z-sticky group-hover:bg-muted/50 group-data-[state=selected]:bg-accent',
        className,
      )}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
