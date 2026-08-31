'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * In-page section navigation. Highlights the section currently in view using an
 * IntersectionObserver, falling back to plain anchor links where the API is
 * unavailable.
 */
export function SectionNav({ sections, className, hideHeading = false }) {
  const [active, setActive] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // Top offset accounts for the sticky topbar.
      { rootMargin: '-88px 0px -60% 0px', threshold: [0, 0.25] }
    );

    for (const section of sections) {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className={cn('hide-scrollbar', className)} aria-label="Sections on this page">
      {!hideHeading ? (
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          On this page
        </p>
      ) : null}
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5 md:overflow-visible">
        {sections.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'block whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'bg-primary/15 text-primary font-bold border-l-2 border-primary pl-2'
                    : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                )}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default SectionNav;
