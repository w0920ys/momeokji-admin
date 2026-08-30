import * as React from 'react'
import { Bell, CloudCheck, Dices, Pencil, Search, Smartphone, Trash2, Users as UsersIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from '@/components/ui/empty-state'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StatCard } from '@/components/ui/stat-card'
import {
  DescriptionList,
  DescriptionItem,
  DescriptionTerm,
  DescriptionDetail,
} from '@/components/ui/description-list'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { type ManagedUser, listUsers, updateUserNickname, deleteUser } from '@/lib/users'
import { type UserActivitySummary, getUserActivity } from '@/lib/metrics/user-activity'
import { entryPathLabel, formatPercent } from '@/lib/format'

/*
 * 모먹지 실사용자 계정 관리 화면. PostHog 이벤트(행동)와는 완전히 다른
 * 데이터 소스다 — 여기는 Supabase auth.users + user_data를 직접 다룬다.
 * 그래서 이 섹션은 App.tsx의 DashboardData를 받지 않고 스스로 fetch한다
 * (SettingsSection의 AlertRulesCard와 같은 패턴).
 */
export function UsersSection() {
  const [users, setUsers] = React.useState<ManagedUser[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const [editing, setEditing] = React.useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = React.useState<ManagedUser | null>(null)
  const [viewing, setViewing] = React.useState<ManagedUser | null>(null)

  const reload = React.useCallback(() => {
    setError(null)
    listUsers()
      .then(setUsers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  React.useEffect(() => {
    reload()
  }, [reload])

  const filtered = React.useMemo(() => {
    if (!users) return null
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => (u.email ?? '').toLowerCase().includes(q) || (u.nickname ?? '').toLowerCase().includes(q))
  }, [users, query])

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <div>
            <AlertTitle>불러오지 못했습니다</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이메일 또는 닉네임 검색"
            className="pl-9"
          />
        </div>
        {users && <span className="text-muted-foreground text-12">전체 {users.length}명</span>}
      </div>

      <Card padding="none">
        <CardContent>
          {!users ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} shape="block" className="h-10" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <Table label="모먹지 사용자 목록">
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>마지막 로그인</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} onClick={() => setViewing(u)} className="hover:bg-accent/50 cursor-pointer">
                    <TableCell className="font-medium">{u.email ?? '(이메일 없음)'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.nickname || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.lastSignInAt ? formatDate(u.lastSignInAt) : '로그인 이력 없음'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {u.cloudSyncedAt && (
                          <Badge variant="success">
                            <CloudCheck className="size-3" aria-hidden />
                            동기화됨
                          </Badge>
                        )}
                        {u.notifyEnabled && (
                          <Badge variant="info">
                            <Bell className="size-3" aria-hidden />
                            알림 켬
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditing(u)
                          }}
                          aria-label={`${u.email ?? u.id} 닉네임 수정`}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleting(u)
                          }}
                          aria-label={`${u.email ?? u.id} 계정 삭제`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState variant="no-results" size="compact">
              <EmptyStateIcon>
                <UsersIcon aria-hidden />
              </EmptyStateIcon>
              <EmptyStateTitle>{users.length === 0 ? '가입한 사용자가 없습니다' : '검색 결과가 없습니다'}</EmptyStateTitle>
              {users.length > 0 && <EmptyStateDescription>다른 검색어로 시도해보세요.</EmptyStateDescription>}
            </EmptyState>
          )}
        </CardContent>
      </Card>

      {viewing && <UserDetailDialog user={viewing} onClose={() => setViewing(null)} />}
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
            reload()
          }}
        />
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
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

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/*
 * 유저 1명의 행동 상세. Supabase 쪽 정보(이메일·닉네임·가입일 등)는 이미
 * 목록에서 갖고 있으니 그대로 받아 쓰고, 기기·유입경로·룰렛 사용 같은
 * PostHog 쪽 정보만 다이얼로그가 열릴 때 온디맨드로 불러온다(목록 로드
 * 시점에 전원 조회하면 유저 수만큼 쿼리가 나가 비싸진다).
 */
function UserDetailDialog({ user, onClose }: { user: ManagedUser; onClose: () => void }) {
  const [activity, setActivity] = React.useState<UserActivitySummary | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setActivity(null)
    setError(null)
    getUserActivity(user.id).then(
      (a) => {
        if (!cancelled) setActivity(a)
      },
      (e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      },
    )
    return () => {
      cancelled = true
    }
  }, [user.id])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{user.nickname || user.email}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <DescriptionList layout="stacked" columns="two">
          <DescriptionItem>
            <DescriptionTerm>가입일</DescriptionTerm>
            <DescriptionDetail>{formatDate(user.createdAt)}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>마지막 로그인</DescriptionTerm>
            <DescriptionDetail>{user.lastSignInAt ? formatDate(user.lastSignInAt) : '로그인 이력 없음'}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>상태</DescriptionTerm>
            <DescriptionDetail>
              <div className="flex flex-wrap gap-1.5">
                {user.cloudSyncedAt && <Badge variant="success">동기화됨</Badge>}
                {user.notifyEnabled && <Badge variant="info">알림 켬</Badge>}
                {!user.cloudSyncedAt && !user.notifyEnabled && <span className="text-muted-foreground">—</span>}
              </div>
            </DescriptionDetail>
          </DescriptionItem>
        </DescriptionList>

        <div className="border-t pt-4">
          {error && (
            <Alert variant="destructive">
              <div>
                <AlertTitle>행동 데이터를 불러오지 못했습니다</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {!error && !activity && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} shape="block" className="h-9" />
              ))}
            </div>
          )}

          {activity && !activity.found && (
            <EmptyState variant="no-results" size="compact">
              <EmptyStateIcon>
                <Smartphone aria-hidden />
              </EmptyStateIcon>
              <EmptyStateTitle>계측 데이터가 없습니다</EmptyStateTitle>
              <EmptyStateDescription>
                아직 이 사람 이름으로 잡힌 PostHog 이벤트가 없어요 — 로그인 전이거나, 테스트 모드(?ph_test=1)로만
                써봤을 수 있습니다.
              </EmptyStateDescription>
            </EmptyState>
          )}

          {activity && activity.found && (
            <div className="flex flex-col gap-4">
              <DescriptionList layout="stacked" columns="two">
                <DescriptionItem>
                  <DescriptionTerm>
                    <Smartphone className="mr-1 inline size-3.5" aria-hidden />
                    기기·브라우저
                  </DescriptionTerm>
                  <DescriptionDetail>{activity.device ?? '알 수 없음'}</DescriptionDetail>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>유입 경로</DescriptionTerm>
                  <DescriptionDetail>{activity.entry ? entryPathLabel(activity.entry) : '알 수 없음'}</DescriptionDetail>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>첫 방문</DescriptionTerm>
                  <DescriptionDetail>{activity.firstSeen ? formatDateTime(activity.firstSeen) : '—'}</DescriptionDetail>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>최근 활동</DescriptionTerm>
                  <DescriptionDetail>{activity.lastActive ? formatDateTime(activity.lastActive) : '—'}</DescriptionDetail>
                </DescriptionItem>
              </DescriptionList>

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="스핀" value={String(activity.spins)} />
                <StatCard label="확정" value={String(activity.confirms)} />
                <StatCard label="Spin → Confirm" value={formatPercent(activity.spinToConfirmRate)} hint="이 유저의 전환율" />
              </div>
              <p className="text-muted-foreground text-12">
                <Dices className="mr-1 inline size-3" aria-hidden />
                최근 이벤트 {activity.totalEvents}건 기준(최대 500건까지 조회)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              닫기
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
