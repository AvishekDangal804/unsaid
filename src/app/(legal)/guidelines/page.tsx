export const metadata = { title: "Community Guidelines" };

const RULES = [
  { title: "No harassment or bullying", body: "Don't target, pile on, or repeatedly attack someone." },
  { title: "No doxxing", body: "Never share someone's real name, address, school, or contact info without consent — even in anonymous posts." },
  { title: "No threats", body: "Threats of violence or harm aren't tolerated, even as jokes." },
  { title: "No impersonation", body: "Don't pretend to be someone else, including public figures or other users." },
  { title: "No spam", body: "Don't flood the platform with repetitive or promotional content." },
  { title: "No sexual content involving minors", body: "Zero tolerance — accounts are banned and reported immediately." },
  { title: "No dangerous content", body: "Don't encourage self-harm, illegal activity, or dangerous behavior." },
];

export default function GuidelinesPage() {
  return (
    <article>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Community Guidelines</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        UNSAID is a space to be honest about how you feel — that only works if everyone feels
        safe. Here&apos;s what we expect.
      </p>

      <div className="flex flex-col gap-3">
        {RULES.map((rule) => (
          <div key={rule.title} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">{rule.title}</h2>
            <p className="text-sm text-muted-foreground">{rule.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        See something that breaks these rules? Use the Report option on any post, comment, or
        profile. Our moderation team reviews every report.
      </p>
    </article>
  );
}
