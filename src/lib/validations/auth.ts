import { z } from 'zod'

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'monandol.io'

export const loginSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일을 입력해주세요')
    .refine(
      (email) => email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
      `@${ALLOWED_EMAIL_DOMAIN} 이메일만 사용할 수 있습니다`
    ),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
    email: z
      .string()
      .email('유효한 이메일을 입력해주세요')
      .refine(
        (email) => email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
        `@${ALLOWED_EMAIL_DOMAIN} 이메일만 사용할 수 있습니다`
      ),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)/,
        '비밀번호는 영문과 숫자를 포함해야 합니다'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
