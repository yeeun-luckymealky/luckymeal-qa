'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles, Download, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScenarioList } from '@/components/scenario/scenario-list'
import { ScenarioDetailModal } from '@/components/scenario/scenario-detail-modal'
import { TestRunList } from '@/components/test-run/test-run-list'

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

interface Project {
  id: string
  title: string
  description: string | null
  prdContent: string
  prdNotionUrl: string | null
  appVersion: string | null
  platform: string
  releaseDate: string | null
  scenarios: Scenario[]
  _count: { scenarios: number; testRuns: number }
}

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

const platformLabels: Record<string, string> = {
  CONSUMER_APP: '소비자 앱',
  SELLER_APP: '셀러 앱',
  BOTH: '모두',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [testRuns, setTestRuns] = useState<TestRun[]>([])

  const projectId = params.id as string

  useEffect(() => {
    fetchProject()
    fetchUsers()
    fetchTestRuns()
  }, [projectId])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      if (response.ok) {
        setUsers(result.data)
      }
    } catch {
      // 사용자 목록 로드 실패 - 무시
    }
  }

  const fetchTestRuns = async () => {
    try {
      const response = await fetch(`/api/test-runs?projectId=${projectId}`)
      const result = await response.json()
      if (response.ok) {
        setTestRuns(result.data)
      }
    } catch {
      // 테스트 런 목록 로드 실패 - 무시
    }
  }

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const result = await response.json()

      if (!response.ok) {
        toast.error('프로젝트 로드 실패')
        router.push('/projects')
        return
      }

      setProject(result.data)
    } catch (error) {
      toast.error('오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error('시나리오 생성 실패', {
          description: result.error?.message || '다시 시도해주세요.',
        })
        return
      }

      toast.success(`${result.data.count}개의 시나리오가 생성되었습니다`)
      fetchProject() // 새로고침
    } catch (error) {
      toast.error('오류 발생', {
        description: '잠시 후 다시 시도해주세요.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStatusChange = async (
    scenarioId: string,
    status: string,
    data?: { failureNote?: string; bugTicketUrl?: string; assigneeId?: string | null }
  ) => {
    const response = await fetch(`/api/scenarios/${scenarioId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...data }),
    })

    if (!response.ok) {
      throw new Error('Status update failed')
    }

    const result = await response.json()
    const updatedScenario = result.data

    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        scenarios: prev.scenarios.map((s) =>
          s.id === scenarioId
            ? {
                ...s,
                status,
                failureNote: data?.failureNote || null,
                bugTicketUrl: data?.bugTicketUrl || null,
                assigneeId: data?.assigneeId ?? s.assigneeId,
                assignee: updatedScenario.assignee || null,
              }
            : s
        ),
      }
    })
  }

  const handleScenarioClick = (scenario: Scenario) => {
    setSelectedScenario(scenario)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedScenario(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return null
  }

  const stats = {
    total: project.scenarios.length,
    pass: project.scenarios.filter((s) => s.status === 'PASS').length,
    fail: project.scenarios.filter((s) => s.status === 'FAIL').length,
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{platformLabels[project.platform]}</Badge>
              {project.appVersion && (
                <Badge variant="outline">v{project.appVersion}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {project.prdNotionUrl && (
            <Button variant="outline" asChild>
              <a href={project.prdNotionUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                PRD
              </a>
            </Button>
          )}
          {project.scenarios.length > 0 && (
            <Button variant="outline" asChild>
              <a href={`/api/projects/${projectId}/export`} download>
                <Download className="mr-2 h-4 w-4" />
                내보내기
              </a>
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {project.scenarios.length > 0 ? '재생성' : '시나리오 생성'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 시나리오</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">통과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.pass}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">실패</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.fail}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 테스트 런 */}
      <Card>
        <CardContent className="pt-6">
          <TestRunList
            projectId={projectId}
            testRuns={testRuns}
            onTestRunCreated={fetchTestRuns}
          />
        </CardContent>
      </Card>

      {/* 시나리오 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>테스트 시나리오</CardTitle>
        </CardHeader>
        <CardContent>
          {project.scenarios.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">시나리오가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                &quot;시나리오 생성&quot; 버튼을 클릭하여 AI가 테스트 시나리오를 생성하도록 하세요.
              </p>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    시나리오 생성
                  </>
                )}
              </Button>
            </div>
          ) : (
            <ScenarioList
              scenarios={project.scenarios}
              onStatusChange={handleStatusChange}
              onScenarioClick={handleScenarioClick}
            />
          )}
        </CardContent>
      </Card>

      {/* 시나리오 상세 모달 */}
      <ScenarioDetailModal
        scenario={selectedScenario}
        open={isModalOpen}
        onClose={handleModalClose}
        onStatusChange={handleStatusChange}
        users={users}
      />
    </div>
  )
}
