import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SessionEditor, type RecordData, type SetData, type PreviousRecord } from '@/components/features/sessions/session-editor'
import type { ExerciseOption } from '@/components/features/sessions/add-exercise-dialog'

type Props = {
  params: Promise<{ id: string }>
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default async function SessionEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // セッション情報取得
  const { data: session } = await supabase
    .from('training_sessions')
    .select(`
      id,
      customer_id,
      session_date,
      status,
      notes,
      is_deleted,
      customers!training_sessions_customer_id_fkey (
        name
      )
    `)
    .eq('id', id)
    .single()

  if (!session || session.is_deleted) notFound()

  const customerName = (session.customers as { name: string } | null)?.name ?? '不明'

  // セッション内の種目 + セットを取得
  const { data: records } = await supabase
    .from('training_records')
    .select(`
      id,
      exercise_id,
      exercise_name_manual,
      sort_order,
      notes,
      exercise_master (
        name
      ),
      training_sets (
        id,
        set_number,
        weight,
        reps,
        notes
      )
    `)
    .eq('session_id', id)
    .order('sort_order', { ascending: true })

  const recordData: RecordData[] = (records ?? []).map((r) => ({
    id: r.id,
    exerciseId: r.exercise_id,
    exerciseName: (r.exercise_master as { name: string } | null)?.name ?? null,
    exerciseNameManual: r.exercise_name_manual,
    sortOrder: r.sort_order,
    notes: r.notes,
    sets: (Array.isArray(r.training_sets) ? r.training_sets : [])
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({
        id: s.id,
        setNumber: s.set_number,
        weight: s.weight,
        reps: s.reps,
        notes: s.notes,
      } satisfies SetData)),
  }))

  // 有効な種目マスタ一覧を取得
  const { data: exerciseMaster } = await supabase
    .from('exercise_master')
    .select('id, name, category')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const exerciseOptions: ExerciseOption[] = (exerciseMaster ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
  }))

  // 前回記録の取得（exercise_idがあるもののみ）
  const exerciseIds = recordData
    .filter((r) => r.exerciseId !== null)
    .map((r) => r.exerciseId!)

  const previousRecords: Record<string, PreviousRecord> = {}

  if (exerciseIds.length > 0) {
    // 各exercise_idについて直近の完了セッションの記録を検索
    for (const exerciseId of [...new Set(exerciseIds)]) {
      const { data: prevRecords } = await supabase
        .from('training_records')
        .select(`
          id,
          training_sessions!inner (
            session_date,
            status,
            is_deleted,
            customer_id
          ),
          training_sets (
            id
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('training_sessions.customer_id', session.customer_id)
        .eq('training_sessions.status', 'completed')
        .eq('training_sessions.is_deleted', false)
        .neq('training_sessions.id', id)
        .order('training_sessions(session_date)', { ascending: false })
        .limit(1)

      if (prevRecords && prevRecords.length > 0) {
        const prev = prevRecords[0]
        const sessionData = prev.training_sessions as unknown as {
          session_date: string
        }
        previousRecords[exerciseId] = {
          date: formatDateShort(sessionData.session_date),
          setCount: Array.isArray(prev.training_sets) ? prev.training_sets.length : 0,
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-14 lg:top-0 z-10 bg-white/95 backdrop-blur-sm -mx-4 px-4 py-2 border-b border-zinc-100 lg:-mx-8 lg:px-8">
        <Link
          href={`/customers/${session.customer_id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ChevronLeft className="size-4" />
          {customerName} に戻る
        </Link>
      </div>

      <SessionEditor
        session={{
          id: session.id,
          customerId: session.customer_id,
          customerName,
          sessionDate: session.session_date,
          status: session.status as 'in_progress' | 'completed',
          notes: session.notes,
          records: recordData,
        }}
        exercises={exerciseOptions}
        previousRecords={previousRecords}
      />
    </div>
  )
}
