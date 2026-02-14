'use client';

import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import './docs.scss';

function resolvePublicAssetUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) {
    return rawUrl;
  }

  if (
    rawUrl.startsWith('#') ||
    rawUrl.startsWith('mailto:') ||
    rawUrl.startsWith('data:') ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl)
  ) {
    return rawUrl;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const normalizedPath = rawUrl.replace(/^\.\//, '');

  if (normalizedPath.startsWith('/')) {
    return `${basePath}${normalizedPath}`;
  }

  return `${basePath}/${normalizedPath}`;
}

export default function DocsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    const aboutUrl = `${basePath}/about.md`;
    fetch(aboutUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load documentation: ${res.status} ${res.statusText}`);
        }
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load documentation';
        setError(message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="docs-content"><p>Loading documentation...</p></div>;
  }

  if (error) {
    return (
      <div className="docs-content">
        <p style={{ color: 'var(--cds-support-error, #da1e28)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="docs-content">
      <Markdown
        components={{
          img: ({ src, alt }) => {
            const resolvedSrc = typeof src === 'string' ? resolvePublicAssetUrl(src) : undefined;
            return (
              // Markdown from /public/about.md uses repo-relative image paths.
              // In the docs route, these must be remapped to the static public root.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolvedSrc} alt={alt ?? ''} />
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
