'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  SkipForward,
  Clock,
  ExternalLink,
  User,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestCase {
  id: string
  step: number
  action: string
  expected: string
}

interface UserInfo {
  id: string
  name: string | null
  email: string
}

interface Scenario {
  id: string
  title: string
  description: string | null
  category: string
  priority: string
  deviceType: string
  status: string
  bugTicketUrl: string | null
  failureNote: string | null
  assigneeId: string | null
  assignee?: UserInfo | null
  testCases: TestCase[]
}

interface ScenarioDetailModalProps {
  scenario: Scenario | null
  open: boolean
  onClose: () => void
  onStatusChange: (id: string, status: string, data?: { failureNote?: string; bugTicketUrl?: string; assigneeId?: string | null }) => void
  onTestCasesChange?: () => void
  users?: UserInfo[]
}

const statusOptions = [
  { value: 'NOT_RUN', label: '미실행', icon: Clock, color: 'text-gray-500' },
  { value: 'PASS', label: '통과', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'FAIL', label: '실패', icon: XCircle, color: 'text-red-500' },
  { value: 'BLOCKED', label: '차단', icon: AlertCircle, color: 'text-purple-500' },
  { value: 'SKIPPED', label: '스킵', icon: SkipForward, color: 'text-gray-400' },
]

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

const categoryLabels: Record<string, string> = {
  POSITIVE: '정상',
  NEGATIVE: '오류',
  EDGE_CASE: '엣지',
  PAYMENT: '결제',
  PICKUP: '픽업',
  LOCATION: '위치',
  TIME_SENSITIVE: '시간',
  INVENTORY: '재고',
  NOTIFICATION: '알림',
  NETWORK: '네트워크',
  AUTH: '인증',
}

export function ScenarioDetailModal({
  scenario,
  open,
  onClose,
  onStatusChange,
  onTestCasesChange,
  users = [],
}: ScenarioDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(scenario?.status || 'NOT_RUN')
  const [failureNote, setFailureNote] = useState(scenario?.failureNote || '')
  const [bugTicketUrl, setBugTicketUrl] = useState(scenario?.bugTicketUrl || '')
  const [assigneeId, setAssigneeId] = useState<string | null>(scenario?.assigneeId || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 테스트 케이스 추가 폼
  const [isAddingTestCase, setIsAddingTestCase] = useState(false)
  const [newAction, setNewAction] = useState('')
  const [newExpected, setNewExpected] = useState('')

  // 시나리오가 변경되면 상태 초기화
  useEffect(() => {
    if (scenario) {
      setSelectedStatus(scenario.status)
      setFailureNote(scenario.failureNote || '')
      setBugTicketUrl(scenario.bugTicketUrl || '')
      setAssigneeId(scenario.assigneeId || null)
      setIsAddingTestCase(false)
      setNewAction('')
      setNewExpected('')
    }
  }, [scenario])

  const handleAddTestCase = async () => {
    if (!scenario || !newAction.trim() || !newExpected.trim()) {
      toast.error('동작과 예상 결과를 모두 입력하세요')
      return
    }

    try {
      const response = await fetch(`/api/scenarios/${scenario.id}/test-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newAction, expected: newExpected }),
      })

      if (!response.ok) {
        toast.error('테스트 케이스 추가 실패')
        return
      }

      toast.success('테스트 케이스가 추가되었습니다')
      setNewAction('')
      setNewExpected('')
      setIsAddingTestCase(false)
      onTestCasesChange?.()
    } catch {
      toast.error('오류 발생')
    }
  }

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!scenario) return
    if (!confirm('이 테스트 케이스를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(
        `/api/scenarios/${scenario.id}/test-cases?testCaseId=${testCaseId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        toast.error('테스트 케이스 삭제 실패')
        return
      }

      toast.success('테스트 케이스가 삭제되었습니다')
      onTestCasesChange?.()
    } catch {
      toast.error('오류 발생')
    }
  }

  if (!scenario) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onStatusChange(scenario.id, selectedStatus, {
        failureNote: selectedStatus === 'FAIL' ? failureNote : undefined,
        bugTicketUrl: selectedStatus === 'FAIL' ? bugTicketUrl : undefined,
        assigneeId,
      })
      toast.success('상태가 업데이트되었습니다')
      onClose()
    } catch {
      toast.error('업데이트 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {scenario.title}
          </DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">{categoryLabels[scenario.category]}</Badge>
            <Badge className={priorityColors[scenario.priority]}>{scenario.priority}</Badge>
            {scenario.deviceType !== 'BOTH' && (
              <Badge variant="secondary">{scenario.deviceType}</Badge>
            )}
          </div>
        </DialogHeader>

        {scenario.description && (
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        )}

        <Separator />

        {/* 테스트 케이스 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">테스트 케이스</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingTestCase(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              추가
            </Button>
          </div>
          <div className="space-y-3">
            {scenario.testCases.map((tc) => (
              <div key={tc.id} className="bg-gray-50 rounded-lg p-3 group">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {tc.step}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">동작:</span> {tc.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">예상:</span> {tc.expected}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteTestCase(tc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            {/* 테스트 케이스 추가 폼 */}
            {isAddingTestCase && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newAction">동작</Label>
                  <Input
                    id="newAction"
                    placeholder="사용자가 수행할 동작을 입력하세요"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newExpected">예상 결과</Label>
                  <Input
                    id="newExpected"
                    placeholder="예상되는 결과를 입력하세요"
                    value={newExpected}
                    onChange={(e) => setNewExpected(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingTestCase(false)
                      setNewAction('')
                      setNewExpected('')
                    }}
                  >
                    취소
                  </Button>
                  <Button size="sm" onClick={handleAddTestCase}>
                    추가
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* 담당자 배정 */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            담당자
          </h4>
          <Select
            value={assigneeId || 'unassigned'}
            onValueChange={(value) => setAssigneeId(value === 'unassigned' ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="담당자를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">미배정</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* 상태 선택 */}
        <div>
          <h4 className="font-medium mb-3">테스트 결과</h4>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedStatus === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(option.value)}
                className={cn(
                  selectedStatus === option.value && 'ring-2 ring-offset-2'
                )}
              >
                <option.icon className={cn('mr-1 h-4 w-4', option.color)} />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 실패 시 추가 정보 */}
        {selectedStatus === 'FAIL' && (
          <div className="space-y-4 bg-red-50 p-4 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="failureNote">실패 사유</Label>
              <Textarea
                id="failureNote"
                placeholder="어떤 문제가 발생했는지 상세히 기록해주세요..."
                value={failureNote}
                onChange={(e) => setFailureNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bugTicketUrl">버그 티켓 URL</Label>
              <div className="flex gap-2">
                <Input
                  id="bugTicketUrl"
                  placeholder="https://linear.app/... 또는 Jira URL"
                  value={bugTicketUrl}
                  onChange={(e) => setBugTicketUrl(e.target.value)}
                />
                {bugTicketUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={bugTicketUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
