type Props = {
  label: string;
};

export function StatusBar({ label }: Props) {
  return (
    <div aria-hidden="true">
      <span>{label}</span>
      <span>12:00</span>
    </div>
  );
}
