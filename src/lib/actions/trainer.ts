'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// --- Zod schemas ---

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスを入力してください'),
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),
  role: z.enum(['owner', 'trainer']),
})

const editSchema = z.object({
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以内で入力してください'),
  role: z.enum(['owner', 'trainer']),
})

// --- Helper: owner permission check ---

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_primary')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') redirect('/')

  return { user, profile }
}

// --- Types ---

export type TrainerActionState = {
  success?: boolean
  error?: string
  reactivation?: {
    profileId: string
    displayName: string
  }
}

// --- Actions ---

export async function inviteTrainer(
  _prevState: TrainerActionState,
  formData: FormData
): Promise<TrainerActionState> {
  const { user } = await requireOwner()

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    displayName: formData.get('displayName'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, displayName, role } = parsed.data

  const serviceClient = await createServiceRoleClient()

  // Check if email already exists in profiles
  const { data: existingProfile } = await serviceClient
    .from('profiles')
    .select('id, is_active, display_name')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    if (existingProfile.is_active) {
      return { error: 'このメールアドレスは既に登録されています' }
    }
    // Return reactivation prompt
    return {
      reactivation: {
        profileId: existingProfile.id,
        displayName: existingProfile.display_name,
      },
    }
  }

  // profiles に存在しなくても auth.users に存在する場合は招待不可
  // （セットアップ時に手動作成されたアカウント等）
  const { data: authUsers } = await serviceClient.auth.admin.listUsers()
  const existingAuthUser = authUsers?.users.find((u) => u.email === email)
  if (existingAuthUser) {
    return { error: 'このメールアドレスは既に登録されています' }
  }

  // New invite
  const { error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName, role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=invite`,
  })

  if (error) {
    console.error('[inviteTrainer] Supabase error:', error)
    return { error: '招待メールの送信に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/trainers')
  return { success: true }
}

export async function reactivateTrainer(
  profileId: string,
  displayName: string,
  role: 'owner' | 'trainer'
): Promise<TrainerActionState> {
  await requireOwner()

  const serviceClient = await createServiceRoleClient()

  // Unban the auth user
  const { error: authError } = await serviceClient.auth.admin.updateUserById(profileId, {
    ban_duration: 'none',
  })

  if (authError) {
    return { error: '再有効化に失敗しました。しばらく時間をおいて再試行してください' }
  }

  // Update profile
  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({ is_active: true, display_name: displayName, role })
    .eq('id', profileId)

  if (profileError) {
    return { error: '再有効化に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/trainers')
  return { success: true }
}

export async function editTrainer(
  targetId: string,
  formData: FormData
): Promise<TrainerActionState> {
  const { user } = await requireOwner()

  const parsed = editSchema.safeParse({
    displayName: formData.get('displayName'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { displayName, role } = parsed.data

  const serviceClient = await createServiceRoleClient()

  // Check if target is primary owner - cannot change role
  const { data: targetProfile } = await serviceClient
    .from('profiles')
    .select('is_primary, role')
    .eq('id', targetId)
    .single()

  if (!targetProfile) {
    return { error: '対象ユーザーが見つかりません' }
  }

  if (targetProfile.is_primary && role !== 'owner') {
    return { error: 'プライマリオーナーのロールは変更できません' }
  }

  const { error } = await serviceClient
    .from('profiles')
    .update({ display_name: displayName, role })
    .eq('id', targetId)

  if (error) {
    return { error: '更新に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/trainers')

  // If changing own role from owner to trainer, redirect to home
  if (targetId === user.id && targetProfile.role === 'owner' && role === 'trainer') {
    redirect('/')
  }

  return { success: true }
}

export async function deleteTrainer(targetId: string): Promise<TrainerActionState> {
  const { user } = await requireOwner()

  const serviceClient = await createServiceRoleClient()

  // Verify target
  const { data: targetProfile } = await serviceClient
    .from('profiles')
    .select('is_primary')
    .eq('id', targetId)
    .single()

  if (!targetProfile) {
    return { error: '対象ユーザーが見つかりません' }
  }

  if (targetProfile.is_primary) {
    return { error: 'プライマリオーナーは削除できません' }
  }

  if (targetId === user.id) {
    return { error: '自分自身は削除できません' }
  }

  // Logical delete: set is_active = false
  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({ is_active: false })
    .eq('id', targetId)

  if (profileError) {
    return { error: '削除に失敗しました。しばらく時間をおいて再試行してください' }
  }

  // Ban auth user (disable login)
  const { error: authError } = await serviceClient.auth.admin.updateUserById(targetId, {
    ban_duration: 'forever',
  })

  if (authError) {
    return { error: '削除に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/trainers')
  return { success: true }
}

export async function resendInvite(targetId: string): Promise<TrainerActionState> {
  await requireOwner()

  const serviceClient = await createServiceRoleClient()

  // Get target profile to find email
  const { data: targetProfile } = await serviceClient
    .from('profiles')
    .select('email, display_name, role')
    .eq('id', targetId)
    .single()

  if (!targetProfile) {
    return { error: '対象ユーザーが見つかりません' }
  }

  const { error } = await serviceClient.auth.admin.inviteUserByEmail(targetProfile.email, {
    data: { display_name: targetProfile.display_name, role: targetProfile.role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=invite`,
  })

  if (error) {
    return { error: '招待メールの再送信に失敗しました。しばらく時間をおいて再試行してください' }
  }

  return { success: true }
}
