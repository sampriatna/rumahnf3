/** Kontainer halaman staf — lebar konsisten, aman di mobile. */
export function StaffPage({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`staff-page mx-auto w-full max-w-lg px-4 pb-24 pt-5 ${className}`}>
      {children}
    </main>
  );
}
