interface TestCase {
  step: number
  action: string
  expected: string
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
  testCases: TestCase[]
}

interface Project {
  title: string
  description: string | null
  platform: string
  appVersion: string | null
  scenarios: Scenario[]
}

const categoryLabels: Record<string, string> = {
  POSITIVE: '정상 케이스',
  NEGATIVE: '오류 케이스',
  EDGE_CASE: '엣지 케이스',
  PAYMENT: '결제/환불',
  PICKUP: '픽업 플로우',
  LOCATION: '위치/지도',
  TIME_SENSITIVE: '시간 민감',
  INVENTORY: '재고 동기화',
  NOTIFICATION: '알림',
  NETWORK: '네트워크',
  AUTH: '인증/가입',
}

const priorityLabels: Record<string, string> = {
  CRITICAL: '🔴 Critical',
  HIGH: '🟠 High',
  MEDIUM: '🟡 Medium',
  LOW: '🟢 Low',
}

const statusLabels: Record<string, string> = {
  NOT_RUN: '⬜ 미실행',
  PASS: '✅ 통과',
  FAIL: '❌ 실패',
  BLOCKED: '🟣 차단',
  SKIPPED: '⏭️ 스킵',
}

const platformLabels: Record<string, string> = {
  CONSUMER_APP: '소비자 앱',
  SELLER_APP: '셀러 앱',
  BOTH: '모두',
}

export function generateMarkdown(project: Project): string {
  const lines: string[] = []

  // 헤더
  lines.push(`# ${project.title}`)
  lines.push('')
  if (project.description) {
    lines.push(project.description)
    lines.push('')
  }

  // 프로젝트 정보
  lines.push('## 프로젝트 정보')
  lines.push('')
  lines.push(`- **플랫폼**: ${platformLabels[project.platform] || project.platform}`)
  if (project.appVersion) {
    lines.push(`- **앱 버전**: ${project.appVersion}`)
  }
  lines.push(`- **총 시나리오**: ${project.scenarios.length}개`)
  lines.push('')

  // 통계
  const stats = {
    pass: project.scenarios.filter((s) => s.status === 'PASS').length,
    fail: project.scenarios.filter((s) => s.status === 'FAIL').length,
    blocked: project.scenarios.filter((s) => s.status === 'BLOCKED').length,
    skipped: project.scenarios.filter((s) => s.status === 'SKIPPED').length,
    notRun: project.scenarios.filter((s) => s.status === 'NOT_RUN').length,
  }

  lines.push('## 테스트 현황')
  lines.push('')
  lines.push('| 상태 | 개수 |')
  lines.push('|------|------|')
  lines.push(`| ✅ 통과 | ${stats.pass} |`)
  lines.push(`| ❌ 실패 | ${stats.fail} |`)
  lines.push(`| 🟣 차단 | ${stats.blocked} |`)
  lines.push(`| ⏭️ 스킵 | ${stats.skipped} |`)
  lines.push(`| ⬜ 미실행 | ${stats.notRun} |`)
  lines.push('')

  // 진행률
  const executed = stats.pass + stats.fail + stats.blocked + stats.skipped
  const passRate = executed > 0 ? Math.round((stats.pass / executed) * 100) : 0
  lines.push(`**진행률**: ${executed}/${project.scenarios.length} (${Math.round((executed / project.scenarios.length) * 100)}%)`)
  lines.push('')
  lines.push(`**통과율**: ${passRate}%`)
  lines.push('')

  // 카테고리별 그룹화
  const groupedScenarios = project.scenarios.reduce(
    (acc, scenario) => {
      if (!acc[scenario.category]) {
        acc[scenario.category] = []
      }
      acc[scenario.category].push(scenario)
      return acc
    },
    {} as Record<string, Scenario[]>
  )

  lines.push('---')
  lines.push('')
  lines.push('## 테스트 시나리오')
  lines.push('')

  // 각 카테고리별로 출력
  Object.entries(groupedScenarios).forEach(([category, scenarios]) => {
    lines.push(`### ${categoryLabels[category] || category}`)
    lines.push('')

    scenarios.forEach((scenario, index) => {
      lines.push(`#### ${index + 1}. ${scenario.title}`)
      lines.push('')
      lines.push(`- **상태**: ${statusLabels[scenario.status] || scenario.status}`)
      lines.push(`- **우선순위**: ${priorityLabels[scenario.priority] || scenario.priority}`)
      if (scenario.deviceType !== 'BOTH') {
        lines.push(`- **디바이스**: ${scenario.deviceType}`)
      }
      lines.push('')

      if (scenario.description) {
        lines.push(`> ${scenario.description}`)
        lines.push('')
      }

      // 테스트 케이스
      if (scenario.testCases.length > 0) {
        lines.push('**테스트 단계:**')
        lines.push('')
        lines.push('| # | 동작 | 예상 결과 |')
        lines.push('|---|------|----------|')
        scenario.testCases.forEach((tc) => {
          lines.push(`| ${tc.step} | ${tc.action} | ${tc.expected} |`)
        })
        lines.push('')
      }

      // 실패 정보
      if (scenario.status === 'FAIL') {
        if (scenario.failureNote) {
          lines.push(`**실패 사유**: ${scenario.failureNote}`)
          lines.push('')
        }
        if (scenario.bugTicketUrl) {
          lines.push(`**버그 티켓**: [링크](${scenario.bugTicketUrl})`)
          lines.push('')
        }
      }
    })
  })

  // 푸터
  lines.push('---')
  lines.push('')
  lines.push(`*Generated by 럭키밀 QA - ${new Date().toLocaleString('ko-KR')}*`)

  return lines.join('\n')
}
