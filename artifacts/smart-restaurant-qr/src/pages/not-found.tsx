import { ArrowLeft, CircleAlert, Utensils } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div data-testid="state-not-found" className="shell-texture flex min-h-[100dvh] w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-secondary text-primary shadow-[4px_4px_0_hsl(var(--accent))]">
          <Utensils size={28} />
        </div>
        <p className="mt-8 font-mono-custom text-[10px] uppercase tracking-[.22em] text-accent">Wrong turn</p>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">That page isn't on the menu.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Let's get you back to the room. The good stuff is still being served.</p>
        <Link href="/" data-testid="link-not-found-home" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"><ArrowLeft size={15} /> Back to the menu</Link>
        <CircleAlert className="mx-auto mt-12 text-muted-foreground/40" size={18} />
      </div>
    </div>
  );
}
