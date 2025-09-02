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
import { Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateReview, deleteReview } from "@/services/reviews";
import { toast } from "sonner";
import { Review, ReviewCreate, ReviewType } from "@/types/review";

const formSchema = z.object({
  review_type: z.nativeEnum(ReviewType, { message: "리뷰 타입을 선택해주세요" }),
  positives: z.string().min(1, "긍정적인 점을 입력해주세요"),
  negatives: z.string().min(1, "부정적인 점을 입력해주세요"),
  changes_next: z.string().min(1, "다음에 바꿀 점을 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditReviewDialogProps {
  review: Review;
  taskId: number;
  triggerText?: string;
}

const reviewTypeConfig = {
  [ReviewType.PREMORTEM]: {
    label: "사전 검토 (Premortem)",
    description: "프로젝트 시작 전 위험 요소와 개선점 분석",
    positiveLabel: "예상되는 장점",
    negativeLabel: "예상되는 위험", 
    changesLabel: "사전 준비사항"
  },
  [ReviewType.MIDMORTEM]: {
    label: "중간 검토 (Midmortem)",
    description: "프로젝트 진행 중 현황 점검과 조정",
    positiveLabel: "잘 되고 있는 점",
    negativeLabel: "문제점",
    changesLabel: "조정할 점"
  },
  [ReviewType.RETRO]: {
    label: "회고 (Retrospective)", 
    description: "프로젝트 완료 후 결과 분석과 학습",
    positiveLabel: "잘했던 점",
    negativeLabel: "아쉬웠던 점",
    changesLabel: "다음에 바꿀 점"
  }
};

export function EditReviewDialog({ 
  review,
  taskId,
  triggerText = "수정"
}: EditReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      review_type: review.review_type,
      positives: review.positives,
      negatives: review.negatives,
      changes_next: review.changes_next,
    },
  });

  const selectedType = form.watch("review_type");
  const config = selectedType ? reviewTypeConfig[selectedType] : null;

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewCreate }) =>
      updateReview(id, data),
    onSuccess: () => {
      toast.success("리뷰가 수정되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["reviews", taskId] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as any)?.response?.data?.detail) || "리뷰 수정에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error updating review:", error);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      toast.success("리뷰가 삭제되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["reviews", taskId] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as any)?.response?.data?.detail) || "리뷰 삭제에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error deleting review:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    const updateData: ReviewCreate = {
      task_id: taskId,
      review_type: values.review_type,
      positives: values.positives,
      negatives: values.negatives,
      changes_next: values.changes_next,
    };
    updateReviewMutation.mutate({ id: review.id, data: updateData });
  };

  const handleDelete = () => {
    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) {
      deleteReviewMutation.mutate(review.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>리뷰 수정</DialogTitle>
          <DialogDescription>
            리뷰 내용을 수정하거나 삭제할 수 있습니다.
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
            
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteReviewMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteReviewMutation.isPending ? "삭제 중..." : "삭제"}
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateReviewMutation.isPending}
                >
                  {updateReviewMutation.isPending ? "수정 중..." : "수정"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}