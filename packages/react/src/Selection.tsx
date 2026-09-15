"use client";
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { FieldDescription, FieldError } from "./Field.js";
const present = (value: ReactNode) =>
  value !== undefined && value !== null && value !== false && value !== "";
const descriptions = (...values: (string | undefined)[]) =>
  [
    ...new Set(values.filter(Boolean).join(" ").split(/\s+/).filter(Boolean)),
  ].join(" ") || undefined;
export interface CheckboxProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "type" | "children" | "size"
  > {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
}
export type SwitchProps = CheckboxProps;
const SelectionControl = forwardRef<
  HTMLInputElement,
  CheckboxProps & { kind: "checkbox" | "switch" }
>(function SelectionControl(
  { kind, label, description, error, id, className = "", ...props },
  ref,
) {
  const generated = useId();
  const controlId = id ?? `${generated}-selection`;
  const descriptionId = present(description)
    ? `${controlId}-description`
    : undefined;
  const errorId = present(error) ? `${controlId}-error` : undefined;
  return (
    <div className="wp-selection" hidden={props.hidden}>
      <label className="wp-selection-label" htmlFor={controlId}>
        <span className={`wp-selection-control wp-selection-${kind}`}>
          <input
            {...props}
            ref={ref}
            id={controlId}
            type="checkbox"
            role={kind === "switch" ? "switch" : props.role}
            className={`wp-selection-input ${className}`}
            aria-invalid={errorId ? true : props["aria-invalid"]}
            aria-describedby={descriptions(
              props["aria-describedby"],
              descriptionId,
              errorId,
            )}
          />
          <span className="wp-selection-visual" aria-hidden="true">
            {kind === "checkbox" && (
              <svg
                className="wp-checkbox-mark"
                viewBox="0 0 24 24"
                focusable="false"
              >
                <path d="M6 12 10 16 18 8" />
              </svg>
            )}
          </span>
        </span>
        <span>
          {label}
          {props.required && <span aria-hidden="true"> *</span>}
        </span>
      </label>
      {descriptionId && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
});
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(props, ref) {
    return <SelectionControl {...props} kind="checkbox" ref={ref} />;
  },
);
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  function Switch(props, ref) {
    return <SelectionControl {...props} kind="switch" ref={ref} />;
  },
);
export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}
export interface RadioGroupProps
  extends Omit<
    ComponentPropsWithoutRef<"fieldset">,
    "children" | "name" | "defaultValue"
  > {
  label: ReactNode;
  name: string;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
}
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  function RadioGroup(
    {
      label,
      name,
      options,
      value,
      defaultValue,
      onValueChange,
      description,
      error,
      required,
      className = "",
      onChange,
      ...props
    },
    ref,
  ) {
    const id = useId();
    const descriptionId = present(description)
      ? `${id}-description`
      : undefined;
    const errorId = present(error) ? `${id}-error` : undefined;
    return (
      <fieldset
        {...props}
        ref={ref}
        className={`wp-radio-group ${className}`}
        aria-describedby={descriptions(
          props["aria-describedby"],
          descriptionId,
          errorId,
        )}
        aria-invalid={errorId ? true : props["aria-invalid"]}
        onChange={(event) => {
          onChange?.(event);
          if (event.defaultPrevented) return;
          const target: EventTarget = event.target;
          if (
            target instanceof HTMLInputElement &&
            target.type === "radio" &&
            target.name === name &&
            target.checked
          )
            onValueChange?.(target.value);
        }}
      >
        <legend className="wp-label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </legend>
        {descriptionId && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )}
        <div className="wp-radio-options">
          {options.map((option, index) => {
            const optionId = `${id}-option-${index}`;
            const hintId = present(option.description)
              ? `${optionId}-description`
              : undefined;
            return (
              <div key={option.value} className="wp-selection">
                <label htmlFor={optionId} className="wp-selection-label">
                  <span className="wp-selection-control wp-selection-radio">
                    <input
                      id={optionId}
                      type="radio"
                      name={name}
                      value={option.value}
                      form={props.form}
                      required={required}
                      disabled={props.disabled || option.disabled}
                      className="wp-selection-input"
                      checked={
                        value === undefined ? undefined : value === option.value
                      }
                      defaultChecked={
                        value === undefined
                          ? defaultValue === option.value
                          : undefined
                      }
                      onChange={() => {}}
                      aria-describedby={descriptions(hintId, errorId)}
                    />
                    <span className="wp-selection-visual" aria-hidden="true" />
                  </span>
                  <span>{option.label}</span>
                </label>
                {hintId && (
                  <FieldDescription id={hintId}>
                    {option.description}
                  </FieldDescription>
                )}
              </div>
            );
          })}
        </div>
        {errorId && <FieldError id={errorId}>{error}</FieldError>}
      </fieldset>
    );
  },
);
