// ============================================================
// TrackerX Extension — Toast Notifications (content script)
// ============================================================

const TOAST_COLORS = {
  success: "rgba(0, 200, 83, 0.95)",
  error: "rgba(220, 50, 50, 0.95)",
  info: "rgba(60, 60, 60, 0.95)",
  warning: "rgba(200, 150, 0, 0.95)",
};

function showToast(text, type = "info", durationMs = 3000) {
  const existing = document.getElementById("trackerx-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "trackerx-toast";
  toast.textContent = text;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "10px 18px",
    borderRadius: "8px",
    background: TOAST_COLORS[type] || TOAST_COLORS.info,
    color: "#fff",
    fontSize: "13px",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "500",
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    transition: "opacity 0.3s",
    opacity: "1",
    maxWidth: "340px",
    lineHeight: "1.4",
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, durationMs);
}
