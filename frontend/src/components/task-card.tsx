'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Task, TaskState } from '@/types';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Pause,
  X,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getBriefByTask } from '@/services/briefs';
import { getDoDByTask } from '@/services/dod';
import { getDecisionsByTask } from '@/services/decisions';
import { getReviewsByTask } from '@/services/reviews';
import { CreateBriefDialog } from '@/components/dialogs/create-brief-dialog';
import { EditBriefDialog } from '@/components/dialogs/edit-brief-dialog';
import { CreateDoDDialog } from '@/components/dialogs/create-dod-dialog';
import { EditDoDDialog } from '@/components/dialogs/edit-dod-dialog';
import { CreateDecisionDialog } from '@/components/dialogs/create-decision-dialog';
import { CreateReviewDialog } from '@/components/dialogs/create-review-dialog';

function toValidDate(input?: string | Date | null) {
  if (!input) return null;
  try {
    const d = typeof input === 'string' ? parseISO(input) : input;
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

function formatDateSafe(input?: string | Date | null, fmt = 'yyyy-MM-dd', fallback = '—') {
  const d = toValidDate(input);
  return d ? format(d, fmt) : fallback;
}

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

interface TaskCardProps {
  task: Task;
  onStateChange: (taskId: number, newState: TaskState) => void;
  isUpdating: boolean;
}

export function TaskCard({ task, onStateChange, isUpdating }: TaskCardProps) {
  const config = stateConfig[task.state];
  const Icon = config.icon;

  // Brief 존재 여부 확인
  const { data: brief } = useQuery({
    queryKey: ["brief", task.id],
    queryFn: () => getBriefByTask(task.id!),
    retry: false,
  });

  // DoD 존재 여부 확인
  const { data: dod } = useQuery({
    queryKey: ["dod", task.id],
    queryFn: () => getDoDByTask(task.id!),
    retry: false,
  });

  // Decisions 존재 여부 확인
  const { data: decisions } = useQuery({
    queryKey: ["decisions", task.id],
    queryFn: () => getDecisionsByTask(task.id!),
    retry: false,
  });

  // Reviews 존재 여부 확인
  const { data: reviews } = useQuery({
    queryKey: ["reviews", task.id],
    queryFn: () => getReviewsByTask(task.id!),
    retry: false,
  });

  const hasBrief = !!brief;
  const hasDoD = !!dod;
  const hasDecisions = decisions && decisions.length > 0;
  const hasReviews = reviews && reviews.length > 0;

  return (
    <Card key={task.id} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Badge variant={config.variant} className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
            <Badge variant="outline">P{task.priority}</Badge>
            {hasDoD && (
              <Badge variant="secondary">DoD ✓</Badge>
            )}
            {hasBrief && (
              <Badge variant="secondary">5SB ✓</Badge>
            )}
            {hasDecisions && (
              <Badge variant="secondary">결정 {decisions?.length || 0}</Badge>
            )}
            {hasReviews && (
              <Badge variant="secondary">리뷰 {reviews?.length || 0}</Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
          <div className="text-sm text-muted-foreground">
            생성: {formatDateSafe(task.created_at)}
            {task.due_date && (
              <span className="ml-4">
                마감: {formatDateSafe(task.due_date)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* 리뷰 버튼 */}
          <div className="flex gap-1">
            <CreateReviewDialog taskId={task.id!} triggerText="리뷰" />
          </div>

          {/* 의사결정 버튼 */}
          <div className="flex gap-1">
            <CreateDecisionDialog taskId={task.id!} triggerText="결정" />
          </div>

          {/* DoD 버튼 */}
          <div className="flex gap-1">
            {hasDoD ? (
              <EditDoDDialog taskId={task.id!} triggerText="DoD" />
            ) : (
              <CreateDoDDialog taskId={task.id!} triggerText="DoD" />
            )}
          </div>

          {/* 5SB 버튼 */}
          <div className="flex gap-1">
            {hasBrief ? (
              <EditBriefDialog taskId={task.id!} triggerText="5SB" />
            ) : (
              <CreateBriefDialog taskId={task.id!} triggerText="5SB" />
            )}
          </div>

          {/* 상태 변경 버튼 */}
          {task.state !== TaskState.DONE && (
            <>
              {task.state === TaskState.BACKLOG && (
                <Button
                  size="sm"
                  onClick={() => onStateChange(task.id!, TaskState.IN_PROGRESS)}
                  disabled={isUpdating}
                >
                  시작
                </Button>
              )}
              {task.state === TaskState.IN_PROGRESS && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onStateChange(task.id!, TaskState.DONE)}
                  disabled={isUpdating}
                >
                  완료
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}