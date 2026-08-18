import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/guidelines", label: "Community Guidelines" },
  { href: "/safety", label: "Safety Guidelines" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            UNSAID
          </Link>
        </div>
      </header>
      <div className="mx-auto flex max-w-3xl gap-8 px-4 py-8">
        <nav className="hidden w-48 shrink-0 flex-col gap-1 sm:flex">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
