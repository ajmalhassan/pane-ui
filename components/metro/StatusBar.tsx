import styles from "./StatusBar.module.css";

type Props = {
  label: string;
};

/**
 * The identity line every surface opens with. It is decoration in the phone's
 * own idiom rather than content -- the page's own heading names the page -- so
 * it stays out of the accessibility tree.
 */
export function StatusBar({ label }: Props) {
  return (
    <div aria-hidden="true" className={styles.statusBar}>
      <span>{label}</span>
      <span>12:00</span>
    </div>
  );
}
