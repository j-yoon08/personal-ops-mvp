'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  
  Clock,
  FileText,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface TaskDetail {
  id: number;
  project_id: number;
  title: string;
  state: string;
  priority: number;
  due_date: string | null;
  assignee_id: number | null;
  dod_checked: boolean;
  created_at: string;
  updated_at: string;
  context_switch_count: number;
  rework_count: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

interface Brief {
  id: number;
  task_id: number;
  purpose: string;
  success_criteria: string;
  constraints: string;
  priority: string;
  validation: string;
}

interface DoD {
  id: number;
  task_id: number;
  deliverable_formats: string;
  mandatory_checks: string[];
  quality_bar: string;
  verification: string;
  deadline: string;
  version_tag: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await axios.get<TaskDetail>(`http://localhost:8000/tasks/${taskId}`);
      return response.data;
    },
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', task?.project_id],
    queryFn: async () => {
      if (!task?.project_id) return null;
      const response = await axios.get<Project>(`http://localhost:8000/projects/${task.project_id}`);
      return response.data;
    },
    enabled: !!task?.project_id,
  });

  const { data: brief } = useQuery({
    queryKey: ['brief', taskId],
    queryFn: async () => {
      try {
        const response = await axios.get<Brief>(`http://localhost:8000/briefs/task/${taskId}`);
        return response.data;
      } catch {
        return null;
      }
    },
  });

  const { data: dod } = useQuery({
    queryKey: ['dod', taskId],
    queryFn: async () => {
      try {
        const response = await axios.get<DoD>(`http://localhost:8000/dod/task/${taskId}`);
        return response.data;
      } catch {
        return null;
      }
    },
  });

  if (taskLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">작업 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">작업을 찾을 수 없습니다</h1>
          <Button onClick={() => router.push('/tasks')}>
            작업 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const getStateInfo = (state: string) => {
    switch (state) {
      case 'BACKLOG':
        return { label: '백로그', color: 'bg-gray-500', variant: 'secondary' as const };
      case 'IN_PROGRESS':
        return { label: '진행중', color: 'bg-blue-500', variant: 'default' as const };
      case 'DONE':
        return { label: '완료', color: 'bg-green-500', variant: 'default' as const };
      case 'PAUSED':
        return { label: '일시정지', color: 'bg-yellow-500', variant: 'destructive' as const };
      default:
        return { label: state, color: 'bg-gray-500', variant: 'outline' as const };
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return '최고';
      case 2: return '높음';
      case 3: return '보통';
      case 4: return '낮음';
      case 5: return '최하';
      default: return priority.toString();
    }
  };

  const stateInfo = getStateInfo(task.state);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
          <ArrowLeft className="h-4 w-4" />
          작업 목록
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            {task.title}
          </h1>
          {project && (
            <p className="text-muted-foreground mt-1">
              프로젝트: {project.name}
            </p>
          )}
        </div>
      </div>

      {/* 작업 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>작업 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">상태</label>
              <div className="mt-1">
                <Badge variant={stateInfo.variant}>
                  {stateInfo.label}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">우선순위</label>
              <p className="mt-1">{getPriorityLabel(task.priority)}</p>
            </div>
            <div>
              <label className="text-sm font-medium">마감일</label>
              <p className="mt-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {task.due_date ? format(new Date(task.due_date), 'yyyy년 MM월 dd일') : '설정되지 않음'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">생성일</label>
              <p className="mt-1">{format(new Date(task.created_at), 'yyyy년 MM월 dd일')}</p>
            </div>
            <div>
              <label className="text-sm font-medium">컨텍스트 스위치</label>
              <p className="mt-1">{task.context_switch_count}회</p>
            </div>
            <div>
              <label className="text-sm font-medium">재작업</label>
              <p className="mt-1">{task.rework_count}회</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5SB (Brief) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              5SB (상황-배경-질문)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brief ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">목적 (Purpose)</label>
                  <p className="mt-1 text-sm">{brief.purpose}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">성공 기준</label>
                  <p className="mt-1 text-sm">{brief.success_criteria}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">제약사항</label>
                  <p className="mt-1 text-sm">{brief.constraints}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">우선순위</label>
                  <p className="mt-1 text-sm">{brief.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">검증 방법</label>
                  <p className="mt-1 text-sm">{brief.validation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">5SB가 작성되지 않았습니다</p>
                <Button variant="outline" size="sm" className="mt-2">
                  5SB 작성하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DoD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              DoD (완료 정의)
              {task.dod_checked && (
                <Badge variant="default" className="ml-2">
                  검증됨
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dod ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">산출물 형식</label>
                  <p className="mt-1 text-sm">{dod.deliverable_formats}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">필수 점검사항</label>
                  <ul className="mt-1 text-sm space-y-1">
                    {dod.mandatory_checks.map((check, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        {check}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="text-sm font-medium">품질 기준</label>
                  <p className="mt-1 text-sm">{dod.quality_bar}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">검증 방법</label>
                  <p className="mt-1 text-sm">{dod.verification}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">버전 태그</label>
                  <p className="mt-1 text-sm">{dod.version_tag}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">DoD가 작성되지 않았습니다</p>
                <Button variant="outline" size="sm" className="mt-2">
                  DoD 작성하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 작업 관리 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>작업 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              상태 변경
            </Button>
            <Button variant="outline" size="sm">
              우선순위 변경
            </Button>
            <Button variant="outline" size="sm">
              마감일 설정
            </Button>
            <Button variant="outline" size="sm">
              작업 편집
            </Button>
            {!brief && (
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                5SB 작성
              </Button>
            )}
            {!dod && (
              <Button variant="outline" size="sm">
                <CheckSquare className="h-4 w-4 mr-2" />
                DoD 작성
              </Button>
            )}
            {brief && !task.dod_checked && (
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                DoD 검증
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 성과 지표 */}
      <Card>
        <CardHeader>
          <CardTitle>성과 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {task.context_switch_count}
              </div>
              <p className="text-sm text-muted-foreground">컨텍스트 스위치</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {task.rework_count}
              </div>
              <p className="text-sm text-muted-foreground">재작업 횟수</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${task.dod_checked ? 'text-green-600' : 'text-gray-400'}`}>
                {task.dod_checked ? '100%' : '0%'}
              </div>
              <p className="text-sm text-muted-foreground">DoD 준수율</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}