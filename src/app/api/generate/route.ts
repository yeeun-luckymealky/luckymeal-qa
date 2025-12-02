import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateCompletion } from '@/lib/llm/client'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/llm/prompts'
import { parseScenarioResponse } from '@/lib/llm/parser'
import { z } from 'zod'

const generateSchema = z.object({
  projectId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = generateSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    const { projectId } = validated.data

    // 프로젝트 조회 및 권한 확인
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // API 키 확인
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'API 키가 설정되지 않았습니다' } },
        { status: 500 }
      )
    }

    // LLM으로 시나리오 생성
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(project.prdContent, project.platform)

    const response = await generateCompletion(systemPrompt, userPrompt)
    const { scenarios } = parseScenarioResponse(response)

    // 기존 시나리오 삭제 (재생성 시)
    await prisma.scenario.deleteMany({
      where: { projectId },
    })

    // 시나리오 저장
    const createdScenarios = await Promise.all(
      scenarios.map(async (scenario, index) => {
        return prisma.scenario.create({
          data: {
            title: scenario.title,
            description: scenario.description,
            category: scenario.category,
            priority: scenario.priority,
            deviceType: scenario.deviceType,
            order: index,
            projectId,
            testCases: {
              create: scenario.testCases.map((tc) => ({
                step: tc.step,
                action: tc.action,
                expected: tc.expected,
              })),
            },
          },
          include: { testCases: true },
        })
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        scenarios: createdScenarios,
        count: createdScenarios.length,
      },
    })
  } catch (error) {
    console.error('Generate error:', error)

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: `시나리오 생성 실패: ${errorMessage}`,
        },
      },
      { status: 500 }
    )
  }
}
