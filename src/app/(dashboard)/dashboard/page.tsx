import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await auth()

  const [projectCount, scenarioStats] = await Promise.all([
    prisma.project.count({
      where: { userId: session?.user?.id },
    }),
    prisma.scenario.groupBy({
      by: ['status'],
      where: {
        project: { userId: session?.user?.id },
      },
      _count: true,
    }),
  ])

  const stats = {
    total: scenarioStats.reduce((acc, s) => acc + s._count, 0),
    pass: scenarioStats.find((s) => s.status === 'PASS')?._count || 0,
    fail: scenarioStats.find((s) => s.status === 'FAIL')?._count || 0,
    notRun: scenarioStats.find((s) => s.status === 'NOT_RUN')?._count || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Button asChild>
          <Link href="/projects/new">새 프로젝트</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">프로젝트</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 시나리오</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              미실행: {stats.notRun}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">통과</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.pass}</div>
            {stats.total > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.pass / stats.total) * 100)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">실패</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.fail}</div>
            {stats.total > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.fail / stats.total) * 100)}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 프로젝트</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentProjects userId={session?.user?.id} />
        </CardContent>
      </Card>
    </div>
  )
}

async function RecentProjects({ userId }: { userId?: string }) {
  if (!userId) return null

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      _count: { select: { scenarios: true } },
    },
  })

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 프로젝트가 없습니다. 새 프로젝트를 생성해보세요.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
        >
          <div>
            <h3 className="font-medium">{project.title}</h3>
            <p className="text-sm text-muted-foreground">
              {project.platform} · {project._count.scenarios} 시나리오
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
          </span>
        </Link>
      ))}
    </div>
  )
}
