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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDecision } from "@/services/decisions";
import { toast } from "sonner";
import { DecisionLogCreate } from "@/types/decision";
import { format } from "date-fns";

const formSchema = z.object({
  date: z.string().min(1, "날짜를 선택해주세요"),
  problem: z.string().min(1, "문제 상황을 입력해주세요"),
  options: z.string().min(1, "검토한 옵션들을 입력해주세요"),
  decision_reason: z.string().min(1, "결정 이유를 입력해주세요"),
  assumptions_risks: z.string().min(1, "가정사항과 리스크를 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateDecisionDialogProps {
  taskId: number;
  triggerText?: string;
}

export function CreateDecisionDialog({ 
  taskId, 
  triggerText = "의사결정 추가"
}: CreateDecisionDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      problem: "",
      options: "",
      decision_reason: "",
      assumptions_risks: "",
    },
  });

  const createDecisionMutation = useMutation({
    mutationFn: createDecision,
    onSuccess: (result) => {
      if (result === null) {
        toast.error("의사결정 생성에 실패했습니다.");
        return;
      }
      
      toast.success("의사결정이 생성되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["decisions", taskId] });
      queryClient.invalidateQueries({ queryKey: ["all-decisions"] });
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        problem: "",
        options: "",
        decision_reason: "",
        assumptions_risks: "",
      });
      setOpen(false);
    },
    onError: (error: unknown) => {
      toast.error("의사결정 생성 중 오류가 발생했습니다.");
      console.error("Error creating decision:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    const decisionData: DecisionLogCreate = {
      task_id: taskId,
      date: values.date,
      problem: values.problem,
      options: values.options,
      decision_reason: values.decision_reason,
      assumptions_risks: values.assumptions_risks,
    };
    createDecisionMutation.mutate(decisionData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>의사결정 로그 추가</DialogTitle>
          <DialogDescription>
            중요한 의사결정 과정과 결과를 기록합니다. 7일 후 리뷰를 위해 상세히 작성해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>결정 날짜 *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="problem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>문제 상황 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="어떤 문제나 상황에 대해 결정이 필요했나요?"
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
              name="options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>검토한 옵션들 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="어떤 선택지들을 고려했나요? 각각의 장단점을 포함해서 설명해주세요."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="decision_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>결정 이유 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="왜 이 선택을 했나요? 결정의 근거와 이유를 설명해주세요."
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
              name="assumptions_risks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>가정사항 & 리스크 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="이 결정에 포함된 가정사항들과 예상되는 리스크는 무엇인가요?"
                      className="min-h-[80px]"
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
                disabled={createDecisionMutation.isPending}
              >
                {createDecisionMutation.isPending ? "추가 중..." : "추가"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}