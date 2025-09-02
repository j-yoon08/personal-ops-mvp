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
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProject } from "@/hooks/use-projects";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "프로젝트 이름을 입력해주세요"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createProject.mutateAsync(values);
      toast.success("프로젝트가 생성되었습니다!");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("프로젝트 생성에 실패했습니다.");
      console.error("Error creating project:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 프로젝트
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 프로젝트 생성</DialogTitle>
          <DialogDescription>
            새로운 프로젝트를 생성합니다. 프로젝트 이름은 필수입니다.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 이름 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: Capstone v2" {...field} />
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
                    <Input placeholder="프로젝트 설명을 입력하세요" {...field} />
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
                disabled={createProject.isPending}
              >
                {createProject.isPending ? "생성 중..." : "생성"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}