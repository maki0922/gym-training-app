'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteTrainer, reactivateTrainer, type TrainerActionState } from '@/lib/actions/trainer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialState: TrainerActionState = {}

export function InviteDialog({ open, onOpenChange }: Props) {
  const [state, formAction, isPending] = useActionState(inviteTrainer, initialState)
  const [reactivateData, setReactivateData] = useState<{
    profileId: string
    displayName: string
    formDisplayName: string
    formRole: 'owner' | 'trainer'
  } | null>(null)
  const [reactivating, setReactivating] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'owner' | 'trainer'>('trainer')

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
    if (state.reactivation) {
      setReactivateData({
        profileId: state.reactivation.profileId,
        displayName: state.reactivation.displayName,
        formDisplayName: displayName,
        formRole: role,
      })
    }
  }, [state, onOpenChange, displayName, role])

  const handleReactivate = async () => {
    if (!reactivateData) return
    setReactivating(true)
    const result = await reactivateTrainer(
      reactivateData.profileId,
      reactivateData.formDisplayName || reactivateData.displayName,
      reactivateData.formRole
    )
    setReactivating(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('再有効化しました。以前のパスワードでログイン可能です。')
      setReactivateData(null)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを招待</DialogTitle>
            <DialogDescription>
              メールアドレスを入力して招待メールを送信します
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">メールアドレス</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="example@gym.com"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-displayName">表示名</Label>
              <Input
                id="invite-displayName"
                name="displayName"
                type="text"
                placeholder="山田太郎"
                className="h-11"
                maxLength={50}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">ロール</Label>
              <select
                id="invite-role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'owner' | 'trainer')}
                className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="trainer">トレーナー</option>
                <option value="owner">オーナー</option>
              </select>
            </div>

            {state.error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-zinc-900 hover:bg-zinc-700 text-white"
                disabled={isPending}
              >
                {isPending ? '送信中...' : '招待メールを送信'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 再有効化確認ダイアログ */}
      <AlertDialog open={!!reactivateData} onOpenChange={(open) => !open && setReactivateData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アカウントの再有効化</AlertDialogTitle>
            <AlertDialogDescription>
              {reactivateData?.displayName} は以前削除されたアカウントです。再有効化しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={reactivating}
              className="bg-zinc-900 hover:bg-zinc-700 text-white"
            >
              {reactivating ? '処理中...' : '再有効化する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
