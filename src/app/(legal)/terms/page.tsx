import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="prose-sm max-w-none">
      <h1 className="mb-1 text-xl font-semibold text-foreground">Terms of Service</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        This is a placeholder draft, not a legally reviewed document. Have a lawyer review this
        before launching UNSAID publicly.
      </p>

      <div className="space-y-5 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-1 font-semibold">1. Who can use UNSAID</h2>
          <p>
            You must be at least 13 years old to create an account. By signing up, you confirm
            the information you provide is accurate.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">2. Your content</h2>
          <p>
            You own what you post. By posting on UNSAID, you give us permission to store, display,
            and distribute that content within the app so other users can see it — including when
            you post anonymously, in which case we still know it&apos;s you internally for safety
            and moderation purposes, but we don&apos;t show that identity to other users.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">3. Acceptable use</h2>
          <p>
            Don&apos;t use UNSAID to harass, threaten, impersonate, or share someone else&apos;s
            private information without consent. See our{" "}
            <Link href="/guidelines" className="text-primary hover:underline">
              Community Guidelines
            </Link>{" "}
            for the full list.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">4. Moderation</h2>
          <p>
            We may remove content, restrict, suspend, or ban accounts that violate these terms or
            our guidelines. See how reports are handled in our{" "}
            <Link href="/safety" className="text-primary hover:underline">
              Safety Guidelines
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">5. Account termination</h2>
          <p>
            You can delete your account at any time from Settings. We may suspend or terminate
            accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">6. Changes</h2>
          <p>We may update these terms as UNSAID evolves. We&apos;ll let you know of significant changes.</p>
        </section>
      </div>
    </article>
  );
}
