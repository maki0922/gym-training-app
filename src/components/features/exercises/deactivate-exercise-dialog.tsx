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
import { deactivateExercise } from '@/lib/actions/exercise'
import type { Exercise } from '@/app/(dashboard)/admin/exercises/page'

type Props = {
  exercise: Exercise | null
  onClose: () => void
}

export function DeactivateExerciseDialog({ exercise, onClose }: Props) {
  const [isPending, setIsPending] = useState(false)

  const handleDeactivate = async () => {
    if (!exercise) return
    setIsPending(true)

    const result = await deactivateExercise(exercise.id)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
    }
    onClose()
  }

  return (
    <AlertDialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>種目を無効化しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {exercise?.name} を無効化します。過去のトレーニング記録は残ります。無効化後は種目選択に表示されなくなります。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <Button
            onClick={handleDeactivate}
            disabled={isPending}
            className="bg-zinc-900 hover:bg-zinc-700 text-white"
          >
            {isPending ? '処理中...' : '無効化する'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
