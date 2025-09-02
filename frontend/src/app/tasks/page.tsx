'use client';

import { ApiError, useState } from 'react';
import { ApiError, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError, Badge } from '@/components/ui/badge';
import { ApiError, Button } from '@/components/ui/button';
import { ApiError, Input } from '@/components/ui/input';
import { ApiError,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError, useTasks, useUpdateTaskState } from '@/hooks/use-tasks';
import { ApiError, useProjects } from '@/hooks/use-projects';
import { ApiError, CreateTaskDialog } from '@/components/dialogs/create-task-dialog';
import { ApiError, TaskState, ApiError } from '@/types';
import { ApiError, CheckSquare, Clock, AlertCircle, CheckCircle, Pause, X, Search, Filter, SortAsc, User, Target, Calendar } from 'lucide-react';
import { ApiError, toast } from 'sonner';
import Link from 'next/link';
import { ApiError, format } from 'date-fns';

const stateConfig = {
  [TaskState.BACKLOG]: {
    label: '대기',
    icon: Clock,
    color: 'bg-gray-500',
    variant: 'secondary' as const
  },
  [TaskState.IN_PROGRESS]: {
    label: '진행중',
    icon: AlertCircle,
    color: 'bg-blue-500',
    variant: 'default' as const
  },
  [TaskState.DONE]: {
    label: '완료',
    icon: CheckCircle,
    color: 'bg-green-500',
    variant: 'secondary' as const
  },
  [TaskState.PAUSED]: {
    label: '중단',
    icon: Pause,
    color: 'bg-yellow-500',
    variant: 'outline' as const
  },
  [TaskState.CANCELED]: {
    label: '취소',
    icon: X,
    color: 'bg-red-500',
    variant: 'destructive' as const
  }
};

type SortBy = 'created' | 'title' | 'priority' | 'due_date';
type SortOrder = 'asc' | 'desc';

