'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const type = searchParams.get('type')

    // onAuthStateChange でセッション確立を検知
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('auth callback event:', event, 'session:', session ? 'exists' : 'null')

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (!session) return

        subscription.unsubscribe()

        if (type === 'recovery' || type === 'invite') {
          router.replace('/reset-password/update')
        } else {
          router.replace('/')
        }
      }
    })

    // タイムアウト: 10秒以内にセッションが確立されなければエラー
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      console.error('auth callback: timeout - no session established')
      router.replace(type === 'invite' ? '/login?error=invite_expired' : '/login?error=auth_error')
    }, 10000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <Loader2 className="size-6 text-zinc-400 animate-spin" />
      <p className="text-sm text-zinc-500">認証処理中...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-6 text-zinc-400 animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
