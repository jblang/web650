'use client';

import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import './docs.scss';

export default function DocsPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/assets/about.md')
      .then((res) => res.text())
      .then(setContent);
  }, []);

  return (
    <div className="docs-container">
      <Markdown>{content}</Markdown>
    </div>
  );
}
