"use client";

type Props = {
  label: string;
  className?: string;
};

export function ConfirmDeleteButton({ label, className = "text-xs font-bold text-rose-600 hover:underline" }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(`Hapus ${label}? Tindakan tidak bisa dibatalkan.`)) {
          e.preventDefault();
        }
      }}
    >
      Hapus
    </button>
  );
}
