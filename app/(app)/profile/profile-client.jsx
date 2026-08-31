'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Save,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Briefcase,
  Clock,
  Github,
  Linkedin,
  Globe,
  Twitter,
  Bookmark,
  Sparkles,
  Route,
  MessageSquare,
  Target,
  Mail,
  CalendarDays,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardEyebrow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Meter, RadialGauge } from '@/components/ui/progress';
import { InlineError } from '@/components/feedback/error-panel';
import { api } from '@/lib/fetcher';
import { cn, formatRelativeTime, scoreBand } from '@/lib/utils';

const STAGES = [
  { value: 'exploring', label: 'Exploring ideas' },
  { value: 'validating', label: 'Validating' },
  { value: 'building', label: 'Building' },
  { value: 'launched', label: 'Launched' },
  { value: 'scaling', label: 'Scaling' },
];

const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.value, s.label]));

const LINKS = [
  { key: 'websiteUrl', label: 'Website', icon: Globe, placeholder: 'yoursite.com' },
  { key: 'githubUrl', label: 'GitHub', icon: Github, placeholder: 'github.com/you' },
  { key: 'linkedinUrl', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/you' },
  { key: 'twitterUrl', label: 'X / Twitter', icon: Twitter, placeholder: 'x.com/you' },
];

/** Compact metric tile, matching the radar KPI language. */
function StatTile({ icon: Icon, label, value, hint, accent = 'primary', href }) {
  const accentClass = {
    primary: 'text-primary',
    emerald: 'text-emerald-signal',
    violet: 'text-violet-signal',
    amber: 'text-amber-signal',
    indigo: 'text-indigo-signal',
  }[accent];

  const inner = (
    <Card tone="glass" className="tile-rise h-full p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <Icon className={cn('h-3.5 w-3.5 shrink-0', accentClass)} aria-hidden="true" />
      </div>
      <p className={cn('mono mt-2.5 text-[26px] font-bold leading-none', accentClass)}>{value}</p>
      {hint ? (
        <p className="mt-1.5 text-[10px] leading-snug text-on-surface-variant/70">{hint}</p>
      ) : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function TagRow({ label, items, empty }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      {items?.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] text-on-surface-variant/60">{empty}</p>
      )}
    </div>
  );
}

export function ProfileClient({ bundle, sessionUser, isAdmin }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [profile, setProfile] = React.useState(bundle.profile);

  // Text inputs hold the raw comma string while editing; the API splits it.
  const [form, setForm] = React.useState(() => ({
    ...bundle.profile,
    skills: (bundle.profile.skills || []).join(', '),
    interests: (bundle.profile.interests || []).join(', '),
    verticals: (bundle.profile.verticals || []).join(', '),
  }));

  const stats = bundle.stats || {};
  const displayName = profile.displayName || sessionUser.name || 'Unnamed builder';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'F';
  const publicUrl = `/profile/${encodeURIComponent(bundle.userId)}`;

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function cancel() {
    setForm({
      ...profile,
      skills: (profile.skills || []).join(', '),
      interests: (profile.interests || []).join(', '),
      verticals: (profile.verticals || []).join(', '),
    });
    setError(null);
    setEditing(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);

    const response = await api.put('/api/profile', form);
    setSaving(false);

    if (!response.ok) {
      setError(response.error);
      toast.error('Profile not saved', { description: response.error?.message });
      return;
    }

    const saved = response.data.profile;
    setProfile(saved);
    setForm({
      ...saved,
      skills: (saved.skills || []).join(', '),
      interests: (saved.interests || []).join(', '),
      verticals: (saved.verticals || []).join(', '),
    });
    setEditing(false);
    toast.success('Profile saved');
    router.refresh();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy the link');
    }
  }

  return (
    <div className="space-y-5">
      {/* Identity ------------------------------------------------------- */}
      <Card tone="glass" className="accent-top relative overflow-hidden p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {sessionUser.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sessionUser.image}
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
              <h2 className="text-lg font-black leading-tight tracking-tight text-on-surface">
                {displayName}
              </h2>
              {isAdmin ? (
                <Badge variant="primary">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Admin
                </Badge>
              ) : null}
              <Badge variant={profile.visibility === 'public' ? 'emerald' : 'default'}>
                {profile.visibility === 'public' ? (
                  <Eye className="h-2.5 w-2.5" />
                ) : (
                  <EyeOff className="h-2.5 w-2.5" />
                )}
                {profile.visibility === 'public' ? 'Public profile' : 'Private profile'}
              </Badge>
            </div>

            {profile.headline ? (
              <p className="mt-1 text-xs font-semibold text-primary">{profile.headline}</p>
            ) : null}

            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-on-surface-variant">
              {sessionUser.email ? (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  <dd className="truncate">{sessionUser.email}</dd>
                </div>
              ) : null}
              {profile.roleTitle || profile.company ? (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" aria-hidden="true" />
                  <dd>
                    {[profile.roleTitle, profile.company].filter(Boolean).join(' at ')}
                  </dd>
                </div>
              ) : null}
              {profile.location ? (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  <dd>{profile.location}</dd>
                </div>
              ) : null}
              {bundle.identity.memberSince ? (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  <dd>Joined {formatRelativeTime(bundle.identity.memberSince)}</dd>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                <dd className="capitalize">Signed in with {sessionUser.provider}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!editing ? (
                <Button size="sm" onClick={() => setEditing(true)}>
                  <Pencil />
                  Edit profile
                </Button>
              ) : null}
              <Button asChild variant="secondary" size="sm">
                <Link href={publicUrl}>
                  <Eye />
                  View as others see it
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                {copied ? <Check /> : <Copy />}
                {copied ? 'Link copied' : 'Copy profile link'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity ------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Bookmark}
          label="Saved"
          value={stats.savedCount ?? 0}
          hint="Opportunities on your watchlist"
          accent="primary"
          href="/saved"
        />
        <StatTile
          icon={Sparkles}
          label="Ideas validated"
          value={stats.validationCount ?? 0}
          hint={
            stats.lastValidationAt
              ? `Last ${formatRelativeTime(stats.lastValidationAt)}`
              : 'None yet'
          }
          accent="violet"
          href="/idea-validator"
        />
        <StatTile
          icon={Route}
          label="Roadmaps"
          value={stats.roadmapCount ?? 0}
          hint={stats.lastRoadmapAt ? `Last ${formatRelativeTime(stats.lastRoadmapAt)}` : 'None yet'}
          accent="indigo"
          href="/roadmap"
        />
      </div>

      {(stats.demandScore ?? null) !== null || (stats.bestValidationScore ?? null) !== null ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {stats.demandScore !== null && stats.demandScore !== undefined ? (
            <Card tone="glass" className="p-4">
              <CardEyebrow icon={Target}>Your market demand score</CardEyebrow>
              <div className="mt-3 flex items-center gap-4">
                <RadialGauge
                  value={stats.demandScore}
                  color={scoreBand(stats.demandScore).hex}
                  size={68}
                  stroke={5}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface">
                    {stats.resumeRole || 'From your last resume scan'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-on-surface-variant">
                    Scanned {formatRelativeTime(stats.demandScoreAt)}
                  </p>
                  {stats.resumeSkills?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {stats.resumeSkills.slice(0, 6).map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          {stats.bestValidationScore !== null && stats.bestValidationScore !== undefined ? (
            <Card tone="glass" className="p-4">
              <CardEyebrow icon={Sparkles}>Your best-scoring idea</CardEyebrow>
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
                {stats.bestValidationIdea}
              </p>
              <div className="mt-3">
                <Meter
                  label="Validation score"
                  value={stats.bestValidationScore}
                  color={scoreBand(stats.bestValidationScore).hex}
                />
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Details: view or edit ------------------------------------------ */}
      {editing ? (
        <form onSubmit={submit}>
          <Card tone="glass" className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <CardEyebrow icon={Pencil}>Edit your details</CardEyebrow>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={cancel}>
                  <X />
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={saving}>
                  <Save />
                  Save changes
                </Button>
              </div>
            </div>

            {error ? <InlineError error={error} className="mb-4" /> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-name">Display name</Label>
                <Input
                  id="p-name"
                  value={form.displayName}
                  onChange={(event) => set('displayName', event.target.value)}
                  placeholder={sessionUser.name || 'How you want to be listed'}
                  maxLength={80}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="p-headline">Headline</Label>
                <Input
                  id="p-headline"
                  value={form.headline}
                  onChange={(event) => set('headline', event.target.value)}
                  placeholder="Backend engineer turning GST pain into an API"
                  maxLength={140}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="p-role">Current role</Label>
                <Input
                  id="p-role"
                  value={form.roleTitle}
                  onChange={(event) => set('roleTitle', event.target.value)}
                  placeholder="Senior Backend Engineer"
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="p-company">Company</Label>
                <Input
                  id="p-company"
                  value={form.company}
                  onChange={(event) => set('company', event.target.value)}
                  placeholder="Where you are now, or independent"
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="p-location">Location</Label>
                <Input
                  id="p-location"
                  value={form.location}
                  onChange={(event) => set('location', event.target.value)}
                  placeholder="Bengaluru, India"
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="p-stage">Where you are</Label>
                <Select
                  id="p-stage"
                  value={form.builderStage}
                  onChange={(event) => set('builderStage', event.target.value)}
                  className="mt-1.5"
                >
                  {STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="p-years">Years of experience</Label>
                <Input
                  id="p-years"
                  type="number"
                  min={0}
                  max={60}
                  value={form.experienceYears}
                  onChange={(event) => set('experienceYears', Number(event.target.value))}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="p-hours">Hours a week you can commit</Label>
                <Input
                  id="p-hours"
                  type="number"
                  min={0}
                  max={120}
                  value={form.weeklyHours}
                  onChange={(event) => set('weeklyHours', Number(event.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="p-bio">About you</Label>
              <Textarea
                id="p-bio"
                value={form.bio}
                onChange={(event) => set('bio', event.target.value)}
                placeholder="What you have built, what you are good at, and what you are trying to do next."
                rows={5}
                maxLength={1200}
                className="mt-1.5"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="p-skills">Skills</Label>
                <Input
                  id="p-skills"
                  value={form.skills}
                  onChange={(event) => set('skills', event.target.value)}
                  placeholder="Node, Postgres, UPI"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="p-interests">Interests</Label>
                <Input
                  id="p-interests"
                  value={form.interests}
                  onChange={(event) => set('interests', event.target.value)}
                  placeholder="Underwriting, ONDC"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="p-verticals">Verticals</Label>
                <Input
                  id="p-verticals"
                  value={form.verticals}
                  onChange={(event) => set('verticals', event.target.value)}
                  placeholder="BFSI, HealthTech"
                  className="mt-1.5"
                />
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-on-surface-variant/70">
              Comma separated. These sharpen your Builder Match and Roadmap results.
            </p>

            <div className="mt-4">
              <Label htmlFor="p-looking">What you are looking for</Label>
              <Input
                id="p-looking"
                value={form.lookingFor}
                onChange={(event) => set('lookingFor', event.target.value)}
                placeholder="A technical co-founder in BFSI, or design help for a pilot"
                maxLength={300}
                className="mt-1.5"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {LINKS.map((link) => (
                <div key={link.key}>
                  <Label htmlFor={`p-${link.key}`}>{link.label}</Label>
                  <Input
                    id={`p-${link.key}`}
                    value={form[link.key]}
                    onChange={(event) => set(link.key, event.target.value)}
                    placeholder={link.placeholder}
                    className="mt-1.5"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-border/60 pt-4">
              <Label htmlFor="p-visibility">Who can see this profile</Label>
              <Select
                id="p-visibility"
                value={form.visibility}
                onChange={(event) => set('visibility', event.target.value)}
                className="mt-1.5 max-w-xs"
              >
                <option value="public">Public — any signed-in member</option>
                <option value="private">Private — only you</option>
              </Select>
              <p className="mt-1.5 text-[10px] leading-relaxed text-on-surface-variant/70">
                Your display name and avatar always appear on posts you write, because a discussion
                needs an author. Everything else here is hidden when this is private.
              </p>
            </div>
          </Card>
        </form>
      ) : (
        <Card tone="glass" className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <CardEyebrow icon={Briefcase}>Your details</CardEyebrow>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil />
              Edit
            </Button>
          </div>

          {profile.bio ? (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">
              {profile.bio}
            </p>
          ) : (
            <p className="text-[11px] text-on-surface-variant/60">
              No bio yet. Adding one makes your public profile and shared briefs far more credible.
            </p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface-low/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Stage
              </p>
              <p className="mt-1 text-xs font-bold text-on-surface">
                {STAGE_LABEL[profile.builderStage] || 'Exploring ideas'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-low/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Experience
              </p>
              <p className="mono mt-1 text-xs font-bold text-on-surface">
                {profile.experienceYears || 0} years
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-low/50 p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                Weekly capacity
              </p>
              <p className="mono mt-1 text-xs font-bold text-on-surface">
                {profile.weeklyHours || 0} hours
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <TagRow label="Skills" items={profile.skills} empty="No skills listed yet." />
            <TagRow label="Interests" items={profile.interests} empty="No interests listed yet." />
            <TagRow label="Verticals" items={profile.verticals} empty="No verticals listed yet." />
          </div>

          {profile.lookingFor ? (
            <div className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.07] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Looking for
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-on-surface">{profile.lookingFor}</p>
            </div>
          ) : null}

          {LINKS.some((link) => profile[link.key]) ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
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
        </Card>
      )}

      <Card tone="glass" className="dot-grid p-4">
        <CardEyebrow icon={MessageSquare}>Where this data is used</CardEyebrow>
        <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-on-surface-variant">
          <li>
            Your weekly hours and experience shape the pacing of every plan the{' '}
            <Link href="/roadmap" className="font-bold text-primary hover:underline">
              Suggested Roadmap
            </Link>{' '}
            generates.
          </li>
          <li>Your display name and headline are how other members see your public profile.</li>
          <li>Your email is never shown to other members, only to you on this page.</li>
        </ul>
      </Card>
    </div>
  );
}

export default ProfileClient;
