import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { TrainerList } from '@/components/features/trainers/trainer-list'

export type TrainerMember = {
  id: string
  email: string
  displayName: string
  role: 'owner' | 'trainer'
  isPrimary: boolean
  isInvitePending: boolean
  createdAt: string
}

export default async function TrainersPage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Owner check
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'owner') redirect('/')

  // Fetch active profiles
  const serviceClient = await createServiceRoleClient()

  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('id, email, display_name, role, is_primary, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Fetch auth users to check invite status (last_sign_in_at)
  const { data: authData } = await serviceClient.auth.admin.listUsers()

  const authUsersMap = new Map<string, { lastSignInAt: string | null }>()
  if (authData?.users) {
    for (const u of authData.users) {
      authUsersMap.set(u.id, { lastSignInAt: u.last_sign_in_at ?? null })
    }
  }

  const members: TrainerMember[] = (profiles ?? []).map((p) => {
    const authInfo = authUsersMap.get(p.id)
    return {
      id: p.id,
      email: p.email,
      displayName: p.display_name,
      role: p.role,
      isPrimary: p.is_primary,
      isInvitePending: authInfo ? authInfo.lastSignInAt === null : false,
      createdAt: p.created_at,
    }
  })

  return (
    <div className="space-y-6">
      <TrainerList members={members} currentUserId={user.id} />
    </div>
  )
}
