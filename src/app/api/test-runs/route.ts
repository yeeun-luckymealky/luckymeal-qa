import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTestRunSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  appVersion: z.string().min(1, '앱 버전을 입력하세요'),
  environment: z.enum(['STAGING', 'PRODUCTION']).default('STAGING'),
  projectId: z.string(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'projectId가 필요합니다' } },
        { status: 400 }
      )
    }

    // 프로젝트 권한 확인
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const testRuns = await prisma.testRun.findMany({
      where: { projectId },
      include: {
        _count: { select: { results: true } },
        results: {
          select: { status: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    // 각 테스트 런의 통계 계산
    const testRunsWithStats = testRuns.map((run) => {
      const stats = {
        total: run.results.length,
        pass: run.results.filter((r) => r.status === 'PASS').length,
        fail: run.results.filter((r) => r.status === 'FAIL').length,
        blocked: run.results.filter((r) => r.status === 'BLOCKED').length,
        skipped: run.results.filter((r) => r.status === 'SKIPPED').length,
        notRun: run.results.filter((r) => r.status === 'NOT_RUN').length,
      }
      const { results, ...runData } = run
      return { ...runData, stats }
    })

    return NextResponse.json({ success: true, data: testRunsWithStats })
  } catch (error) {
    console.error('Get test runs error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

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
    const validated = createTestRunSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    const { name, appVersion, environment, projectId } = validated.data

    // 프로젝트 권한 확인
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      include: {
        scenarios: { select: { id: true } },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // 테스트 런 생성 및 모든 시나리오에 대한 초기 결과 생성
    const testRun = await prisma.testRun.create({
      data: {
        name,
        appVersion,
        environment,
        projectId,
        results: {
          create: project.scenarios.map((scenario) => ({
            scenarioId: scenario.id,
            status: 'NOT_RUN',
          })),
        },
      },
      include: {
        results: {
          include: {
            scenario: {
              select: { id: true, title: true, priority: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: testRun }, { status: 201 })
  } catch (error) {
    console.error('Create test run error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
