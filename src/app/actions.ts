'use server';

import { analyzeThreeJsArticle, type AnalyzeThreeJsArticleInput } from '@/ai/flows/tech-analyzer';
import { z } from 'zod';

const inputSchema = z.object({
  articleUrl: z.string().url({ message: "Please enter a valid URL." })
});

export async function runAnalysis(formData: FormData) {
  try {
    const rawInput = {
      articleUrl: formData.get('articleUrl'),
    };
    const validatedInput = inputSchema.safeParse(rawInput);

    if (!validatedInput.success) {
      return { success: false, error: 'Please enter a valid URL.' };
    }

    const result = await analyzeThreeJsArticle(validatedInput.data as AnalyzeThreeJsArticleInput);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An unexpected error occurred during analysis.' };
  }
}
