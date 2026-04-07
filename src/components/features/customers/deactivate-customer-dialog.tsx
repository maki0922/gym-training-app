'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deactivateCustomer } from '@/lib/actions/customer'
import type { Customer } from '@/app/(dashboard)/customers/page'

type Props = {
  customer: Customer | null
  onClose: () => void
}

export function DeactivateCustomerDialog({ customer, onClose }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!customer) return
    setIsPending(true)
    setError(null)

    const result = await deactivateCustomer(customer.id)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={!!customer} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>顧客を退会処理しますか？</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            <span className="font-medium text-zinc-900">{customer?.name}</span> さんを退会処理します。
            過去のトレーニング記録は残ります。退会後は顧客一覧に表示されなくなります。
          </p>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? '処理中...' : '退会処理する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
