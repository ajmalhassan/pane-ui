export function Mark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 0h11v11H0zM14 0h11v11H14zM0 14h11v11H0zM14 14h11v11H14z" />
    </svg>
  );
}
