'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const supabase = createClient()
    const type = searchParams.get('type')
    const code = searchParams.get('code')

    async function handleCallback() {
      // PKCE flow: code パラメータがある場合
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('auth callback exchangeCode error:', error.message)
          router.replace(type === 'invite' ? '/login?error=invite_expired' : '/login?error=auth_error')
          return
        }
      }

      // ハッシュフラグメントからのセッション確立を待つ（implicit flow）
      // createBrowserClient が自動的にハッシュを処理する
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // セッションが確立されるまで少し待つ（ハッシュフラグメント処理の完了待ち）
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const { data: { session: retrySession } } = await supabase.auth.getSession()

        if (!retrySession) {
          console.error('auth callback: no session after retry')
          router.replace(type === 'invite' ? '/login?error=invite_expired' : '/login?error=auth_error')
          return
        }
      }

      // 招待・パスワードリセットの場合はパスワード設定画面へ
      if (type === 'recovery' || type === 'invite') {
        router.replace('/reset-password/update')
      } else {
        router.replace('/')
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="size-6 text-zinc-400 animate-spin" />
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
