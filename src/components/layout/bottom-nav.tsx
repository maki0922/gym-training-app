'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Dumbbell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  ownerOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'ホーム', href: '/', icon: LayoutDashboard },
  { label: '顧客', href: '/customers', icon: Users },
  { label: '種目', href: '/admin/exercises', icon: Dumbbell },
  { label: '管理', href: '/admin/trainers', icon: Settings, ownerOnly: true },
]

type Props = {
  role: 'owner' | 'trainer'
}

export function BottomNav({ role }: Props) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    (item) => !item.ownerOnly || role === 'owner'
  )

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200">
      <div className="flex">
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
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs font-medium transition-colors',
                isActive
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Icon
                className={cn(
                  'size-5 shrink-0',
                  isActive ? 'text-zinc-900' : 'text-zinc-400'
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
