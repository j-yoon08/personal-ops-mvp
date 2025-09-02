'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, FolderOpen, Plus, Target, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CreateProjectTaskDialog } from '@/components/dialogs/create-project-task-dialog';

interface ProjectDetail {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  state: string;
  priority: number;
  due_date: string | null;
  project_id: number;
  created_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await axios.get<ProjectDetail>(`http://localhost:8000/projects/${projectId}`);
      return response.data;
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const response = await axios.get<Task[]>(`http://localhost:8000/tasks?project_id=${projectId}`);
      return response.data;
    },
  });

  if (projectLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">프로젝트 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">프로젝트를 찾을 수 없습니다</h1>
          <Button onClick={() => router.push('/projects')}>
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const tasksByState = tasks?.reduce((acc, task) => {
    acc[task.state] = (acc[task.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          프로젝트 목록
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="h-8 w-8" />
            {project.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {project.description || "설명이 없습니다"}
          </p>
        </div>
      </div>

      {/* 프로젝트 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">프로젝트명</label>
              <p className="mt-1">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">생성일</label>
              <p className="mt-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(project.created_at), 'yyyy년 MM월 dd일')}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">설명</label>
            <p className="mt-1">{project.description || "설명이 없습니다"}</p>
          </div>
        </CardContent>
      </Card>

      {/* 작업 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">전체 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">백로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {tasksByState.BACKLOG || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">진행중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tasksByState.IN_PROGRESS || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasksByState.DONE || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">일시정지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tasksByState.PAUSED || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 작업 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>작업 목록</CardTitle>
            <CreateProjectTaskDialog projectId={parseInt(projectId)} />
          </div>
          <CardDescription>
            {tasks?.length ? `${tasks.length}개의 작업이 있습니다` : "아직 작업이 없습니다"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground mt-2">작업을 불러오는 중...</p>
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">작업이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 작업을 생성해보세요
              </p>
              <CreateProjectTaskDialog projectId={parseInt(projectId)} />
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.due_date), 'MM/dd')}
                            </span>
                          )}
                          <span>우선순위: {task.priority}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            task.state === 'DONE' ? 'default' :
                            task.state === 'IN_PROGRESS' ? 'secondary' :
                            task.state === 'PAUSED' ? 'destructive' : 'outline'
                          }
                        >
                          {task.state === 'BACKLOG' ? '백로그' :
                           task.state === 'IN_PROGRESS' ? '진행중' :
                           task.state === 'DONE' ? '완료' :
                           task.state === 'PAUSED' ? '일시정지' : task.state}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/tasks/${task.id}`)}
                        >
                          상세보기
                        </Button>
                      </div>
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