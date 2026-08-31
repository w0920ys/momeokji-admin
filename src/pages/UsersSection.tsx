import * as React from 'react'
import { Search, Users as UsersIcon, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from '@/components/ui/empty-state'
import { FilterChipGroup } from '@/components/ui/filter-chip-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { type ManagedUser, listUsers, updateUserNickname, deleteUser } from '@/lib/users'
import { type AnonymousVisitor, listAnonymousVisitors } from '@/lib/metrics/anonymous-visitors'
import { toDirectoryRows, type UserDirectoryRow } from '@/lib/user-directory'
import { formatRelativeTime } from '@/lib/format'
import { UserDetailPanel } from '@/pages/users/UserDetailPanel'
import { cn } from '@/lib/utils'

type Demographic = 'member' | 'guest'

/*
 * 모먹지 실사용자 계정 관리 화면. PostHog 이벤트(행동)와는 완전히 다른
 * 데이터 소스다 — 여기는 Supabase auth.users + user_data, 그리고(신규)
 * PostHog persons 테이블을 직접 다룬다. 그래서 이 섹션은 App.tsx의
 * DashboardData를 받지 않고 스스로 fetch한다(SettingsSection의
 * AlertRulesCard와 같은 패턴).
 *
 * 예전엔 행 클릭 → Dialog였는데, 지금은 EventCatalogSection과 같은
 * 마스터-디테일(좌: 목록, 우: 상세 패널)로 바꿨다 — 다이얼로그는 한 번에
 * 하나만 보여줘서 여러 유저를 훑어보며 비교하기 불편했다.
 *
 * 목록 행에는 일부러 방문 횟수를 안 보여준다 — 유저마다 PostHog 쿼리를
 * 하나씩 더 쏘면(N+1) 목록 로드 자체가 유저 수만큼 비싸진다. 대신 이미
 * 공짜로 있는 값(회원: Supabase lastSignInAt, 비회원: PostHog persons
 * 목록 조회에 이미 포함된 createdAt)만 부제로 쓰고, 실제 "하루에 몇 번
 * 들어왔는지"는 상세 패널을 열 때만 온디맨드로 조회한다(UserDetailPanel).
 */
export function UsersSection() {
  const [members, setMembers] = React.useState<ManagedUser[] | null>(null)
  const [guests, setGuests] = React.useState<AnonymousVisitor[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [guestError, setGuestError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const [demographic, setDemographic] = React.useState<Set<Demographic>>(new Set(['member', 'guest']))
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = React.useState<ManagedUser | null>(null)

  const reload = React.useCallback(() => {
    setError(null)
    listUsers()
      .then(setMembers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
    // 비회원 목록은 실패해도 화면 전체를 막지 않는다 — 회원 관리는 그대로
    // 되는 게 더 중요하다. persons 테이블 쿼리는 이 저장소에서 처음
    // 시도하는 것이라(anonymous-visitors.ts 주석 참고) 실패 가능성을
    // 더 진지하게 대비해야 한다.
    setGuestError(null)
    listAnonymousVisitors()
      .then(setGuests)
      .catch((e: unknown) => {
        setGuests([])
        setGuestError(e instanceof Error ? e.message : String(e))
      })
  }, [])

  React.useEffect(() => {
    reload()
  }, [reload])

  const rows = React.useMemo(() => {
    if (!members || !guests) return null
    return toDirectoryRows(members, guests)
  }, [members, guests])

  const filtered = React.useMemo(() => {
    if (!rows) return null
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (!demographic.has(row.kind)) return false
      if (!q) return true
      if (row.kind === 'member') {
        return (row.member.email ?? '').toLowerCase().includes(q) || (row.member.nickname ?? '').toLowerCase().includes(q)
      }
      return (row.guest.city ?? '').toLowerCase().includes(q) || row.guest.personId.toLowerCase().includes(q)
    })
  }, [rows, query, demographic])

  // 목록이 처음 열리거나 필터링으로 지금 선택된 행이 사라지면, 눈에 보이는
  // 첫 행을 자동 선택한다 — EventCatalogSection이 EVENT_CATALOG[0]을
  // 기본 선택하는 것과 같은 이유(우측이 빈 화면으로 시작하지 않게).
  React.useEffect(() => {
    if (!filtered) return
    if (selectedId && filtered.some((r) => r.id === selectedId)) return
    setSelectedId(filtered[0]?.id ?? null)
  }, [filtered, selectedId])

  const selectedRow = filtered?.find((r) => r.id === selectedId) ?? null

  const memberCount = members?.length ?? 0
  const guestCount = guests?.length ?? 0

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <div>
            <AlertTitle>회원 목록을 불러오지 못했습니다</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}
      {guestError && (
        <Alert variant="warning">
          <div>
            <AlertTitle>비회원(PostHog) 방문자를 불러오지 못했습니다</AlertTitle>
            <AlertDescription>회원 목록은 정상입니다. {guestError}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card padding="none" className="h-fit lg:sticky lg:top-4">
          <div className="flex flex-col gap-2 p-2 pb-0">
            <FilterChipGroup
              groupLabel="구분"
              options={[
                { value: 'member', label: '회원', count: memberCount },
                { value: 'guest', label: '비회원', count: guestCount },
              ]}
              selected={demographic}
              onChange={setDemographic}
            />
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이메일 · 닉네임 · 지역 검색"
                className="h-8 pl-8 text-[12px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                  aria-label="검색어 지우기"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <CardContent className="max-h-[70vh] overflow-y-auto p-2">
            {!rows ? (
              <div className="flex flex-col gap-2 p-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} shape="block" className="h-12" />
                ))}
              </div>
            ) : filtered && filtered.length > 0 ? (
              filtered.map((row) => <UserRow key={row.id} row={row} active={row.id === selectedId} onClick={() => setSelectedId(row.id)} />)
            ) : (
              <EmptyState variant="no-results" size="compact">
                <EmptyStateIcon>
                  <UsersIcon aria-hidden />
                </EmptyStateIcon>
                <EmptyStateTitle>{rows.length === 0 ? '표시할 유저가 없습니다' : '검색 결과가 없습니다'}</EmptyStateTitle>
                {rows.length > 0 && <EmptyStateDescription>다른 검색어나 구분 필터로 시도해보세요.</EmptyStateDescription>}
              </EmptyState>
            )}
          </CardContent>
        </Card>

        {selectedRow ? (
          <UserDetailPanel
            row={selectedRow}
            onEdit={(u) => setEditing(u)}
            onDelete={(u) => setDeleting(u)}
          />
        ) : (
          <Card>
            <CardContent>
              <EmptyState variant="no-results" size="compact">
                <EmptyStateIcon>
                  <UsersIcon aria-hidden />
                </EmptyStateIcon>
                <EmptyStateTitle>왼쪽에서 유저를 선택하세요</EmptyStateTitle>
              </EmptyState>
            </CardContent>
          </Card>
        )}
      </div>

      {editing && (
        <EditNicknameDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
      {deleting && (
        <DeleteUserDialog
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            // 삭제된 행이 목록에서 사라지므로, 거기 가리키고 있던 선택도
            // 같이 비운다 — 그대로 두면 상세 패널이 사라진 유저를 계속
            // 가리키는 채로 남는다.
            setSelectedId(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function UserRow({ row, active, onClick }: { row: UserDirectoryRow; active: boolean; onClick: () => void }) {
  const isMember = row.kind === 'member'
  const title = isMember ? row.member.nickname || row.member.email || '(이메일 없음)' : row.guest.city ? `익명 방문자 · ${row.guest.city}` : '익명 방문자'
  const subtitle = isMember
    ? row.member.lastSignInAt
      ? `마지막 로그인 ${formatRelativeTime(row.member.lastSignInAt)}`
      : '로그인 이력 없음'
    : `최초 방문 ${formatRelativeTime(row.guest.createdAt)}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-13 font-medium">{title}</span>
        <span className="text-muted-foreground truncate text-11">{subtitle}</span>
      </div>
      <Badge variant={isMember ? 'info' : 'neutral'}>{isMember ? '회원' : '비회원'}</Badge>
    </button>
  )
}

function EditNicknameDialog({ user, onClose, onSaved }: { user: ManagedUser; onClose: () => void; onSaved: () => void }) {
  const [nickname, setNickname] = React.useState(user.nickname ?? '')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await updateUserNickname(user.id, nickname.trim())
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>닉네임 수정</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            autoFocus
            maxLength={20}
          />
          {error && <p className="text-destructive-on-tint text-12">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? '저장 중…' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserDialog({ user, onClose, onDeleted }: { user: ManagedUser; onClose: () => void; onDeleted: () => void }) {
  const [confirmText, setConfirmText] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const matches = confirmText.trim() === user.email

  async function handleDelete() {
    if (!matches) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteUser(user.id)
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>계정을 삭제할까요?</DialogTitle>
          <DialogDescription>
            {user.email}의 계정과 클라우드에 백업된 모든 데이터가 영구적으로 삭제됩니다. 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="delete-confirm-email" className="text-12 font-medium">
            확인을 위해 이메일을 입력하세요
          </label>
          <Input
            id="delete-confirm-email"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={user.email ?? ''}
            autoFocus
          />
        </div>
        {error && <p className="text-destructive-on-tint text-12">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              취소
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" disabled={!matches || submitting} onClick={handleDelete}>
            {submitting ? '삭제 중…' : '영구 삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
