'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'
import { APP_NAME } from '@/lib/constants'

const initialState = { error: undefined }

const ERROR_MESSAGES: Record<string, string> = {
  invite_expired: '招待リンクの有��期限が切れています。オーナーに再送信��依頼してください。',
  auth_error: '認証に失敗しました。再度お試しください。',
}

function UrlErrorAlert() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const message = urlError ? ERROR_MESSAGES[urlError] : null

  if (!message) return null

  return (
    <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
      <p className="text-sm text-amber-700">{message}</p>
    </div>
  )
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* 左パネル: ブランディング（デスクトップのみ表示） */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white">
        <div className="text-xl font-bold tracking-tight">{APP_NAME}</div>
        <div className="space-y-4">
          <p className="text-4xl font-bold leading-tight tracking-tight">
            トレーニングの記録を、
            <br />
            もっとシンプルに。
          </p>
          <p className="text-zinc-400 text-lg">
            パーソナルジム��けのトレーニ��グ管理アプリ
          </p>
        </div>
        <p className="text-zinc-500 text-sm">© 2026 {APP_NAME}</p>
      </div>

      {/* 右パネル: ログインフォーム */}
      <div className="flex flex-col items-center justify-center min-h-screen lg:min-h-0 bg-white px-8 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* モバイルのみアプリ名表示 */}
          <div className="lg:hidden text-center">
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              {APP_NAME}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              ログイン
            </h2>
            <p className="text-sm text-zinc-500">
              アカ��ント情報を入力してくださ���
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-700">
                メールアドレス
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="example@gym.com"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-700">
                  パスワード
                </Label>
                <Link
                  href="/reset-password"
                  className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  パス��ードをお���れの方
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            <Suspense>
              <UrlErrorAlert />
            </Suspense>

            {state.error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-700 text-white transition-colors"
              disabled={isPending}
            >
              {isPending ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
