import { supabase } from './supabase'

/*
 * 모먹지(jeomechu) 실사용자 계정 관리. auth.users는 service_role 키가
 * 있어야만 조회·수정·삭제할 수 있는데, 그 키는 브라우저에 절대 두면 안
 * 되므로 Supabase Edge Function(admin-users)을 통해서만 접근한다 — 이
 * 파일은 그 함수를 부르는 얇은 클라이언트일 뿐, 여기엔 민감한 값이 없다.
 *
 * supabase.functions.invoke는 현재 로그인 세션의 Authorization 헤더를
 * 자동으로 실어 보낸다 — admin-users 쪽에서 그 토큰의 이메일이
 * ADMIN_EMAIL과 일치하는지 매 요청마다 다시 확인한다(화면 로그인 게이트만
 * 믿지 않음).
 */
export interface ManagedUser {
  id: string
  email: string | null
  createdAt: string
  lastSignInAt: string | null
  nickname: string | null
  cloudSyncedAt: string | null
  notifyEnabled: boolean
}

async function callAdminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as T
}

export async function listUsers(): Promise<ManagedUser[]> {
  const { users } = await callAdminUsers<{ users: ManagedUser[] }>({ action: 'list' })
  return users
}

export async function updateUserNickname(userId: string, nickname: string): Promise<void> {
  await callAdminUsers({ action: 'update', userId, nickname })
}

export async function deleteUser(userId: string): Promise<void> {
  await callAdminUsers({ action: 'delete', userId })
}
