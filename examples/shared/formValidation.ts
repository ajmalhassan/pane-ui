/** Keep the browser's native validity rules; expose errors through Field. */
export function validateForm(form: HTMLFormElement): Record<string, string> {
  const errors: Record<string, string> = {};
  let first: HTMLInputElement | HTMLTextAreaElement | undefined;
  for (const element of Array.from(form.elements)) {
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
    )
      continue;
    if (!element.name || element.disabled) continue;
    if (
      !element.checkValidity() ||
      (element.required && !element.value.trim())
    ) {
      errors[element.name] = element.validity.typeMismatch
        ? "Enter a valid email address."
        : "Please complete this field.";
      first ??= element;
    }
  }
  first?.focus();
  return errors;
}
