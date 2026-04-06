'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteTrainer } from '@/lib/actions/trainer'
import type { TrainerMember } from '@/app/(dashboard)/admin/trainers/page'

type Props = {
  member: TrainerMember | null
  onClose: () => void
}

export function DeleteDialog({ member, onClose }: Props) {
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    if (!member) return
    setIsPending(true)

    const result = await deleteTrainer(member.id)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
      onClose()
    } else {
      onClose()
    }
  }

  return (
    <AlertDialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>メンバーを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {member?.displayName} を削除します。過去のトレーニング記録は残ります。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? '削除中...' : '削除する'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
