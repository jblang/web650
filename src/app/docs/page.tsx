'use client';

import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import './docs.scss';

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
      <Markdown>{content}</Markdown>
    </div>
  );
}
