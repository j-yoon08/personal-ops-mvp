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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTask } from "@/hooks/use-tasks";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(1, "작업 제목을 입력해주세요"),
  description: z.string().optional(),
  priority: z.number().min(1).max(5),
  due_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProjectTaskDialogProps {
  projectId: number;
}

export function CreateProjectTaskDialog({ projectId }: CreateProjectTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 3,
      due_date: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const taskData = {
        project_id: projectId,
        title: values.title,
        priority: values.priority,
        due_date: values.due_date || undefined,
      };
      
      await createTask.mutateAsync(taskData);
      toast.success("작업이 생성되었습니다!");
      form.reset();
      setOpen(false);
    } catch (error: unknown) {
      const errorMessage = ((error as any)?.response?.data?.detail) || "작업 생성에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error creating task:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          새 작업 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 작업 생성</DialogTitle>
          <DialogDescription>
            이 프로젝트에 새로운 작업을 추가합니다.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>작업 제목 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 로그인 기능 구현" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="작업에 대한 상세 설명을 입력하세요"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>우선순위 *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="우선순위 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 (높음)</SelectItem>
                        <SelectItem value="2">2 (보통)</SelectItem>
                        <SelectItem value="3">3 (낮음)</SelectItem>
                        <SelectItem value="4">4 (매우 낮음)</SelectItem>
                        <SelectItem value="5">5 (언젠가)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>마감일 (선택)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                disabled={createTask.isPending}
              >
                {createTask.isPending ? "생성 중..." : "생성"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}