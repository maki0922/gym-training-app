'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ---------- helpers ----------

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

function todayJST(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

async function requireOwner() {
  const { user, profile, supabase } = await requireAuth()
  if (profile.role !== 'owner') redirect('/')
  return { user, profile, supabase }
}

// ---------- types ----------

export type DuplicateSession = {
  id: string
  trainerName: string
  status: 'in_progress' | 'completed'
}

export type SessionActionState = {
  success?: boolean
  error?: string
  sessionId?: string
  duplicates?: DuplicateSession[]
}

// ---------- 8-1 & 8-2: セッション作成 ----------

export async function checkDuplicateSession(
  customerId: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()
  const today = todayJST()

  const { data: existing } = await supabase
    .from('training_sessions')
    .select(`
      id,
      status,
      trainer_id,
      profiles!training_sessions_trainer_id_fkey (
        display_name
      )
    `)
    .eq('customer_id', customerId)
    .eq('session_date', today)
    .eq('is_deleted', false)

  if (existing && existing.length > 0) {
    const duplicates: DuplicateSession[] = existing.map((s) => ({
      id: s.id,
      trainerName: (s.profiles as { display_name: string } | null)?.display_name ?? '不明',
      status: s.status as 'in_progress' | 'completed',
    }))
    return { duplicates }
  }

  return { success: true }
}

export async function createSession(
  customerId: string
): Promise<SessionActionState> {
  const { user, supabase } = await requireAuth()
  const today = todayJST()

  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      customer_id: customerId,
      trainer_id: user.id,
      session_date: today,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'セッションの作成に失敗しました。再試行してください' }
  }

  revalidatePath(`/customers/${customerId}`)
  return { success: true, sessionId: data.id }
}

// ---------- 8-3 & 8-4: 種目追加（マスタ選択） ----------

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  // 現在の種目数を取得してsort_orderを決定
  const { count } = await supabase
    .from('training_records')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const sortOrder = (count ?? 0) + 1

  const { data: record, error } = await supabase
    .from('training_records')
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      sort_order: sortOrder,
    })
    .select('id')
    .single()

  if (error || !record) {
    return { error: '種目の追加に失敗しました。再試行してください' }
  }

  // 初回セットを自動作成
  await supabase
    .from('training_sets')
    .insert({
      record_id: record.id,
      set_number: 1,
    })

  revalidatePath(`/sessions/${sessionId}/edit`)
  return { success: true }
}

// ---------- 8-5: 種目追加（自由入力） ----------

export async function addFreeExerciseToSession(
  sessionId: string,
  exerciseName: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  const trimmed = exerciseName.trim()
  if (!trimmed) return { error: '種目名を入力してください' }
  if (trimmed.length > 50) return { error: '種目名は50文字以内で入力してください' }

  const { count } = await supabase
    .from('training_records')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const sortOrder = (count ?? 0) + 1

  const { data: record, error } = await supabase
    .from('training_records')
    .insert({
      session_id: sessionId,
      exercise_id: null,
      exercise_name_manual: trimmed,
      sort_order: sortOrder,
    })
    .select('id')
    .single()

  if (error || !record) {
    return { error: '種目の追加に失敗しました。再試行してください' }
  }

  // 初回セットを自動作成
  await supabase
    .from('training_sets')
    .insert({
      record_id: record.id,
      set_number: 1,
    })

  revalidatePath(`/sessions/${sessionId}/edit`)
  return { success: true }
}

// ---------- 8-6: セット追加 ----------

export async function addSet(
  sessionId: string,
  recordId: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  const { count } = await supabase
    .from('training_sets')
    .select('id', { count: 'exact', head: true })
    .eq('record_id', recordId)

  const setNumber = (count ?? 0) + 1

  const { error } = await supabase
    .from('training_sets')
    .insert({
      record_id: recordId,
      set_number: setNumber,
    })

  if (error) {
    return { error: 'セットの追加に失敗しました。再試行してください' }
  }

  revalidatePath(`/sessions/${sessionId}/edit`)
  return { success: true }
}

// ---------- 8-6: セット更新（onBlur保存） ----------

export async function updateSet(
  setId: string,
  weight: number | null,
  reps: number | null,
  notes: string | null
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('training_sets')
    .update({
      weight,
      reps,
      notes: notes || null,
    })
    .eq('id', setId)

  if (error) {
    return { error: '保存に失敗しました' }
  }

  // revalidatePathは呼ばない（フォーカス喪失防止）
  return { success: true }
}

// ---------- 8-10: セット削除 ----------

