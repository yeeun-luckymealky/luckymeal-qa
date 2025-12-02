'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Trash2, Crown, Shield, User } from 'lucide-react'

interface Member {
  id: string
  name: string | null
  email: string
  role: string
  memberId?: string
  isOwner?: boolean
}

interface MemberListProps {
  projectId: string
}

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Crown className="h-4 w-4 text-yellow-500" />,
  ADMIN: <Shield className="h-4 w-4 text-blue-500" />,
  MEMBER: <User className="h-4 w-4 text-gray-500" />,
}

const roleLabels: Record<string, string> = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MEMBER: '멤버',
}

export function MemberList({ projectId }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')

  useEffect(() => {
    fetchMembers()
  }, [projectId])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      const result = await response.json()
      if (response.ok) {
        setMembers(result.data)
      }
    } catch {
      toast.error('멤버 목록 로드 실패')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('이메일을 입력하세요')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error('초대 실패', { description: result.error?.message })
        return
      }

      toast.success('멤버가 추가되었습니다')
      setIsDialogOpen(false)
      setInviteEmail('')
      setInviteRole('MEMBER')
      fetchMembers()
    } catch {
      toast.error('오류 발생')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('이 멤버를 제거하시겠습니까?')) return

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast.success('멤버가 제거되었습니다')
        fetchMembers()
      } else {
        toast.error('제거 실패')
      }
    } catch {
      toast.error('오류 발생')
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">로딩 중...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">팀원 ({members.length}명)</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="mr-1 h-4 w-4" />
              초대
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>팀원 초대</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@monandol.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  이미 가입된 사용자만 초대할 수 있습니다
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">권한</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">멤버 (테스트만 가능)</SelectItem>
                    <SelectItem value="ADMIN">관리자 (멤버 초대 가능)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={isInviting} className="w-full">
                {isInviting ? '초대 중...' : '초대하기'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {roleIcons[member.role]}
              </div>
              <div>
                <p className="font-medium">{member.name || '이름 없음'}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roleLabels[member.role]}</Badge>
              {!member.isOwner && member.memberId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(member.memberId!)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
