'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReview } from "@/services/reviews";
import { toast } from "sonner";
import { ReviewCreate, ReviewType } from "@/types/review";

const formSchema = z.object({
  review_type: z.nativeEnum(ReviewType, { message: "리뷰 타입을 선택해주세요" }),
  positives: z.string().min(1, "긍정적인 점을 입력해주세요"),
  negatives: z.string().min(1, "부정적인 점을 입력해주세요"),
  changes_next: z.string().min(1, "다음에 바꿀 점을 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateReviewDialogProps {
  taskId: number;
  triggerText?: string;
}

const reviewTypeConfig = {
  [ReviewType.PREMORTEM]: {
    label: "사전 검토 (Premortem)",
    description: "프로젝트 시작 전 위험 요소와 개선점 분석",
    positiveLabel: "예상되는 장점",
    positivePlaceholder: "이 작업/프로젝트의 예상되는 장점과 성공 요소는 무엇인가요?",
    negativeLabel: "예상되는 위험",
    negativePlaceholder: "어떤 위험 요소나 실패 가능성이 있나요?",
    changesLabel: "사전 준비사항",
    changesPlaceholder: "위험을 줄이고 성공 확률을 높이기 위해 미리 준비할 것은 무엇인가요?"
  },
  [ReviewType.MIDMORTEM]: {
    label: "중간 검토 (Midmortem)",
    description: "프로젝트 진행 중 현황 점검과 조정",
    positiveLabel: "잘 되고 있는 점",
    positivePlaceholder: "현재까지 잘 진행되고 있는 부분은 무엇인가요?",
    negativeLabel: "문제점",
    negativePlaceholder: "현재 겪고 있는 문제나 우려사항은 무엇인가요?",
    changesLabel: "조정할 점",
    changesPlaceholder: "남은 기간 동안 어떤 것을 조정하거나 개선해야 하나요?"
  },
  [ReviewType.RETRO]: {
    label: "회고 (Retrospective)",
    description: "프로젝트 완료 후 결과 분석과 학습",
    positiveLabel: "잘했던 점",
    positivePlaceholder: "이번 작업에서 잘했던 점과 성공 요소는 무엇인가요?",
    negativeLabel: "아쉬웠던 점",
    negativePlaceholder: "아쉽거나 개선이 필요했던 점은 무엇인가요?",
    changesLabel: "다음에 바꿀 점",
    changesPlaceholder: "다음 비슷한 작업에서는 어떤 것을 다르게 해야 할까요?"
  }
};

export function CreateReviewDialog({ 
  taskId, 
  triggerText = "리뷰 추가"
}: CreateReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      review_type: undefined,
      positives: "",
      negatives: "",
      changes_next: "",
    },
  });

  const selectedType = form.watch("review_type");
  const config = selectedType ? reviewTypeConfig[selectedType] : null;

  const createReviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: (result) => {
      if (result === null) {
        toast.error("리뷰 생성에 실패했습니다.");
        return;
      }
      
      toast.success("리뷰가 생성되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["reviews", taskId] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      form.reset({
        review_type: undefined,
        positives: "",
        negatives: "",
        changes_next: "",
      });
      setOpen(false);
    },
    onError: (error: unknown) => {
      toast.error("리뷰 생성 중 오류가 발생했습니다.");
      console.error("Error creating review:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    const reviewData: ReviewCreate = {
      task_id: taskId,
      review_type: values.review_type,
      positives: values.positives,
      negatives: values.negatives,
      changes_next: values.changes_next,
    };
    createReviewMutation.mutate(reviewData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>리뷰 추가</DialogTitle>
          <DialogDescription>
            체계적인 리뷰를 통해 작업의 품질과 학습을 개선합니다.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="review_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>리뷰 타입 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="리뷰 타입을 선택해주세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reviewTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {config && (
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {config && (
              <>
                <FormField
                  control={form.control}
                  name="positives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{config.positiveLabel} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={config.positivePlaceholder}
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="negatives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{config.negativeLabel} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={config.negativePlaceholder}
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="changes_next"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{config.changesLabel} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={config.changesPlaceholder}
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={createReviewMutation.isPending}
              >
                {createReviewMutation.isPending ? "추가 중..." : "추가"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}