export async function deleteSet(
  sessionId: string,
  setId: string,
  recordId: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('training_sets')
    .delete()
    .eq('id', setId)

  if (error) {
    return { error: '削除に失敗しました。再試行してください' }
  }

  // set_numberを振り直す
  const { data: remainingSets } = await supabase
    .from('training_sets')
    .select('id')
    .eq('record_id', recordId)
    .order('set_number', { ascending: true })

  if (remainingSets) {
    for (let i = 0; i < remainingSets.length; i++) {
      await supabase
        .from('training_sets')
        .update({ set_number: i + 1 })
        .eq('id', remainingSets[i].id)
    }
  }

  revalidatePath(`/sessions/${sessionId}/edit`)
  return { success: true }
}

// ---------- 8-10: 種目削除 ----------

export async function deleteRecord(
  sessionId: string,
  recordId: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  // カスケード削除で training_sets も自動削除される
  const { error } = await supabase
    .from('training_records')
    .delete()
    .eq('id', recordId)

  if (error) {
    return { error: '削除に失敗しました。再試行してください' }
  }

  // sort_orderを振り直す
  const { data: remainingRecords } = await supabase
    .from('training_records')
    .select('id')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true })

  if (remainingRecords) {
    for (let i = 0; i < remainingRecords.length; i++) {
      await supabase
        .from('training_records')
        .update({ sort_order: i + 1 })
        .eq('id', remainingRecords[i].id)
    }
  }

  revalidatePath(`/sessions/${sessionId}/edit`)
  return { success: true }
}

// ---------- 8-11: 種目メモ更新 ----------

export async function updateRecordNotes(
  recordId: string,
  notes: string | null
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('training_records')
    .update({ notes: notes || null })
    .eq('id', recordId)

  if (error) {
    return { error: '保存に失敗しました' }
  }

  return { success: true }
}

// ---------- 8-12: セッション全体メモ更新 ----------

export async function updateSessionNotes(
  sessionId: string,
  notes: string | null
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('training_sessions')
    .update({ notes: notes || null })
    .eq('id', sessionId)

  if (error) {
    return { error: '保存に失敗しました' }
  }

  return { success: true }
}

// ---------- 8-13: セッション完了 ----------

export async function completeSession(
  sessionId: string,
  customerId: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  const { error } = await supabase
    .from('training_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  if (error) {
    return { error: 'セッションの完了に失敗しました。再試行してください' }
  }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath(`/sessions/${sessionId}/edit`)
  return { success: true }
}

// ---------- 8-7 & 8-8: 前回をコピー ----------

export async function copyPreviousSets(
  sessionId: string,
  recordId: string,
  customerId: string,
  exerciseId: string
): Promise<SessionActionState> {
  const { supabase } = await requireAuth()

  // 直近の完了セッションから同じ種目の記録を取得
  const { data: prevRecords } = await supabase
    .from('training_records')
    .select(`
      id,
      training_sessions!inner (
        id,
        session_date,
        status,
        is_deleted,
        customer_id
      )
    `)
    .eq('exercise_id', exerciseId)
    .eq('training_sessions.customer_id', customerId)
    .eq('training_sessions.status', 'completed')
    .eq('training_sessions.is_deleted', false)
    .neq('training_sessions.id', sessionId)
    .order('training_sessions(session_date)', { ascending: false })
    .limit(1)

  if (!prevRecords || prevRecords.length === 0) {
    return { error: '前回の記録が見つかりません' }
  }

  const prevRecordId = prevRecords[0].id

  // 前回のセットを取得
  const { data: prevSets } = await supabase
    .from('training_sets')
    .select('set_number, weight, reps, notes')
    .eq('record_id', prevRecordId)
    .order('set_number', { ascending: true })

  if (!prevSets || prevSets.length === 0) {
    return { error: '前回のセット記録が見つかりません' }
  }

  // 現在のセットを全削除
  await supabase
    .from('training_sets')
    .delete()
    .eq('record_id', recordId)

  // 前回のセットをコピーして挿入
  const newSets = prevSets.map((s) => ({
    record_id: recordId,
    set_number: s.set_number,
    weight: s.weight,
    reps: s.reps,
    notes: s.notes,
  }))

  const { error } = await supabase
    .from('training_sets')
    .insert(newSets)

  if (error) {
    return { error: '前回の記録のコピーに失敗しました。再試行してください' }
  }

  revalidatePath(`/sessions/${sessionId}/edit`)
  return { success: true }
}

// ---------- 9-4: セッション削除（論理削除、オーナーのみ） ----------

export async function deleteSession(
  sessionId: string,
  customerId: string
): Promise<SessionActionState> {
  const { supabase } = await requireOwner()

  const { error } = await supabase
    .from('training_sessions')
    .update({ is_deleted: true })
    .eq('id', sessionId)

  if (error) {
    return { error: 'セッションの削除に失敗しました。再試行してください' }
  }

  revalidatePath(`/customers/${customerId}`)
  return { success: true, sessionId }
}
