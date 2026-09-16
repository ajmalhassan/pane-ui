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
      <path fillRule="evenodd" d="M3 0h20v17H9v8H3V0Zm6 6v5h8V6H9Z" />
    </svg>
  );
}
