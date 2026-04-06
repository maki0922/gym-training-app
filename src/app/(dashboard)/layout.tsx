import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar role={profile.role} displayName={profile.display_name} />

      <div className="flex flex-1 flex-col min-w-0">
        {/* モバイル用ヘッダー */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-zinc-200 px-4 h-14">
          <span className="text-base font-bold tracking-tight text-zinc-900">
            GymLog
          </span>
          <span className="text-xs text-zinc-500">
            {profile.role === 'owner' ? 'オーナー' : 'トレーナー'}
          </span>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 px-4 py-6 lg:px-8 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      <BottomNav role={profile.role} />
    </div>
  )
}
