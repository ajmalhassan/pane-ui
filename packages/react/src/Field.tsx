"use client";
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

type FieldState = {
  controlId: string;
  descriptionId?: string;
  errorId?: string;
  invalid: boolean;
  required?: boolean;
  disabled?: boolean;
};
const FieldContext = createContext<FieldState | null>(null);
export interface FieldProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  /** Identifies the single native control inside this field. */
  controlId?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}
export type LabelProps = ComponentPropsWithoutRef<"label">;
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className = "", ...props },
  ref,
) {
  return <label {...props} ref={ref} className={`wp-label ${className}`} />;
});
export type FieldDescriptionProps = ComponentPropsWithoutRef<"p">;
export const FieldDescription = forwardRef<
  HTMLParagraphElement,
  FieldDescriptionProps
>(function FieldDescription({ className = "", ...props }, ref) {
  return (
    <p {...props} ref={ref} className={`wp-field-description ${className}`} />
  );
});
export type FieldErrorProps = ComponentPropsWithoutRef<"p">;
export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(
  function FieldError({ className = "", ...props }, ref) {
    return <p {...props} ref={ref} className={`wp-field-error ${className}`} />;
  },
);
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    label,
    description,
    error,
    controlId,
    required,
    disabled,
    children,
    className = "",
    ...props
  },
  ref,
) {
  const generated = useId();
  const id = controlId ?? `${generated}-control`;
  const hasDescription =
    description !== undefined &&
    description !== null &&
    description !== false &&
    description !== "";
  const invalid =
    error !== undefined && error !== null && error !== false && error !== "";
  const descriptionId = hasDescription ? `${id}-description` : undefined;
  const errorId = invalid ? `${id}-error` : undefined;
  return (
    <FieldContext.Provider
      value={{
        controlId: id,
        descriptionId,
        errorId,
        invalid,
        required,
        disabled,
      }}
    >
      <div
        {...props}
        ref={ref}
        className={`wp-field ${className}`}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <Label htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Label>
        {children}
        {hasDescription && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )}
        {invalid && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    </FieldContext.Provider>
  );
});
function useFieldAttributes(props: {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: ComponentPropsWithoutRef<"input">["aria-invalid"];
}) {
  const field = useContext(FieldContext);
  const describedBy = [
    props["aria-describedby"],
    field?.descriptionId,
    field?.errorId,
  ]
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);
  return {
    id: field?.controlId ?? props.id,
    required: field?.required ?? props.required,
    disabled: field?.disabled || props.disabled,
    "aria-invalid": field?.invalid ? (true as const) : props["aria-invalid"],
    "aria-describedby": describedBy.length
      ? [...new Set(describedBy)].join(" ")
      : undefined,
  };
}
export interface TextFieldProps
  extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number";
}
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ className = "", type = "text", ...props }, ref) {
    const field = useFieldAttributes(props);
    return (
      <input
        {...props}
        {...field}
        type={type}
        ref={ref}
        className={`wp-text-field ${className}`}
      />
    );
  },
);
export type TextAreaProps = ComponentPropsWithoutRef<"textarea">;
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ className = "", rows = 4, ...props }, ref) {
    const field = useFieldAttributes(props);
    return (
      <textarea
        {...props}
        {...field}
        rows={rows}
        ref={ref}
        className={`wp-text-field wp-text-area ${className}`}
      />
    );
  },
);

export type SelectProps = ComponentPropsWithoutRef<"select">;
/** Native options and optgroups; the browser owns the picker and keyboard model. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className = "", ...props }, ref) {
    const field = useFieldAttributes(props);
    return (
      <select
        {...props}
        {...field}
        ref={ref}
        className={`wp-text-field wp-select ${className}`}
      />
    );
  },
);
export type SliderProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "children" | "checked" | "defaultChecked"
>;
/** Native range input; bounds, steps, dragging and reset stay with the browser. */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className = "", ...props },
  ref,
) {
  const field = useFieldAttributes(props);
  return (
    <input
      {...props}
      {...field}
      type="range"
      ref={ref}
      className={`wp-slider ${className}`}
    />
  );
});
