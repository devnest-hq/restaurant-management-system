import "./ui.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const classes = [
    "dn-button",
    `dn-button--${variant}`,
    `dn-button--${size}`,
    loading ? "dn-button--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && <span className="dn-button__spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
