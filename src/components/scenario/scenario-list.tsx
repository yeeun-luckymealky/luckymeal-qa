'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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

interface ScenarioListProps {
  scenarios: Scenario[]
  onStatusChange?: (id: string, status: string, data?: { failureNote?: string; bugTicketUrl?: string }) => void
  onScenarioClick?: (scenario: Scenario) => void
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

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
}

const statusColors: Record<string, string> = {
  NOT_RUN: 'bg-gray-100 text-gray-600',
  PASS: 'bg-green-100 text-green-700',
  FAIL: 'bg-red-100 text-red-700',
  BLOCKED: 'bg-purple-100 text-purple-700',
  SKIPPED: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  NOT_RUN: '미실행',
  PASS: '통과',
  FAIL: '실패',
  BLOCKED: '차단',
  SKIPPED: '스킵',
}

export function ScenarioList({ scenarios, onStatusChange, onScenarioClick }: ScenarioListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  // 카테고리별 그룹화
  const groupedScenarios = scenarios.reduce(
    (acc, scenario) => {
      if (!acc[scenario.category]) {
        acc[scenario.category] = []
      }
      acc[scenario.category].push(scenario)
      return acc
    },
    {} as Record<string, Scenario[]>
  )

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        생성된 시나리오가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedScenarios).map(([category, categoryScenarios]) => {
        const passCount = categoryScenarios.filter((s) => s.status === 'PASS').length
        const totalCount = categoryScenarios.length

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Badge variant="outline">{categoryLabels[category] || category}</Badge>
                <span className="text-sm font-normal text-muted-foreground">
                  {totalCount}개
                </span>
              </h3>
              <span className="text-sm text-muted-foreground">
                {passCount}/{totalCount} 완료
              </span>
            </div>

            <div className="space-y-2">
              {categoryScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="border rounded-lg bg-white overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-4">
                    <Checkbox
                      checked={scenario.status === 'PASS'}
                      onCheckedChange={(checked) => {
                        onStatusChange?.(scenario.id, checked ? 'PASS' : 'NOT_RUN')
                      }}
                    />

                    <button
                      onClick={() => toggleExpand(scenario.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedIds.has(scenario.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onScenarioClick?.(scenario)}
                          className={cn(
                            'font-medium text-left hover:text-primary hover:underline',
                            scenario.status === 'PASS' && 'line-through text-muted-foreground'
                          )}
                        >
                          {scenario.title}
                        </button>
                        <Badge
                          variant="outline"
                          className={priorityColors[scenario.priority]}
                        >
                          {scenario.priority}
                        </Badge>
                        <Badge variant="secondary" className={statusColors[scenario.status]}>
                          {statusLabels[scenario.status]}
                        </Badge>
                        {scenario.deviceType !== 'BOTH' && (
                          <Badge variant="outline">{scenario.deviceType}</Badge>
                        )}
                        {scenario.assignee && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {scenario.assignee.name || scenario.assignee.email}
                          </Badge>
                        )}
                      </div>
                      {scenario.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {scenario.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {expandedIds.has(scenario.id) && scenario.testCases.length > 0 && (
                    <div className="border-t px-4 py-3 bg-gray-50">
                      <h4 className="text-sm font-medium mb-3">테스트 케이스</h4>
                      <div className="space-y-3">
                        {scenario.testCases.map((tc) => (
                          <div
                            key={tc.id}
                            className="grid grid-cols-[auto_1fr_1fr] gap-4 text-sm"
                          >
                            <span className="text-muted-foreground font-mono">
                              #{tc.step}
                            </span>
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                동작
                              </span>
                              {tc.action}
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                예상 결과
                              </span>
                              {tc.expected}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
