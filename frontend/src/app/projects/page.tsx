'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/use-projects';
import { CreateProjectDialog } from '@/components/dialogs/create-project-dialog';
import { FolderOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="h-8 w-8" />
            프로젝트 관리
          </h1>
          <p className="text-muted-foreground">
            전체 프로젝트 현황 및 관리
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">전체 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">총 작업 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {projects?.reduce((total, project) => total + (project.task_count || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">평균 작업/프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {projects?.length 
                ? Math.round((projects.reduce((total, project) => total + (project.task_count || 0), 0) / projects.length) * 10) / 10
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 프로젝트 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 목록</CardTitle>
          <CardDescription>
            {projects?.length ? `${projects.length}개의 프로젝트가 있습니다` : "아직 프로젝트가 없습니다"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">프로젝트가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 프로젝트를 생성해보세요
              </p>
              <CreateProjectDialog />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="outline">
                        {project.task_count || 0}개 작업
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || "설명이 없습니다"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {project.created_at && format(new Date(project.created_at), 'yyyy-MM-dd')}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        상세보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}