import { TechAnalysis } from '@/components/tech-analysis';
import { PathfinderDemo } from '@/components/pathfinder-demo';

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            ThreeJS Pathfinder
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            AI-powered analysis and interactive demo of path-following animations.
          </p>
        </header>
        
        <TechAnalysis />
        <PathfinderDemo />

        <footer className="text-center text-sm text-muted-foreground pt-8">
          <p>Built with Next.js, Three.js, and GenAI.</p>
        </footer>
      </div>
    </main>
  );
}
