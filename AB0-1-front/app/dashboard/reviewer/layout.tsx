import type { ReactNode } from 'react';
export default function ReviewerLayout({ children }: { children: ReactNode }) { return <div data-reviewer-area="true">{children}</div>; }
