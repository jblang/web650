import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';
import './docs.scss';

export default function DocsPage() {
  const readmePath = path.join(process.cwd(), 'README.md');
  const content = fs.readFileSync(readmePath, 'utf-8');

  return (
    <div className="docs-container">
      <Markdown>{content}</Markdown>
    </div>
  );
}
