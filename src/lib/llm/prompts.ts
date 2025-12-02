import {
  CONSUMER_APP_CONTEXT,
  SELLER_APP_CONTEXT,
  TEST_CATEGORIES,
  TEST_CONSIDERATIONS,
  PRIORITY_GUIDE,
} from '@/constants/luckymeal'

type Platform = 'CONSUMER_APP' | 'SELLER_APP' | 'BOTH'

export function buildSystemPrompt(): string {
  return `당신은 럭키밀 QA 엔지니어입니다.
주어진 PRD를 분석하여 체계적인 테스트 시나리오를 생성합니다.

당신은 다음 역할을 수행합니다:
1. PRD 내용을 꼼꼼히 분석
2. 정상 플로우와 예외 상황을 모두 파악
3. 럭키밀 도메인 특성을 고려한 테스트 케이스 도출
4. 우선순위에 따른 시나리오 분류

출력은 반드시 지정된 JSON 형식만 사용하세요.`
}

export function buildUserPrompt(
  prdContent: string,
  platform: Platform
): string {
  const platformContext =
    platform === 'SELLER_APP'
      ? SELLER_APP_CONTEXT
      : platform === 'BOTH'
        ? `${CONSUMER_APP_CONTEXT}\n\n${SELLER_APP_CONTEXT}`
        : CONSUMER_APP_CONTEXT

  return `
## 럭키밀 서비스 컨텍스트
${platformContext}

${TEST_CATEGORIES}

${TEST_CONSIDERATIONS}

${PRIORITY_GUIDE}

---

## PRD 내용
${prdContent}

---

## 출력 형식

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

\`\`\`json
{
  "scenarios": [
    {
      "title": "시나리오 제목 (명확하고 구체적으로)",
      "description": "시나리오에 대한 상세 설명",
      "category": "POSITIVE | NEGATIVE | EDGE_CASE | PAYMENT | PICKUP | LOCATION | TIME_SENSITIVE | INVENTORY | NOTIFICATION | NETWORK | AUTH",
      "priority": "CRITICAL | HIGH | MEDIUM | LOW",
      "deviceType": "ANDROID | IOS | BOTH",
      "testCases": [
        {
          "step": 1,
          "action": "사용자가 수행할 구체적인 동작",
          "expected": "예상되는 결과"
        }
      ]
    }
  ]
}
\`\`\`

## 요구사항

1. 각 기능에 대해 최소 3개 이상의 시나리오 생성
2. POSITIVE, NEGATIVE, EDGE_CASE 카테고리는 필수로 포함
3. 테스트 케이스는 3-7단계로 구성
4. 한국어로 작성
5. JSON 블록 외 다른 텍스트 포함 금지
`
}
