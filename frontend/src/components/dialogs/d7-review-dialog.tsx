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
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDecisionD7Review } from "@/services/decisions";
import { toast } from "sonner";
import { DecisionLogReviewUpdate } from "@/types/decision";
import { addDays, format, parseISO } from "date-fns";

const formSchema = z.object({
  d_plus_7_review: z.string().min(1, "D+7 리뷰를 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface D7ReviewDialogProps {
  decisionId: number;
  taskId: number;
  decisionDate: string;
  existingReview?: string;
  triggerText?: string;
}

export function D7ReviewDialog({ 
  decisionId,
  taskId,
  decisionDate,
  existingReview,
  triggerText = "D+7 리뷰"
}: D7ReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const reviewDate = format(addDays(parseISO(decisionDate), 7), 'yyyy-MM-dd');
  const isReviewTime = new Date() >= addDays(parseISO(decisionDate), 7);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      d_plus_7_review: existingReview || "",
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DecisionLogReviewUpdate }) =>
      updateDecisionD7Review(id, data),
    onSuccess: () => {
      toast.success("D+7 리뷰가 저장되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["decisions", taskId] });
      queryClient.invalidateQueries({ queryKey: ["all-decisions"] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as any)?.response?.data?.detail) || "리뷰 저장에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error updating D+7 review:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    updateReviewMutation.mutate({ 
      id: decisionId, 
      data: { d_plus_7_review: values.d_plus_7_review }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={existingReview ? "secondary" : "outline"} 
          size="sm"
          className={!isReviewTime ? "opacity-50" : ""}
        >
          <Clock className="mr-2 h-4 w-4" />
          {existingReview ? "리뷰 수정" : triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>D+7 리뷰 {existingReview ? "수정" : "작성"}</DialogTitle>
          <DialogDescription>
            결정일로부터 7일 후({reviewDate})에 실시하는 회고입니다. 
            {!isReviewTime && " 아직 리뷰 시점이 아니지만 미리 작성할 수 있습니다."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="d_plus_7_review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>D+7 리뷰 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="7일이 지난 시점에서 이 결정을 어떻게 평가하나요?&#10;&#10;- 결정이 올바랗았나요?&#10;- 예상했던 결과가 나왔나요?&#10;- 가정사항과 리스크는 어떻게 되었나요?&#10;- 다시 결정한다면 어떻게 하시겠나요?"
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                disabled={updateReviewMutation.isPending}
              >
                {updateReviewMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}