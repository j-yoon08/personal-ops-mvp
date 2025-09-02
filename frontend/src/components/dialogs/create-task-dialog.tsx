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
import { useProjects } from "@/hooks/use-projects";
import { toast } from "sonner";

const formSchema = z.object({
  project_id: z.string().min(1, "프로젝트를 선택해주세요"),
  title: z.string().min(1, "작업 제목을 입력해주세요"),
  priority: z.string().min(1, "우선순위를 선택해주세요"),
  due_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  // 프로젝트가 없으면 비활성화
  const hasProjects = projects && projects.length > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: "",
      title: "",
      priority: "3",
      due_date: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const taskData = {
        project_id: parseInt(values.project_id),
        title: values.title,
        priority: parseInt(values.priority),
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
        <Button 
          variant="outline" 
          disabled={!hasProjects}
          title={!hasProjects ? "먼저 프로젝트를 생성해주세요" : ""}
        >
          <Plus className="mr-2 h-4 w-4" />
          새 작업
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 작업 생성</DialogTitle>
          <DialogDescription>
            {hasProjects 
              ? "새로운 작업을 생성합니다. 프로젝트와 작업 제목은 필수입니다." 
              : "작업을 생성하려면 먼저 프로젝트를 생성해주세요."
            }
          </DialogDescription>
        </DialogHeader>
        
        {!hasProjects ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              {projectsLoading ? "프로젝트를 불러오는 중..." : "생성된 프로젝트가 없습니다."}
            </p>
            <Button onClick={() => setOpen(false)}>
              확인
            </Button>
          </div>
        ) : (
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="프로젝트를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id!.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>작업 제목 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 데이터베이스 설계" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>우선순위 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="우선순위 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 - 최고</SelectItem>
                      <SelectItem value="2">2 - 높음</SelectItem>
                      <SelectItem value="3">3 - 보통</SelectItem>
                      <SelectItem value="4">4 - 낮음</SelectItem>
                      <SelectItem value="5">5 - 최하</SelectItem>
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
        )}
      </DialogContent>
    </Dialog>
  );
}