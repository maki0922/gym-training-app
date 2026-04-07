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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addCustomer } from '@/lib/actions/customer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCustomerDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleClose = () => {
    setName('')
    setNameKana('')
    setGender('')
    setDateOfBirth('')
    setNotes('')
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('nameKana', nameKana)
    formData.set('gender', gender)
    formData.set('dateOfBirth', dateOfBirth)
    formData.set('notes', notes)

    const result = await addCustomer(undefined, formData)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    } else {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>顧客を追加</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-name">
              氏名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-name"
              type="text"
              placeholder="例: 山田 太郎"
              className="h-11"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-name-kana">
              フリガナ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-name-kana"
              type="text"
              placeholder="例: ヤマダ タロウ"
              className="h-11"
              maxLength={50}
              value={nameKana}
              onChange={(e) => setNameKana(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-gender">性別</Label>
            <select
              id="add-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">選択しない</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-dob">生年月日</Label>
            <Input
              id="add-dob"
              type="date"
              className="h-11"
              max={new Date().toISOString().split('T')[0]}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-notes">メモ</Label>
            <Textarea
              id="add-notes"
              placeholder="例: 週2回通い中"
              maxLength={500}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="text-xs text-zinc-400 text-right">{notes.length}/500</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-zinc-900 hover:bg-zinc-700 text-white"
            disabled={isPending || !name || !nameKana}
          >
            {isPending ? '追加中...' : '追加する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
