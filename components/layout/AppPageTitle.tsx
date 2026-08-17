import type { ReactNode } from 'react';

interface AppPageTitleProps {
  index: string;
  title: string;
  description?: ReactNode;
  className?: string;
}

export default function AppPageTitle({
  index,
  title,
  description,
  className = '',
}: AppPageTitleProps) {
  return (
    <div className={`app-page-title-block ${className}`.trim()}>
      <span className="app-page-index" aria-hidden="true">
        {index}
      </span>
      <div className="min-w-0">
        <h1 className="app-page-title">{title}</h1>
        {description ? <p className="app-page-description">{description}</p> : null}
      </div>
    </div>
  );
}
