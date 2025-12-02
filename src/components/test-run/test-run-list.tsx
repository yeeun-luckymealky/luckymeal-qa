'use client'

import { useState } from 'react'
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
import { Plus, Play, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestRunStats {
  total: number
  pass: number
  fail: number
  blocked: number
  skipped: number
  notRun: number
}

interface TestRun {
  id: string
  name: string
  appVersion: string
  environment: string
  startedAt: string
  completedAt: string | null
  stats: TestRunStats
}

interface TestRunListProps {
  projectId: string
  testRuns: TestRun[]
  onTestRunCreated: () => void
  onTestRunClick?: (testRun: TestRun) => void
}

const environmentLabels: Record<string, string> = {
  STAGING: '스테이징',
  PRODUCTION: '프로덕션',
}

export function TestRunList({
  projectId,
  testRuns,
  onTestRunCreated,
  onTestRunClick,
}: TestRunListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    appVersion: '',
    environment: 'STAGING',
  })

  const handleCreate = async () => {
    if (!formData.name || !formData.appVersion) {
      toast.error('모든 필드를 입력해주세요')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/test-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projectId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error('테스트 런 생성 실패', {
          description: result.error?.message || '다시 시도해주세요',
        })
        return
      }

      toast.success('테스트 런이 생성되었습니다')
      setIsDialogOpen(false)
      setFormData({ name: '', appVersion: '', environment: 'STAGING' })
      onTestRunCreated()
    } catch {
      toast.error('오류 발생')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (testRunId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('이 테스트 런을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/test-runs/${testRunId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('테스트 런이 삭제되었습니다')
        onTestRunCreated()
      } else {
        toast.error('삭제 실패')
      }
    } catch {
      toast.error('오류 발생')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">테스트 런</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              새 테스트 런
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 테스트 런 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="v2.3.0 RC1 QA"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appVersion">앱 버전</Label>
                <Input
                  id="appVersion"
                  placeholder="2.3.0"
                  value={formData.appVersion}
                  onChange={(e) => setFormData({ ...formData, appVersion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">환경</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData({ ...formData, environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAGING">스테이징</SelectItem>
                    <SelectItem value="PRODUCTION">프로덕션</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                {isCreating ? '생성 중...' : '생성'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {testRuns.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Play className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>아직 테스트 런이 없습니다</p>
          <p className="text-sm">새 테스트 런을 생성하여 QA를 시작하세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {testRuns.map((run) => {
            const progressPercent = run.stats.total > 0
              ? Math.round(((run.stats.pass + run.stats.fail + run.stats.blocked + run.stats.skipped) / run.stats.total) * 100)
              : 0

            return (
              <div
                key={run.id}
                onClick={() => onTestRunClick?.(run)}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{run.name}</span>
                      <Badge variant="outline">v{run.appVersion}</Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          run.environment === 'PRODUCTION' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {environmentLabels[run.environment]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(run.startedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {progressPercent}% 완료
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-green-600">✓{run.stats.pass}</span>
                        <span className="text-red-600">✕{run.stats.fail}</span>
                        <span>⬜{run.stats.notRun}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(run.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
