import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(
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

    const { id } = await params

    const testRun = await prisma.testRun.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
      include: {
        project: { select: { id: true, title: true } },
        results: {
          include: {
            scenario: {
              select: {
                id: true,
                title: true,
                category: true,
                priority: true,
                deviceType: true,
              },
            },
          },
        },
      },
    })

    if (!testRun) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '테스트 런을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // 통계 계산
    const stats = {
      total: testRun.results.length,
      pass: testRun.results.filter((r) => r.status === 'PASS').length,
      fail: testRun.results.filter((r) => r.status === 'FAIL').length,
      blocked: testRun.results.filter((r) => r.status === 'BLOCKED').length,
      skipped: testRun.results.filter((r) => r.status === 'SKIPPED').length,
      notRun: testRun.results.filter((r) => r.status === 'NOT_RUN').length,
    }

    return NextResponse.json({ success: true, data: { ...testRun, stats } })
  } catch (error) {
    console.error('Get test run error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

const updateResultSchema = z.object({
  resultId: z.string(),
  status: z.enum(['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']),
  note: z.string().optional(),
})

export async function PATCH(
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

    const { id } = await params
    const body = await req.json()
    const validated = updateResultSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    const { resultId, status, note } = validated.data

    // 테스트 런 권한 확인
    const testRun = await prisma.testRun.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
    })

    if (!testRun) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '테스트 런을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // 결과 업데이트
    const updatedResult = await prisma.testRunResult.update({
      where: { id: resultId, testRunId: id },
      data: {
        status,
        note: note || null,
        executedAt: status !== 'NOT_RUN' ? new Date() : undefined,
      },
      include: {
        scenario: {
          select: { id: true, title: true, priority: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: updatedResult })
  } catch (error) {
    console.error('Update test run result error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

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

    const { id } = await params

    const testRun = await prisma.testRun.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
    })

    if (!testRun) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '테스트 런을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    await prisma.testRun.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { message: '테스트 런이 삭제되었습니다' } })
  } catch (error) {
    console.error('Delete test run error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
