import { PathfinderDemo } from '@/components/pathfinder-demo';

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto">
        <header className="text-center p-4 sm:p-6 md:p-8 bg-background">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            ThreeJS Pathfinder
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            An interactive demo of path-following animations with a character.
          </p>
        </header>
        
        <PathfinderDemo />

        <footer className="text-center text-sm text-muted-foreground py-8">
          <p>Built with Next.js and Three.js.</p>
        </footer>
      </div>
    </main>
  );
}
