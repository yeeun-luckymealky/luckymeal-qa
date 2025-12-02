import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateMarkdown } from '@/lib/export/markdown'

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
          include: { testCases: { orderBy: { step: 'asc' } } },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '프로젝트를 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    const markdown = generateMarkdown(project)

    // 파일명 생성 (한글 제거, 공백을 대시로)
    const filename = `${project.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.md`

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}
