import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SessionDetailView } from '@/components/features/sessions/session-detail-view'

type Props = {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: Props) {
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

  const isOwner = profile.role === 'owner'

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
      ),
      profiles!training_sessions_trainer_id_fkey (
        display_name,
        is_active
      )
    `)
    .eq('id', id)
    .single()

  if (!session || session.is_deleted) notFound()

  const customerName = (session.customers as { name: string } | null)?.name ?? '不明'
  const trainerProfile = session.profiles as { display_name: string; is_active: boolean } | null
  const trainerName = trainerProfile?.display_name ?? '不明'
  const trainerIsActive = trainerProfile?.is_active ?? true

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

  type RecordView = {
    id: string
    exerciseName: string
    notes: string | null
    sets: {
      setNumber: number
      weight: number | null
      reps: number | null
      notes: string | null
    }[]
  }

  const recordViews: RecordView[] = (records ?? []).map((r) => ({
    id: r.id,
    exerciseName:
      (r.exercise_master as { name: string } | null)?.name
      ?? r.exercise_name_manual
      ?? '不明な種目',
    notes: r.notes,
    sets: (Array.isArray(r.training_sets) ? r.training_sets : [])
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({
        setNumber: s.set_number,
        weight: s.weight,
        reps: s.reps,
        notes: s.notes,
      })),
  }))

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

      <SessionDetailView
        session={{
          id: session.id,
          customerId: session.customer_id,
          customerName,
          sessionDate: session.session_date,
          status: session.status as 'in_progress' | 'completed',
          notes: session.notes,
          trainerName,
          trainerIsActive,
        }}
        records={recordViews}
        isOwner={isOwner}
      />
    </div>
  )
}
