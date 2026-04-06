'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export const CATEGORIES = ['胸', '背中', '脚', '肩', '腕', '腹', '有酸素', 'その他'] as const
export type Category = (typeof CATEGORIES)[number]

const exerciseSchema = z.object({
  name: z
    .string()
    .min(1, '種目名を入力してください')
    .max(50, '種目名は50文字以内で入力してください'),
  category: z.enum(CATEGORIES, { message: 'カテゴリを選択してください' }),
})

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  return { user, profile, supabase }
}

async function requireOwner() {
  const { user, profile, supabase } = await requireAuth()
  if (profile.role !== 'owner') redirect('/')
  return { user, profile, supabase }
}

export type ExerciseActionState = {
  success?: boolean
  error?: string
}

export async function addExercise(
  _prevState: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  await requireAuth()

  const parsed = exerciseSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, category } = parsed.data
  const supabase = await createClient()

  // 重複チェック（is_active 問わず）
  const { data: existing } = await supabase
    .from('exercise_master')
    .select('id')
    .eq('name', name)
    .eq('category', category)
    .maybeSingle()

  if (existing) {
    return { error: '同じカテゴリに同名の種目が既に存在します' }
  }

  const { error } = await supabase
    .from('exercise_master')
    .insert({ name, category, is_system: false, is_active: true })

  if (error) {
    return { error: '種目の追加に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/exercises')
  return { success: true }
}

export async function editExercise(
  exerciseId: string,
  formData: FormData
): Promise<ExerciseActionState> {
  await requireOwner()

  const parsed = exerciseSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, category } = parsed.data
  const supabase = await createClient()

  // 自分自身を除いた重複チェック
  const { data: existing } = await supabase
    .from('exercise_master')
    .select('id')
    .eq('name', name)
    .eq('category', category)
    .neq('id', exerciseId)
    .maybeSingle()

  if (existing) {
    return { error: '同じカテゴリに同名の種目が既に存在します' }
  }

  const { error } = await supabase
    .from('exercise_master')
    .update({ name, category })
    .eq('id', exerciseId)

  if (error) {
    return { error: '更新に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/exercises')
  return { success: true }
}

export async function deactivateExercise(exerciseId: string): Promise<ExerciseActionState> {
  await requireOwner()

  const supabase = await createClient()
  const { error } = await supabase
    .from('exercise_master')
    .update({ is_active: false })
    .eq('id', exerciseId)

  if (error) {
    return { error: '無効化に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/exercises')
  return { success: true }
}

export async function reactivateExercise(exerciseId: string): Promise<ExerciseActionState> {
  await requireOwner()

  const supabase = await createClient()
  const { error } = await supabase
    .from('exercise_master')
    .update({ is_active: true })
    .eq('id', exerciseId)

  if (error) {
    return { error: '再有効化に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/admin/exercises')
  return { success: true }
}
