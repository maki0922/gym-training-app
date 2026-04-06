import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExerciseList } from '@/components/features/exercises/exercise-list'

export type Exercise = {
  id: string
  name: string
  category: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
}

export default async function ExercisesPage() {
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

  // オーナーは全件、トレーナーは is_active = true のみ取得
  const query = supabase
    .from('exercise_master')
    .select('id, name, category, is_system, is_active, created_at')
    .order('created_at', { ascending: true })

  const { data: exercises } = isOwner
    ? await query
    : await query.eq('is_active', true)

  const items: Exercise[] = (exercises ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    isSystem: e.is_system,
    isActive: e.is_active,
    createdAt: e.created_at,
  }))

  return <ExerciseList exercises={items} isOwner={isOwner} />
}
