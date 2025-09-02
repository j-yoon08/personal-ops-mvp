'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProject } from '@/hooks/use-projects';
import { useTasks, useUpdateTaskState } from '@/hooks/use-tasks';
import { CreateTaskDialogWithProject } from '@/components/dialogs/create-task-dialog-with-project';
import { EditProjectDialog } from '@/components/dialogs/edit-project-dialog';
import { TaskCard } from '@/components/task-card';
import { TaskState } from '@/types';
import { 
  FolderOpen, 
  ArrowLeft, 
  Calendar, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Pause, 
  X,
  
  
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { exportProjectToMarkdown, downloadMarkdownFile } from '@/services/exports';

const stateConfig = {
  [TaskState.BACKLOG]: {
    label: '대기',
    icon: Clock,
    variant: 'secondary' as const
  },
  [TaskState.IN_PROGRESS]: {
    label: '진행중',
    icon: AlertCircle,
    variant: 'default' as const
  },
  [TaskState.DONE]: {
    label: '완료',
    icon: CheckCircle,
    variant: 'secondary' as const
  },
  [TaskState.PAUSED]: {
    label: '중단',
    icon: Pause,
    variant: 'outline' as const
  },
  [TaskState.CANCELED]: {
    label: '취소',
    icon: X,
    variant: 'destructive' as const
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: tasksLoading } = useTasks();
  const updateTaskState = useUpdateTaskState();
  
  const [filter, setFilter] = useState<TaskState | 'ALL'>('ALL');

  // 해당 프로젝트의 작업들만 필터링
  const projectTasks = allTasks?.filter(task => task.project_id === projectId) || [];
  const filteredTasks = projectTasks.filter(task => 
    filter === 'ALL' || task.state === filter
  );

  // 통계 계산
  const stats = {
    total: projectTasks.length,
    backlog: projectTasks.filter(t => t.state === TaskState.BACKLOG).length,
    inProgress: projectTasks.filter(t => t.state === TaskState.IN_PROGRESS).length,
    done: projectTasks.filter(t => t.state === TaskState.DONE).length,
    paused: projectTasks.filter(t => t.state === TaskState.PAUSED).length,
    canceled: projectTasks.filter(t => t.state === TaskState.CANCELED).length,
  };

  const completionRate = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await exportProjectToMarkdown(projectId);
      const filename = `${project?.name || 'project'}_${format(new Date(), 'yyyy-MM-dd')}.md`;
      downloadMarkdownFile(blob, filename);
      return filename;
    },
    onSuccess: (filename) => {
      toast.success(`${filename} 파일이 다운로드되었습니다!`);
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.detail || '내보내기에 실패했습니다.';
      toast.error(errorMessage);
      console.error('Export error:', error);
    }
  });

  const handleStateChange = async (taskId: number, newState: TaskState) => {
    try {
      await updateTaskState.mutateAsync({ id: taskId, data: { state: newState } });
      toast.success('작업 상태가 변경되었습니다');
    } catch (error: unknown) {
      const errorMessage = (error as any)?.response?.data?.detail || '상태 변경에 실패했습니다';
      toast.error(errorMessage);
    }
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  if (projectLoading || tasksLoading) {
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
        <div className="text-center py-12">
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">프로젝트를 찾을 수 없습니다</h3>
          <p className="text-muted-foreground mb-4">요청하신 프로젝트가 존재하지 않습니다.</p>
          <Button onClick={() => router.push('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            프로젝트 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/projects')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>뒤로</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderOpen className="h-8 w-8" />
              {project.name}
            </h1>
            <p className="text-muted-foreground">
              {project.description || "설명이 없습니다"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <CreateTaskDialogWithProject 
            defaultProjectId={projectId}
            triggerText="작업 추가"
          />
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? '내보내는 중...' : 'MD 내보내기'}
          </Button>
          <EditProjectDialog project={project} />
        </div>
      </div>

      {/* 프로젝트 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">생성일</p>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(project.created_at), 'yyyy-MM-dd')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">총 작업 수</p>
              <p className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                {stats.total}개
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">완료율</p>
              <p className="text-lg font-semibold">
                {completionRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">진행중 작업</p>
              <p className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {stats.inProgress}개
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 작업 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(stats).filter(([key]) => key !== 'total').map(([key, value]) => {
          const stateKey = key === 'inProgress' ? TaskState.IN_PROGRESS : 
                          key === 'backlog' ? TaskState.BACKLOG :
                          key === 'done' ? TaskState.DONE :
                          key === 'paused' ? TaskState.PAUSED :
                          TaskState.CANCELED;
          const config = stateConfig[stateKey];
          const Icon = config.icon;
          
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 필터 버튼 */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
        >
          전체 ({stats.total})
        </Button>
        {Object.entries(TaskState).map(([key, value]) => {
          const config = stateConfig[value];
          const statKey = key.toLowerCase() === 'in_progress' ? 'inProgress' : key.toLowerCase();
          const count = stats[statKey as keyof typeof stats] as number;
          
          return (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'outline'}
              onClick={() => setFilter(value)}
              className="flex items-center gap-1"
            >
              <config.icon className="h-4 w-4" />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* 작업 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>작업 목록</CardTitle>
          <CardDescription>
            {filteredTasks.length ? `${filteredTasks.length}개의 작업` : "작업이 없습니다"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">작업이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                이 프로젝트에 새로운 작업을 추가해보세요
              </p>
              <CreateTaskDialogWithProject 
                defaultProjectId={projectId}
                triggerText="작업 추가"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  onStateChange={handleStateChange}
                  isUpdating={updateTaskState.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}