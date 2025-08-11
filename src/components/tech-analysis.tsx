"use client";

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { runAnalysis } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { type AnalyzeThreeJsArticleOutput } from '@/ai/flows/tech-analyzer';

const FormSchema = z.object({
  articleUrl: z.string().url({ message: "Please enter a valid URL." }),
});

export function TechAnalysis() {
  const [isPending, startTransition] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeThreeJsArticleOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      articleUrl: "https://blog.csdn.net/u010657801/article/details/129754337",
    },
  });

  const handleAnalysis = (data: z.infer<typeof FormSchema>) => {
    const formData = new FormData();
    formData.append('articleUrl', data.articleUrl);

    startTransition(async () => {
      setError(null);
      setAnalysisResult(null);
      const result = await runAnalysis(formData);
      if (result.success) {
        setAnalysisResult(result.data);
      } else {
        setError(typeof result.error === 'string' ? result.error : 'Failed to analyze the article. Please check the URL and try again.');
      }
    });
  }

  useEffect(() => {
    handleAnalysis(form.getValues());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technology Analysis</CardTitle>
        <CardDescription>
          Using GenAI to analyze the technologies used in the provided article.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAnalysis)} className="space-y-4">
            <FormField
              control={form.control}
              name="articleUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/article" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Technologies
            </Button>
          </form>
        </Form>
        {isPending && (
          <div className="mt-4 flex items-center justify-center rounded-md border p-6">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
            <p>Analyzing... this may take a moment.</p>
          </div>
        )}
        {error && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                <h3 className="font-semibold">Analysis Failed</h3>
                <p>{error}</p>
            </div>
        )}
        {analysisResult && (
          <div className="mt-6 space-y-4 whitespace-pre-wrap rounded-md border bg-secondary/30 p-4">
            <h3 className="text-lg font-semibold text-primary font-headline">Analysis Complete</h3>
            <p className="font-mono text-sm">{analysisResult.technologies}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
