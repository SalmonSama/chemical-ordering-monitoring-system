export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <span
      className="animate-spin rounded-full border-2 inline-block"
      style={{
        width: size,
        height: size,
        borderColor: "var(--color-border)",
        borderTopColor: "var(--color-brand-500)",
      }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size={32} />
    </div>
  );
}
