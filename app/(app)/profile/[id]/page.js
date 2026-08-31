import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircle,
  MapPin,
  Briefcase,
  Clock,
  Globe,
  Github,
  Linkedin,
  Twitter,
  EyeOff,
  Sparkles,
  Route,
  Bookmark,
  CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';
import { getCurrentUser } from '@/lib/auth';
import { loadProfileBundle, STAGE_LABELS } from '@/lib/profile';
import { formatRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const bundle = await loadProfileBundle(decodeURIComponent(params.id)).catch(() => null);
  if (!bundle || !bundle.visible) return { title: 'Member profile' };
  const name = bundle.profile.displayName || bundle.identity.name || 'Member';
  return { title: `${name} — Profile`, description: bundle.profile.headline || undefined };
}

const LINKS = [
  { key: 'websiteUrl', label: 'Website', icon: Globe },
  { key: 'githubUrl', label: 'GitHub', icon: Github },
  { key: 'linkedinUrl', label: 'LinkedIn', icon: Linkedin },
  { key: 'twitterUrl', label: 'X / Twitter', icon: Twitter },
];

function Stat({ icon: Icon, label, value }) {
  return (
    <Card tone="glass" className="tile-hover p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      </div>
      <p className="mono mt-2.5 text-[26px] font-bold leading-none text-on-surface">{value}</p>
    </Card>
  );
}

export default async function PublicProfilePage({ params }) {
  const userId = decodeURIComponent(params.id);
  const viewer = await getCurrentUser();

  // Your own profile always opens in the editable view.
  if (viewer?.id === userId) redirect('/profile');

  const bundle = await loadProfileBundle(userId, { viewerId: viewer?.id || null });
  if (!bundle) notFound();

  const { profile, identity, stats } = bundle;
  const name = profile.displayName || identity.name || 'FounderSignal member';
  const initial = name.trim().charAt(0).toUpperCase() || 'F';

  if (!bundle.visible) {
    return (
      <>
        <PageHeader eyebrow="Member" title="Private profile" icon={UserCircle} />
        <EmptyState
          icon={EyeOff}
          title="This member keeps their profile private"
          description="Their details are hidden from other members."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/radar">Open the radar</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Member" title={name} icon={UserCircle} description={profile.headline || undefined} />

      <div className="space-y-5">
        <Card tone="glass" className="accent-top relative overflow-hidden p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {identity.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={identity.image}
                alt=""
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-border"
              />
            ) : (
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xl font-black text-primary ring-1 ring-primary/25"
                aria-hidden="true"
              >
                {initial}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-on-surface">{name}</h2>
                <Badge variant="primary">
                  {STAGE_LABELS[profile.builderStage] || 'Exploring ideas'}
                </Badge>
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-on-surface-variant">
                {profile.roleTitle || profile.company ? (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" aria-hidden="true" />
                    <dd>{[profile.roleTitle, profile.company].filter(Boolean).join(' at ')}</dd>
                  </div>
                ) : null}
                {profile.location ? (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <dd>{profile.location}</dd>
                  </div>
                ) : null}
                {profile.weeklyHours ? (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <dd>{profile.weeklyHours} hours a week</dd>
                  </div>
                ) : null}
                {identity.memberSince ? (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" aria-hidden="true" />
                    <dd>Joined {formatRelativeTime(identity.memberSince)}</dd>
                  </div>
                ) : null}
              </dl>

              {profile.bio ? (
                <p className="mt-3.5 whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">
                  {profile.bio}
                </p>
              ) : null}

              {LINKS.some((link) => profile[link.key]) ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {LINKS.filter((link) => profile[link.key]).map((link) => {
                    const LinkIcon = link.icon;
                    return (
                      <a
                        key={link.key}
                        href={profile[link.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-low/50 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <LinkIcon className="h-3 w-3" aria-hidden="true" />
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        {profile.lookingFor ? (
          <Card tone="glass" className="border-primary/25 p-4">
            <CardEyebrow icon={Sparkles}>Looking for</CardEyebrow>
            <p className="mt-2 text-xs leading-relaxed text-on-surface">{profile.lookingFor}</p>
          </Card>
        ) : null}

        {profile.skills?.length || profile.interests?.length || profile.verticals?.length ? (
          <Card tone="glass" className="p-4">
            <CardEyebrow icon={Briefcase}>Focus</CardEyebrow>
            <div className="mt-3 space-y-3">
              {[
                ['Skills', profile.skills],
                ['Interests', profile.interests],
                ['Verticals', profile.verticals],
              ]
                .filter(([, items]) => items?.length)
                .map(([label, items]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {label}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={Sparkles} label="Ideas validated" value={stats?.validationCount ?? 0} />
          <Stat icon={Route} label="Roadmaps" value={stats?.roadmapCount ?? 0} />
          <Stat icon={Bookmark} label="Saved briefs" value={stats?.savedCount ?? 0} />
        </div>

        <Card tone="glass" className="dot-grid flex flex-wrap items-center gap-3 p-4">
          <Bookmark className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-on-surface-variant">
            Watchlists, validations and resume analyses stay private to their owner. Only the profile
            details above are visible to other members.
          </p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/radar">Open the radar</Link>
          </Button>
        </Card>
      </div>
    </>
  );
}
