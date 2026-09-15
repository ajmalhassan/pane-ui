# Example applications

The project gallery renders `shared/SettingsExample.tsx` and `shared/InboxExample.tsx`. Both are client components with no required props. Import `@windows-phone/react/styles.css` once in the host application before rendering them. Their extra layout styles are CSS modules.

The examples use public package exports only. State and original sample data belong to the applications, not the component package. Settings demonstrate a controlled form, native constraint validation with associated errors, theme preview, save and reset. Inbox demonstrates search, local read state, details, focus movement, a native dialog and validated local message composition.

Run the same sources without Next.js using the [Vite starter](./vite/README.md). Copy all four files in `shared/` together when adapting an example. Both applications intentionally use session-only state and clearly identify actions that do not contact a server.
