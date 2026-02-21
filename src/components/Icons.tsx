type IconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

const size = 20;

/** Pencil icon for edit actions. Use with visible text and aria-hidden="true". */
export function IconEdit({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M11.5 4.5l4 4-9 9H2.5v-4l9-9z" />
      <path d="M15.5 4.5l-2-2" />
    </svg>
  );
}

/** Trash icon for delete actions. Use with visible text and aria-hidden="true". */
export function IconDelete({ className, "aria-hidden": ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M4 5h12v11H4V5z" />
      <path d="M8 5V3h4v2" />
      <path d="M2 5h16" />
      <path d="M8 9v4" />
      <path d="M12 9v4" />
    </svg>
  );
}