export default function TasksPage() {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const updateTaskState = useUpdateTaskState();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<TaskState | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 검색 및 필터링
  const filteredTasks = tasks?.filter(task => {
    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const project = projects?.find(p => p.id === task.project_id);
      const matchesProject = project?.name.toLowerCase().includes(searchLower);
      
      if (!matchesTitle && !matchesProject) return false;
    }
    
    // 상태 필터
    if (stateFilter !== 'ALL' && task.state !== stateFilter) return false;
    
    // 프로젝트 필터
    if (projectFilter !== 'ALL' && task.project_id !== projectFilter) return false;
    
    return true;
  }) || [];

  // 정렬
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valueA: string | number | Date, valueB: string | number | Date;
    
    switch (sortBy) {
      case 'title':
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
        break;
      case 'priority':
        valueA = a.priority;
        valueB = b.priority;
        break;
      case 'due_date':
        valueA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
        valueB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
        break;
      case 'created':
      default:
        valueA = new Date(a.created_at);
        valueB = new Date(b.created_at);
        break;
    }
    
    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 통계 계산 (전체 작업 기준)
  const stats = {
    total: tasks?.length || 0,
    backlog: tasks?.filter(t => t.state === TaskState.BACKLOG).length || 0,
    inProgress: tasks?.filter(t => t.state === TaskState.IN_PROGRESS).length || 0,
    done: tasks?.filter(t => t.state === TaskState.DONE).length || 0,
    paused: tasks?.filter(t => t.state === TaskState.PAUSED).length || 0,
    canceled: tasks?.filter(t => t.state === TaskState.CANCELED).length || 0,
  };

  // 필터링된 통계
  const filteredStats = {
    total: sortedTasks.length,
    backlog: sortedTasks.filter(t => t.state === TaskState.BACKLOG).length,
    inProgress: sortedTasks.filter(t => t.state === TaskState.IN_PROGRESS).length,
    done: sortedTasks.filter(t => t.state === TaskState.DONE).length,
    paused: sortedTasks.filter(t => t.state === TaskState.PAUSED).length,
    canceled: sortedTasks.filter(t => t.state === TaskState.CANCELED).length,
  };

  const getStateInfo = (state: TaskState) => {
    return stateConfig[state] || { label: state, variant: 'outline' as const };
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

  const handleStateChange = async (taskId: number, newState: TaskState) => {
    try {
      await updateTaskState.mutateAsync({ id: taskId, data: { state: newState } });
      toast.success('작업 상태가 변경되었습니다');
    } catch (error: unknown) {
      const errorMessage = ((error as ApiError)?.response?.data?.detail) || '상태 변경에 실패했습니다';
      toast.error(errorMessage);
    }
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">작업을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CheckSquare className="h-8 w-8" />
              작업 관리
            </h1>
            <p className="text-muted-foreground">
              전체 작업 현황 및 상태 관리 - 모든 프로젝트의 작업을 한 곳에서
            </p>
          </div>
          <CreateTaskDialog />
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색바 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="작업명이나 프로젝트명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 필터 */}
          <div className="flex gap-2">
            <Select value={stateFilter.toString()} onValueChange={(value) => setStateFilter(value as TaskState | 'ALL')}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">모든 상태</SelectItem>
                {Object.entries(TaskState).map(([key, value]) => {
                  const config = stateConfig[value];
                  return (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={projectFilter.toString()} onValueChange={(value) => setProjectFilter(value === 'ALL' ? 'ALL' : parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="프로젝트" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">모든 프로젝트</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id!.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split('-') as [SortBy, SortOrder];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}>
              <SelectTrigger className="w-[140px]">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created-desc">최신순</SelectItem>
                <SelectItem value="created-asc">오래된순</SelectItem>
                <SelectItem value="title-asc">이름순 (A-Z)</SelectItem>
                <SelectItem value="title-desc">이름순 (Z-A)</SelectItem>
                <SelectItem value="priority-asc">우선순위 (낮음)</SelectItem>
                <SelectItem value="priority-desc">우선순위 (높음)</SelectItem>
                <SelectItem value="due_date-asc">마감일 (빠름)</SelectItem>
                <SelectItem value="due_date-desc">마감일 (늦음)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(stats).map(([key, value]) => {
          const config = key === 'total' ? null : stateConfig[key as TaskState];
          const Icon = config?.icon || CheckSquare;
          const filteredValue = filteredStats[key as keyof typeof filteredStats];
          
          return (
            <Card 
              key={key} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                (key === 'total' && stateFilter === 'ALL') || 
                (stateFilter === key.toUpperCase()) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setStateFilter(key === 'total' ? 'ALL' : key.toUpperCase() as TaskState)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {key === 'total' ? '전체' :
                       key === 'backlog' ? '대기' :
                       key === 'inProgress' ? '진행중' :
                       key === 'done' ? '완료' :
                       key === 'paused' ? '중단' :
                       '취소'}
                    </p>
                    <p className="text-2xl font-bold">
                      {searchTerm || projectFilter !== 'ALL' ? filteredValue : value}
                    </p>
                    {(searchTerm || projectFilter !== 'ALL') && value !== filteredValue && (
                      <p className="text-xs text-muted-foreground">전체: {value}</p>
                    )}
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 작업 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>작업 목록</CardTitle>
              <CardDescription>
                {sortedTasks.length ? (
                  <>
                    {sortedTasks.length}개의 작업
                    {(searchTerm || stateFilter !== 'ALL' || projectFilter !== 'ALL') && 
                     ` (전체 ${tasks?.length || 0}개 중)`
                    }
                  </>
                ) : (
                  "조건에 맞는 작업이 없습니다"
                )}
              </CardDescription>
            </div>
            
            {/* 필터 상태 표시 */}
            {(searchTerm || stateFilter !== 'ALL' || projectFilter !== 'ALL') && (
              <div className="flex items-center gap-2">
                {searchTerm && (
                  <Badge variant="outline">
                    검색: {searchTerm}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                  </Badge>
                )}
                {stateFilter !== 'ALL' && (
                  <Badge variant="outline">
                    상태: {stateConfig[stateFilter].label}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setStateFilter('ALL')} />
                  </Badge>
                )}
                {projectFilter !== 'ALL' && (
                  <Badge variant="outline">
                    프로젝트: {projects?.find(p => p.id === projectFilter)?.name}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setProjectFilter('ALL')} />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setStateFilter('ALL');
                    setProjectFilter('ALL');
                  }}
                >
                  전체 초기화
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {!tasks?.length ? "작업이 없습니다" : "조건에 맞는 작업이 없습니다"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {!tasks?.length ? 
                  "새로운 작업을 생성해보세요" : 
                  "다른 검색어나 필터를 사용해보세요"
                }
              </p>
              {!tasks?.length && <CreateTaskDialog />}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTasks.map((task) => {
                const project = projects?.find(p => p.id === task.project_id);
                const stateInfo = getStateInfo(task.state);
                const priorityLabel = getPriorityLabel(task.priority);
                
                return (
                  <Card key={task.id} className="border-l-4 border-l-blue-500 hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{task.title}</h3>
                            <Badge variant={stateInfo.variant}>
                              {stateInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <Link 
                                href={`/projects/${task.project_id}`}
                                className="hover:underline"
                              >
                                {project?.name || `프로젝트 ${task.project_id}`}
                              </Link>
                            </div>
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(task.due_date), 'yyyy-MM-dd')}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              우선순위: {priorityLabel}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link href={`/tasks/${task.id}`}>
                              상세보기
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            asChild
                          >
                            <Link href={`/projects/${task.project_id}`}>
                              프로젝트 보기
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>생성: {format(new Date(task.created_at), 'MM/dd')}</span>
                          <span>컨텍스트 스위치: {task.context_switch_count || 0}회</span>
                          <span>재작업: {task.rework_count || 0}회</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {Object.values(TaskState).map((state) => (
                            <Button
                              key={state}
                              variant={task.state === state ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStateChange(task.id!, state)}
                              disabled={updateTaskState.isPending}
                              className="min-w-[80px]"
                            >
                              {getStateInfo(state).label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}