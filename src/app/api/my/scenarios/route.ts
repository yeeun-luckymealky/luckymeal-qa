import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      )
    }

    // 나에게 할당된 시나리오 조회
    const scenarios = await prisma.scenario.findMany({
      where: {
        assigneeId: session.user.id,
      },
      include: {
        project: {
          select: { id: true, title: true, platform: true },
        },
        testCases: {
          orderBy: { step: 'asc' },
        },
      },
      orderBy: [
        { status: 'asc' }, // NOT_RUN 먼저
        { priority: 'asc' }, // CRITICAL 먼저
        { updatedAt: 'desc' },
      ],
    })

    // 프로젝트별로 그룹화
    const groupedByProject = scenarios.reduce((acc, scenario) => {
      const projectId = scenario.project.id
      if (!acc[projectId]) {
        acc[projectId] = {
          project: scenario.project,
          scenarios: [],
        }
      }
      acc[projectId].scenarios.push(scenario)
      return acc
    }, {} as Record<string, { project: { id: string; title: string; platform: string }; scenarios: typeof scenarios }>)

    // 통계 계산
    const stats = {
      total: scenarios.length,
      notRun: scenarios.filter((s) => s.status === 'NOT_RUN').length,
      pass: scenarios.filter((s) => s.status === 'PASS').length,
      fail: scenarios.filter((s) => s.status === 'FAIL').length,
      blocked: scenarios.filter((s) => s.status === 'BLOCKED').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        scenarios,
        groupedByProject: Object.values(groupedByProject),
        stats,
      },
    })
  } catch (error) {
    console.error('Get my scenarios error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
