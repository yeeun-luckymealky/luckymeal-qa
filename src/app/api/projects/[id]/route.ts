import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { updateProjectSchema } from '@/lib/validations/project'

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

    const project = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
      include: {
        scenarios: {
          orderBy: { order: 'asc' },
          include: {
            testCases: { orderBy: { step: 'asc' } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { scenarios: true, testRuns: true } },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const validated = updateProjectSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    const existing = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const { releaseDate, prdNotionUrl, ...data } = validated.data

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        prdNotionUrl: prdNotionUrl || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
      },
    })

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Update project error:', error)
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

    const existing = await prisma.project.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    await prisma.project.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { message: '프로젝트가 삭제되었습니다' } })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
