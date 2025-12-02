import {
  CONSUMER_APP_CONTEXT,
  SELLER_APP_CONTEXT,
  TEST_CATEGORIES,
  TEST_CONSIDERATIONS,
  PRIORITY_GUIDE,
} from '@/constants/luckymeal'

type Platform = 'CONSUMER_APP' | 'SELLER_APP' | 'BOTH'

export function buildSystemPrompt(): string {
  return `당신은 10년 경력의 시니어 QA 엔지니어이자 UX 전문가입니다.
사용자 관점에서 테스트 시나리오를 설계합니다.

## 핵심 원칙

1. **사용자 여정 중심**: 기술 구현이 아닌 사용자가 실제로 하는 행동에 집중
2. **감정과 기대**: 각 단계에서 사용자가 기대하는 것, 느끼는 감정 고려
3. **실제 사용 맥락**: 지하철에서, 바쁜 점심시간에, 처음 사용할 때 등 실제 상황 반영
4. **페르소나 기반**: 다양한 사용자 유형 (신규/기존, 젊은/나이든, 능숙/초보) 고려

## 시나리오 작성 방식

❌ 나쁜 예: "로그인 API가 200을 반환하는지 확인"
✅ 좋은 예: "배고픈 직장인이 점심시간에 빠르게 근처 할인 음식을 찾을 때"

❌ 나쁜 예: "결제 버튼 클릭 시 결제 모듈 호출"
✅ 좋은 예: "결제 직전에 마음이 바뀌어 다른 메뉴로 변경하고 싶을 때"

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

1. **유저 스토리 형식**: 시나리오 제목은 "~할 때" 또는 "~하는 사용자가" 형식으로 작성
2. 각 기능에 대해 최소 3개 이상의 시나리오 생성
3. POSITIVE, NEGATIVE, EDGE_CASE 카테고리는 필수로 포함
4. 테스트 케이스는 3-7단계로 구성 (사용자 행동 중심)
5. **action**: "사용자가 ~한다" 형식 (예: "홈 화면에서 '주변 맛집' 탭을 누른다")
6. **expected**: 사용자가 확인할 수 있는 결과 (예: "현재 위치 기준 500m 내 할인 매장 목록이 표시된다")
7. 한국어로 작성
8. JSON 블록 외 다른 텍스트 포함 금지

## 필수 포함 시나리오 유형

### A. 유저 여정 (30%)
1. **해피 패스**: 이상적인 사용자 여정
2. **첫 사용자**: 앱을 처음 사용하는 사람의 경험
3. **급한 상황**: 시간이 없을 때의 사용 흐름

### B. 엣지 케이스 & 기능 QA (70%)
4. **경계값 테스트**: 최소/최대값, 빈 값, 0개, 1개, 대량 데이터
5. **네트워크 오류**: 느린 네트워크, 타임아웃, 연결 끊김, 재연결
6. **권한 & 상태**: 로그인 만료, 권한 없음, 동시 접속, 세션 충돌
7. **데이터 상태**: 빈 리스트, 데이터 없음, 로딩 중, 에러 상태
8. **입력 검증**: 잘못된 입력, 특수문자, 긴 텍스트, SQL Injection 시도
9. **동시성**: 중복 클릭, 빠른 연속 요청, 동시 수정
10. **실수 복구**: 뒤로가기, 취소, 되돌리기, 새로고침
11. **디바이스 특이**: 화면 회전, 백그라운드 전환, 메모리 부족, 알림

## 엣지 케이스 예시

기능: "매장 목록 보기"
- ✅ 매장이 0개일 때 빈 상태 화면
- ✅ 매장이 1000개 이상일 때 성능/페이징
- ✅ 스크롤 중 네트워크 끊김
- ✅ 새로고침 중 재시도
- ✅ 마지막 페이지 도달 시 더 불러올 데이터 없음

기능: "주문하기"
- ✅ 결제 중 앱 종료
- ✅ 재고가 0이 된 상품 주문 시도
- ✅ 동시에 같은 상품 마지막 1개 주문
- ✅ 결제 버튼 더블 클릭
- ✅ 결제 도중 상품 가격 변경

## 시나리오 비율 가이드

- POSITIVE (정상): 20%
- NEGATIVE (오류/예외): 40%
- EDGE_CASE (경계값/특수): 40%
`
}
