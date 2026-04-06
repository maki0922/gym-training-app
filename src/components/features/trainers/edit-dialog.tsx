'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { editTrainer } from '@/lib/actions/trainer'
import type { TrainerMember } from '@/app/(dashboard)/admin/trainers/page'

type Props = {
  member: TrainerMember | null
  onClose: () => void
  currentUserId: string
}

export function EditDialog({ member, onClose, currentUserId }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'owner' | 'trainer'>('trainer')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [showRoleWarning, setShowRoleWarning] = useState(false)

  useEffect(() => {
    if (member) {
      setDisplayName(member.displayName)
      setRole(member.role)
      setError(null)
    }
  }, [member])

  const handleSubmit = async () => {
    if (!member) return

    // If changing own role from owner to trainer, show warning
    if (member.id === currentUserId && member.role === 'owner' && role === 'trainer') {
      setShowRoleWarning(true)
      return
    }

    await doSubmit()
  }

  const doSubmit = async () => {
    if (!member) return
    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('displayName', displayName)
    formData.set('role', role)

    const result = await editTrainer(member.id, formData)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバー情報を編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-displayName">表示名</Label>
              <Input
                id="edit-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-11"
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">ロール</Label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'owner' | 'trainer')}
                disabled={member?.isPrimary}
                className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="trainer">トレーナー</option>
                <option value="owner">オーナー</option>
              </select>
              {member?.isPrimary && (
                <p className="text-xs text-zinc-500">プライマリオーナーのロールは変更できません</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-zinc-900 hover:bg-zinc-700 text-white"
              disabled={isPending}
            >
              {isPending ? '更新中...' : '更新する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 自分のロール変更警告 */}
      <AlertDialog open={showRoleWarning} onOpenChange={setShowRoleWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ロール変更の確認</AlertDialogTitle>
            <AlertDialogDescription>
              自分のロールをトレーナーに変更するとオーナー権限を失います。続けますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowRoleWarning(false)
                doSubmit()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              変更する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
