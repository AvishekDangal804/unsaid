export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="prose-sm max-w-none">
      <h1 className="mb-1 text-xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        This is a placeholder draft, not a legally reviewed document. Have a lawyer review this
        before launching UNSAID publicly.
      </p>

      <div className="space-y-5 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-1 font-semibold">What we collect</h2>
          <p>
            Your email, username, and password to create an account. Your date of birth, kept
            private and never shown on your profile — used only to verify you meet our minimum
            age. Anything you choose to add: bio, profile photo, country, school/college.
            Content you post, including anonymous posts (we keep an internal record of who
            posted what, even anonymously, for safety and moderation — this is never shown
            publicly).
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">What we don&apos;t do</h2>
          <p>
            We don&apos;t sell your data. We don&apos;t publicly display your date of birth,
            exact location, or any information tied to an anonymous post.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Who can see what</h2>
          <p>
            Your public profile (username, bio, avatar) is visible to everyone unless your
            account is private. Anonymous posts and comments never show your identity to other
            users. Direct messages are only visible to you and the other participant.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Your controls</h2>
          <p>
            You can make your account private, control who can message you, block or mute
            anyone, and delete your account and its data at any time from Settings.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Data retention</h2>
          <p>
            When you delete your account, we remove your personal data according to our data
            retention practices. Some records may be retained where required for safety,
            legal, or moderation purposes.
          </p>
        </section>
      </div>
    </article>
  );
}
