// This file uses server-side code.
'use server';

/**
 * @fileOverview Analyzes a technical article about ThreeJS pathfinding.
 *
 * - analyzeThreeJsArticle - A function that analyzes a given article URL and extracts the key ThreeJS technologies used.
 * - AnalyzeThreeJsArticleInput - The input type for the analyzeThreeJsArticle function.
 * - AnalyzeThreeJsArticleOutput - The return type for the analyzeThreeJsArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeThreeJsArticleInputSchema = z.object({
  articleUrl: z.string().describe('URL of the technical article to analyze.'),
});
export type AnalyzeThreeJsArticleInput = z.infer<typeof AnalyzeThreeJsArticleInputSchema>;

const AnalyzeThreeJsArticleOutputSchema = z.object({
  technologies: z
    .string()
    .describe(
      'A list of technologies and techniques used in the article for implementing path-following animation with ThreeJS.'
    ),
});
export type AnalyzeThreeJsArticleOutput = z.infer<typeof AnalyzeThreeJsArticleOutputSchema>;

export async function analyzeThreeJsArticle(input: AnalyzeThreeJsArticleInput): Promise<AnalyzeThreeJsArticleOutput> {
  return analyzeThreeJsArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeThreeJsArticlePrompt',
  input: {schema: AnalyzeThreeJsArticleInputSchema},
  output: {schema: AnalyzeThreeJsArticleOutputSchema},
  prompt: `You are an expert in ThreeJS and analyzing web development articles.

  Analyze the article at the following URL: {{{articleUrl}}}.

  Extract the key technologies and techniques used to implement a path-following animation with ThreeJS.  Provide a summary of the technologies.
  The technologies should be specific such as "Catmull-Rom Splines", "THREE.TubeGeometry", and "AnimationMixer".
  Focus on ThreeJS related technologies.
  Include a list of any relevant ThreeJS classes that are used.
  Do not respond as a chatbot, just provide the requested information and nothing else.
  `,
});

const analyzeThreeJsArticleFlow = ai.defineFlow(
  {
    name: 'analyzeThreeJsArticleFlow',
    inputSchema: AnalyzeThreeJsArticleInputSchema,
    outputSchema: AnalyzeThreeJsArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

