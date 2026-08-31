import type { ManagedUser } from './users'
import type { AnonymousVisitor } from './metrics/anonymous-visitors'

/*
 * 유저 목록 화면 하나가 "회원"(Supabase auth.users, ManagedUser)과
 * "비회원"(PostHog 익명 person, AnonymousVisitor)을 섞어서 보여줘야 하는데,
 * 두 타입은 실제로 필드가 다르다(회원은 nickname/cloudSyncedAt/notifyEnabled,
 * 비회원은 properties 원본/geoip) — 억지로 하나의 평평한 타입으로 합치면
 * 화면 곳곳에서 "이 필드는 회원일 때만 있음" 같은 null 체크가 반복된다.
 * 그래서 판별 유니온으로 감싸기만 하고, 실제 값은 원래 타입 그대로 들고
 * 있는다 — EditNicknameDialog/DeleteUserDialog처럼 회원 전용 동작은
 * row.kind === 'member'로 좁힌 뒤 row.member를 그대로 넘기면 된다.
 */
export type UserDirectoryRow =
  | { kind: 'member'; id: string; member: ManagedUser }
  | { kind: 'guest'; id: string; guest: AnonymousVisitor }

export function toDirectoryRows(members: ManagedUser[], guests: AnonymousVisitor[]): UserDirectoryRow[] {
  return [
    ...members.map((member): UserDirectoryRow => ({ kind: 'member', id: member.id, member })),
    ...guests.map((guest): UserDirectoryRow => ({ kind: 'guest', id: guest.personId, guest })),
  ]
}
