'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const KATAKANA_REGEX = /^[ァ-ヶー\s　]+$/

const customerSchema = z.object({
  name: z
    .string()
    .min(1, '氏名を入力してください')
    .max(50, '氏名は50文字以内で入力してください'),
  nameKana: z
    .string()
    .min(1, 'フリガナを入力してください')
    .max(50, 'フリガナは50文字以内で入力してください')
    .regex(KATAKANA_REGEX, 'フリガナは全角カタカナで入力してください'),
  gender: z
    .enum(['male', 'female', 'other'])
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      return date <= new Date()
    }, '生年月日に未来の日付は指定できません'),
  notes: z
    .string()
    .max(500, 'メモは500文字以内で入力してください')
    .optional()
    .nullable(),
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

export type CustomerActionState = {
  success?: boolean
  error?: string
}

export async function addCustomer(
  _prevState: CustomerActionState | undefined,
  formData: FormData
): Promise<CustomerActionState> {
  await requireAuth()

  const gender = formData.get('gender')
  const dateOfBirth = formData.get('dateOfBirth')
  const notes = formData.get('notes')

  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    nameKana: formData.get('nameKana'),
    gender: gender || null,
    dateOfBirth: dateOfBirth || null,
    notes: notes || null,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, nameKana, gender: parsedGender, dateOfBirth: parsedDob, notes: parsedNotes } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .insert({
      name,
      name_kana: nameKana,
      gender: parsedGender ?? null,
      date_of_birth: parsedDob ?? null,
      notes: parsedNotes ?? null,
      is_active: true,
    })

  if (error) {
    return { error: '顧客の追加に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/customers')
  return { success: true }
}

export async function editCustomer(
  customerId: string,
  formData: FormData
): Promise<CustomerActionState> {
  await requireAuth()

  const gender = formData.get('gender')
  const dateOfBirth = formData.get('dateOfBirth')
  const notes = formData.get('notes')

  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    nameKana: formData.get('nameKana'),
    gender: gender || null,
    dateOfBirth: dateOfBirth || null,
    notes: notes || null,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, nameKana, gender: parsedGender, dateOfBirth: parsedDob, notes: parsedNotes } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({
      name,
      name_kana: nameKana,
      gender: parsedGender ?? null,
      date_of_birth: parsedDob ?? null,
      notes: parsedNotes ?? null,
    })
    .eq('id', customerId)

  if (error) {
    return { error: '更新に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/customers')
  revalidatePath(`/customers/${customerId}`)
  return { success: true }
}

export async function deactivateCustomer(customerId: string): Promise<CustomerActionState> {
  await requireOwner()

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', customerId)

  if (error) {
    return { error: '退会処理に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/customers')
  revalidatePath(`/customers/${customerId}`)
  return { success: true }
}

export async function reactivateCustomer(customerId: string): Promise<CustomerActionState> {
  await requireOwner()

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ is_active: true })
    .eq('id', customerId)

  if (error) {
    return { error: '再有効化に失敗しました。しばらく時間をおいて再試行してください' }
  }

  revalidatePath('/customers')
  revalidatePath(`/customers/${customerId}`)
  return { success: true }
}
