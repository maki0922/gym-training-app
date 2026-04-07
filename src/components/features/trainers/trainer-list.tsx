'use client'

import { useState } from 'react'
import { UserPlus, Pencil, Trash2, MailPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { TrainerMember } from '@/app/(dashboard)/admin/trainers/page'
import { InviteDialog } from './invite-dialog'
import { EditDialog } from './edit-dialog'
import { DeleteDialog } from './delete-dialog'
import { resendInvite } from '@/lib/actions/trainer'

type Props = {
  members: TrainerMember[]
  currentUserId: string
}

export function TrainerList({ members, currentUserId }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TrainerMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrainerMember | null>(null)
  const [resending, setResending] = useState<string | null>(null)

  const handleResend = async (member: TrainerMember) => {
    setResending(member.id)
    const result = await resendInvite(member.id)
    setResending(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('招待メールを再送信しました')
    }
  }

  const canDelete = (member: TrainerMember) =>
    !member.isPrimary && member.id !== currentUserId

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">トレーナー管理</h1>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-zinc-900 hover:bg-zinc-700 text-white"
        >
          <UserPlus className="size-4" data-icon="inline-start" />
          メンバーを招待
        </Button>
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block">
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">表示名</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">メールアドレス</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">ロール</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">登録日</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">ステータス</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="px-4 py-3 text-zinc-900 font-medium">
                    <span className="flex items-center gap-2">
                      {member.displayName}
                      {member.isPrimary && (
                        <Badge variant="outline" className="text-xs">プライマリ</Badge>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{member.email}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {member.role === 'owner' ? 'オーナー' : 'トレーナー'}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{formatDate(member.createdAt)}</td>
                  <td className="px-4 py-3">
                    {member.isInvitePending && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">招待中</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {member.isInvitePending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResend(member)}
                          disabled={resending === member.id}
                        >
                          <MailPlus className="size-3.5" data-icon="inline-start" />
                          {resending === member.id ? '送信中...' : '再送信'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditTarget(member)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {canDelete(member) && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(member)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* モバイル: カード表示 */}
      <div className="md:hidden space-y-3">
        {members.map((member) => (
          <Card key={member.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{member.displayName}</span>
                  {member.isPrimary && (
                    <Badge variant="outline" className="text-xs">プライマリ</Badge>
                  )}
                  {member.isInvitePending && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">招待中</Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-500">{member.email}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{member.role === 'owner' ? 'オーナー' : 'トレーナー'}</span>
                  <span>{formatDate(member.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
              {member.isInvitePending && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => handleResend(member)}
                  disabled={resending === member.id}
                >
                  <MailPlus className="size-3.5" data-icon="inline-start" />
                  {resending === member.id ? '送信中...' : '招待を再送信'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setEditTarget(member)}
              >
                <Pencil className="size-3.5" data-icon="inline-start" />
                編集
              </Button>
              {canDelete(member) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px]"
                  onClick={() => setDeleteTarget(member)}
                >
                  <Trash2 className="size-3.5" data-icon="inline-start" />
                  削除
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>メンバーがいません</p>
        </div>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <EditDialog member={editTarget} onClose={() => setEditTarget(null)} currentUserId={currentUserId} />
      <DeleteDialog member={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  )
}
