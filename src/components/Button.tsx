import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: React.ReactNode;
};

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const variantClass = variant === "primary" ? "btn--primary" : variant === "ghost" ? "btn--ghost" : "btn--secondary";
  return (
    <button type="button" className={`btn ${variantClass} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
