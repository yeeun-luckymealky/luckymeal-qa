import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

const platformLabels = {
  CONSUMER_APP: '소비자 앱',
  SELLER_APP: '셀러 앱',
  BOTH: '모두',
}

export default async function ProjectsPage() {
  const session = await auth()

  const projects = await prisma.project.findMany({
    where: { userId: session?.user?.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { scenarios: true } },
      scenarios: {
        select: { status: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">프로젝트</h1>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            새 프로젝트
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">아직 프로젝트가 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            새 프로젝트를 생성하여 테스트 시나리오를 만들어보세요.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const passCount = project.scenarios.filter((s) => s.status === 'PASS').length
            const failCount = project.scenarios.filter((s) => s.status === 'FAIL').length
            const totalCount = project._count.scenarios

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">
                        {project.title}
                      </CardTitle>
                      <Badge variant="secondary">
                        {platformLabels[project.platform]}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {totalCount} 시나리오
                      </span>
                      <div className="flex gap-2">
                        {passCount > 0 && (
                          <span className="text-green-600">{passCount} Pass</span>
                        )}
                        {failCount > 0 && (
                          <span className="text-red-600">{failCount} Fail</span>
                        )}
                      </div>
                    </div>
                    {project.appVersion && (
                      <p className="text-xs text-muted-foreground mt-2">
                        v{project.appVersion}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
