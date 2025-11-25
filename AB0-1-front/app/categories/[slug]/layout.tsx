'use client';

export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="category-slug-layout">
      {children}
    </div>
  );
}