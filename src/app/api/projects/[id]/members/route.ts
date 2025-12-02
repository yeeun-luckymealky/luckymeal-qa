import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

// 멤버 목록 조회
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

    // 프로젝트 접근 권한 확인 (소유자 또는 멤버)
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { invitedAt: 'asc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // 소유자 + 멤버 목록 반환
    const members = [
      { ...project.user, role: 'OWNER', isOwner: true },
      ...project.members.map((m) => ({
        ...m.user,
        role: m.role,
        memberId: m.id,
        isOwner: false,
      })),
    ]

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

// 멤버 초대
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

    const { id } = await params
    const body = await req.json()
    const validated = inviteSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.flatten().fieldErrors } },
        { status: 400 }
      )
    }

    const { email, role } = validated.data

    // 프로젝트 소유자 또는 ADMIN만 초대 가능
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id, role: 'ADMIN' } } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '멤버를 초대할 권한이 없습니다' } },
        { status: 403 }
      )
    }

    // 초대할 사용자 찾기
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    })

    if (!userToInvite) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '해당 이메일의 사용자가 없습니다. 먼저 회원가입이 필요합니다.' } },
        { status: 404 }
      )
    }

    // 이미 소유자인지 확인
    if (project.userId === userToInvite.id) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_OWNER', message: '프로젝트 소유자입니다' } },
        { status: 400 }
      )
    }

    // 이미 멤버인지 확인
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId: userToInvite.id },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_MEMBER', message: '이미 프로젝트 멤버입니다' } },
        { status: 400 }
      )
    }

    // 멤버 추가
    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToInvite.id,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

// 멤버 제거
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
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'memberId가 필요합니다' } },
        { status: 400 }
      )
    }

    // 프로젝트 소유자 또는 ADMIN만 제거 가능
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id, role: 'ADMIN' } } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '멤버를 제거할 권한이 없습니다' } },
        { status: 403 }
      )
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true, data: { message: '멤버가 제거되었습니다' } })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
