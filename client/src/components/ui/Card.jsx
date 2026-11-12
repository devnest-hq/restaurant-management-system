import "./ui.css";

export default function Card({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "",
  ...props
}) {
  return (
    <section className={`dn-card ${className}`.trim()} {...props}>
      {(title || description || action) && (
        <header className="dn-card__header">
          <div>
            {title && <h2 className="dn-card__title">{title}</h2>}
            {description && <p className="dn-card__description">{description}</p>}
          </div>
          {action && <div className="dn-card__action">{action}</div>}
        </header>
      )}
      <div className={`dn-card__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}
