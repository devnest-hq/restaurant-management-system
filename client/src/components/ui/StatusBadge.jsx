import "./ui.css";

const STATUS_STYLES = {
  PENDING: "warning",
  PREPARING: "info",
  READY: "success",
  SERVED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  OPEN: "success",
  CLOSED: "neutral",
  CONFIRMED: "success",
  SEATED: "info",
  RESERVED: "warning",
  AVAILABLE: "success",
  OCCUPIED: "danger",
  LOW_STOCK: "danger",
  IN_STOCK: "success",
  OUT_OF_STOCK: "danger",
  ACTIVE: "success",
  INACTIVE: "neutral",
};

function formatStatus(status) {
  return String(status ?? "UNKNOWN")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function StatusBadge({ status, variant, className = "" }) {
  const tone = variant || STATUS_STYLES[String(status).toUpperCase()] || "neutral";

  return (
    <span className={`dn-status-badge dn-status-badge--${tone} ${className}`.trim()}>
      <span className="dn-status-badge__dot" aria-hidden="true" />
      {formatStatus(status)}
    </span>
  );
}
