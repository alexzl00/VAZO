import type { ReactNode } from 'react';

export default function ArticleExample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="article-example" aria-label={title}>
      <h4>{title}</h4>
      {children}
    </aside>
  );
}
