const legacyUtcPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export function formatKoreanDateTime(value?: string | null) {
  if (!value || value === "-") return "-";

  const normalized = legacyUtcPattern.test(value)
    ? `${value.replace(" ", "T")}:00Z`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}
