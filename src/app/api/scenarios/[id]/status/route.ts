import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']),
  failureNote: z.string().optional(),
  bugTicketUrl: z.string().url().optional().or(z.literal('')),
  assigneeId: z.string().optional().nullable(),
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
    const validated = statusSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    // 시나리오 존재 및 권한 확인
    const scenario = await prisma.scenario.findFirst({
      where: {
        id,
        project: { userId: session.user.id },
      },
    })

    if (!scenario) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '시나리오를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const { status, failureNote, bugTicketUrl, assigneeId } = validated.data

    const updated = await prisma.scenario.update({
      where: { id },
      data: {
        status,
        failureNote: failureNote || null,
        bugTicketUrl: bugTicketUrl || null,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined,
        executedAt: status !== 'NOT_RUN' ? new Date() : null,
        executedById: status !== 'NOT_RUN' ? session.user.id : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
