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
      <path d="M0 0h7v25H0zM10 0h15v11H10zM10 14h10v7H10z" />
    </svg>
  );
}
