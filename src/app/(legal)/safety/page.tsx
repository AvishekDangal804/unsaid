export const metadata = { title: "Safety Guidelines" };

export default function SafetyPage() {
  return (
    <article className="space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-foreground">Safety Guidelines</h1>
        <p className="text-sm text-muted-foreground">
          Tools you have to stay safe, and what happens when you report something.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Your safety tools</h2>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-foreground">
          <li>Make your account private — only approved followers see your posts</li>
          <li>Control who can message you in Settings → Privacy</li>
          <li>Block anyone — they can&apos;t see your posts, comment on them, or message you</li>
          <li>Mute anyone — their posts stop showing in your feed, silently</li>
          <li>Report any post, comment, message, or account</li>
          <li>Post anonymously when you don&apos;t want your name attached</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">What happens when you report something</h2>
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-foreground">
          <li>Your report goes to our moderation queue — the reported user is never told who reported them</li>
          <li>A moderator reviews the content and the reason you gave</li>
          <li>They can dismiss it, hide or remove the content, or warn, suspend, restrict, or ban the account</li>
          <li>Every action is logged internally for accountability</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">If you&apos;re in immediate danger</h2>
        <p className="text-sm text-muted-foreground">
          UNSAID is not an emergency service. If you or someone else is in immediate danger,
          contact your local emergency services first.
        </p>
      </section>
    </article>
  );
}
