import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = registerSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validated.error.flatten().fieldErrors,
          }
        },
        { status: 400 }
      )
    }

    const { name, email, password } = validated.data

    // 이메일 도메인 체크
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'monandol.io'
    if (!email.endsWith(`@${allowedDomain}`)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL_DOMAIN',
            message: `@${allowedDomain} 이메일만 사용할 수 있습니다`,
          }
        },
        { status: 400 }
      )
    }

    // 기존 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: '이미 존재하는 이메일입니다',
          }
        },
        { status: 409 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12)

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          message: '회원가입이 완료되었습니다',
          user,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다',
        }
      },
      { status: 500 }
    )
  }
}
