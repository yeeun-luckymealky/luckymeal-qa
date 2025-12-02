'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestCase {
  id: string
  step: number
  action: string
  expected: string
}

interface Project {
  id: string
  title: string
  platform: string
}

interface Scenario {
  id: string
  title: string
  description: string | null
  category: string
  priority: string
  status: string
  project: Project
  testCases: TestCase[]
}

interface GroupedData {
  project: Project
  scenarios: Scenario[]
}

interface Stats {
  total: number
  notRun: number
  pass: number
  fail: number
  blocked: number
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  NOT_RUN: { label: '미실행', icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  PASS: { label: '통과', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  FAIL: { label: '실패', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  BLOCKED: { label: '차단', icon: AlertCircle, color: 'text-purple-600', bgColor: 'bg-purple-100' },
}

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
}

const platformLabels: Record<string, string> = {
  CONSUMER_APP: '소비자 앱',
  SELLER_APP: '셀러 앱',
  BOTH: '모두',
}

export default function MyPage() {
  const [groupedData, setGroupedData] = useState<GroupedData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMyScenarios()
  }, [])

  const fetchMyScenarios = async () => {
    try {
      const response = await fetch('/api/my/scenarios')
      const result = await response.json()

      if (response.ok) {
        setGroupedData(result.data.groupedByProject)
        setStats(result.data.stats)
      } else {
        toast.error('데이터 로드 실패')
      }
    } catch {
      toast.error('오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">내 할당 시나리오</h1>
        <p className="text-muted-foreground">나에게 배정된 테스트 시나리오를 확인하세요</p>
      </div>

      {/* 통계 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">전체</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                미실행
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.notRun}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                통과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.pass}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                실패
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.fail}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-purple-500" />
                차단
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.blocked}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 시나리오 목록 */}
      {groupedData.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Inbox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">할당된 시나리오가 없습니다</h3>
              <p className="text-muted-foreground">
                프로젝트에서 시나리오를 할당받으면 여기에 표시됩니다
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedData.map(({ project, scenarios }) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>{project.title}</CardTitle>
                    <Badge variant="outline">{platformLabels[project.platform]}</Badge>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>
                      <ExternalLink className="mr-1 h-4 w-4" />
                      프로젝트 보기
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scenarios.map((scenario) => {
                    const statusInfo = statusConfig[scenario.status] || statusConfig.NOT_RUN
                    const StatusIcon = statusInfo.icon

                    return (
                      <div
                        key={scenario.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn('p-2 rounded-full', statusInfo.bgColor)}>
                            <StatusIcon className={cn('h-4 w-4', statusInfo.color)} />
                          </div>
                          <div>
                            <p className="font-medium">{scenario.title}</p>
                            {scenario.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {scenario.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={priorityColors[scenario.priority]}>
                            {scenario.priority}
                          </Badge>
                          <Badge variant="secondary" className={statusInfo.bgColor}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
