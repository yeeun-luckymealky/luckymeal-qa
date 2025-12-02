import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addTestCaseSchema = z.object({
  action: z.string().min(1, '동작을 입력하세요'),
  expected: z.string().min(1, '예상 결과를 입력하세요'),
})

// 테스트 케이스 추가
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    const { id: scenarioId } = await params
    const body = await req.json()
    const validated = addTestCaseSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    // 시나리오 존재 확인
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId },
      include: { testCases: { orderBy: { step: 'desc' }, take: 1 } },
    })

    if (!scenario) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '시나리오를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // 다음 step 번호 계산
    const nextStep = scenario.testCases.length > 0 ? scenario.testCases[0].step + 1 : 1

    const { action, expected } = validated.data

    const testCase = await prisma.testCase.create({
      data: {
        scenarioId,
        step: nextStep,
        action,
        expected,
      },
    })

    return NextResponse.json({ success: true, data: testCase }, { status: 201 })
  } catch (error) {
    console.error('Add test case error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

// 테스트 케이스 삭제
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    const { id: scenarioId } = await params
    const { searchParams } = new URL(req.url)
    const testCaseId = searchParams.get('testCaseId')

    if (!testCaseId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'testCaseId가 필요합니다' } },
        { status: 400 }
      )
    }

    // 테스트 케이스 존재 확인
    const testCase = await prisma.testCase.findFirst({
      where: { id: testCaseId, scenarioId },
    })

    if (!testCase) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '테스트 케이스를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    await prisma.testCase.delete({ where: { id: testCaseId } })

    // step 번호 재정렬
    const remainingTestCases = await prisma.testCase.findMany({
      where: { scenarioId },
      orderBy: { step: 'asc' },
    })

    await Promise.all(
      remainingTestCases.map((tc, index) =>
        prisma.testCase.update({
          where: { id: tc.id },
          data: { step: index + 1 },
        })
      )
    )

    return NextResponse.json({ success: true, data: { message: '테스트 케이스가 삭제되었습니다' } })
  } catch (error) {
    console.error('Delete test case error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
