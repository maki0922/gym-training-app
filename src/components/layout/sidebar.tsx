'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  ownerOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'ダッシュボード', href: '/', icon: LayoutDashboard },
  { label: '顧客一覧', href: '/customers', icon: Users },
  { label: '種目マスタ', href: '/admin/exercises', icon: Dumbbell },
  { label: 'トレーナー管理', href: '/admin/trainers', icon: Settings, ownerOnly: true },
]

type Props = {
  role: 'owner' | 'trainer'
  displayName: string
}

export function Sidebar({ role, displayName }: Props) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    (item) => !item.ownerOnly || role === 'owner'
  )

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-zinc-200 bg-white min-h-screen">
      {/* アプリ名 */}
      <div className="px-6 py-5 border-b border-zinc-200">
        <span className="text-lg font-bold tracking-tight text-zinc-900">
          {APP_NAME}
        </span>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ユーザー情報 + ログアウト */}
      <div className="px-3 py-4 border-t border-zinc-200 space-y-1">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-zinc-900 truncate">{displayName}</p>
          <p className="text-xs text-zinc-500">
            {role === 'owner' ? 'オーナー' : 'トレーナー'}
          </p>
        </div>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-zinc-600 hover:text-zinc-900"
          >
            <LogOut className="size-4 shrink-0" />
            ログアウト
          </Button>
        </form>
      </div>
    </aside>
  )
}
