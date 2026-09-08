import { profile } from "@/content/profile";
import styles from "./PortfolioPanorama.module.css";

type Props = {
  open?: boolean;
  onClose: () => void;
};

export function ContactPanel({ open = false, onClose }: Props) {
  return (
    <section
      aria-labelledby="contact-heading"
      className={styles.contact}
      data-open={open}
      id="contact"
    >
      <div>
        <p className={styles.eyebrow}>Start a conversation</p>
        <h2 id="contact-heading">Contact</h2>
        <p>
          For technical-leadership, product engineering, or thoughtful build
          work, find me on these existing profiles.
        </p>
        <div className={styles.contactLinks}>
          <a
            href={profile.links.linkedin.href}
            rel="noreferrer"
            target="_blank"
          >
            {profile.links.linkedin.label}
          </a>
          <a href={profile.links.github.href} rel="noreferrer" target="_blank">
            {profile.links.github.label}
          </a>
        </div>
      </div>
      {open ? (
        <button className={styles.closeContact} onClick={onClose} type="button">
          Close contact
        </button>
      ) : null}
    </section>
  );
}
