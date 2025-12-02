import { ScenarioCategory, Priority, DeviceType } from '@prisma/client'

interface TestCase {
  step: number
  action: string
  expected: string
}

interface GeneratedScenario {
  title: string
  description?: string
  category: ScenarioCategory
  priority: Priority
  deviceType: DeviceType
  testCases: TestCase[]
}

interface ParsedResponse {
  scenarios: GeneratedScenario[]
}

const validCategories: ScenarioCategory[] = [
  'POSITIVE',
  'NEGATIVE',
  'EDGE_CASE',
  'PAYMENT',
  'PICKUP',
  'LOCATION',
  'NOTIFICATION',
  'TIME_SENSITIVE',
  'INVENTORY',
  'AUTH',
  'NETWORK',
]

const validPriorities: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const validDeviceTypes: DeviceType[] = ['ANDROID', 'IOS', 'BOTH']

export function parseScenarioResponse(response: string): ParsedResponse {
  // JSON 블록 추출
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)

  let jsonStr: string
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  } else {
    // JSON 블록이 없으면 전체를 JSON으로 파싱 시도
    jsonStr = response.trim()
  }

  try {
    const parsed = JSON.parse(jsonStr)

    // 유효성 검증
    if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) {
      throw new Error('Invalid response structure: scenarios array not found')
    }

    // 각 시나리오 검증 및 정규화
    const validatedScenarios: GeneratedScenario[] = parsed.scenarios.map(
      (scenario: Record<string, unknown>, index: number) => {
        if (!scenario.title || typeof scenario.title !== 'string') {
          throw new Error(`Scenario ${index + 1}: title is required`)
        }

        // 카테고리 검증
        const category = (scenario.category as string)?.toUpperCase() as ScenarioCategory
        if (!validCategories.includes(category)) {
          console.warn(`Invalid category "${scenario.category}", defaulting to POSITIVE`)
        }

        // 우선순위 검증
        const priority = (scenario.priority as string)?.toUpperCase() as Priority
        if (!validPriorities.includes(priority)) {
          console.warn(`Invalid priority "${scenario.priority}", defaulting to MEDIUM`)
        }

        // 디바이스 타입 검증
        const deviceType = (scenario.deviceType as string)?.toUpperCase() as DeviceType
        if (!validDeviceTypes.includes(deviceType)) {
          console.warn(`Invalid deviceType "${scenario.deviceType}", defaulting to BOTH`)
        }

        // 테스트 케이스 검증
        const testCases: TestCase[] = Array.isArray(scenario.testCases)
          ? scenario.testCases.map((tc: Record<string, unknown>, tcIndex: number) => ({
              step: typeof tc.step === 'number' ? tc.step : tcIndex + 1,
              action: String(tc.action || ''),
              expected: String(tc.expected || ''),
            }))
          : []

        return {
          title: scenario.title,
          description: scenario.description ? String(scenario.description) : undefined,
          category: validCategories.includes(category) ? category : 'POSITIVE',
          priority: validPriorities.includes(priority) ? priority : 'MEDIUM',
          deviceType: validDeviceTypes.includes(deviceType) ? deviceType : 'BOTH',
          testCases,
        }
      }
    )

    return { scenarios: validatedScenarios }
  } catch (error) {
    console.error('Parse error:', error)
    throw new Error(`Failed to parse LLM response: ${error}`)
  }
}
