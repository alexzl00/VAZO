/**
 * Art. 46 sickness-benefit base ceiling after the end of insurance.
 * Based on published GUS average remuneration announcements; effective in
 * blocks Jan–Feb, Mar–May, Jun–Aug, Sep–Nov and Dec of each year.
 * December 2026 requires the 2026 Q3 GUS announcement, which was not yet
 * published as of the preparation date. Missing periods MUST fail closed.
 *
 * Official period table:
 * https://www.gov.pl/web/pfron/przecietne-wynagrodzenie
 */
const CAPS = Object.freeze({
  '2025-01': 8_161.62, '2025-02': 8_161.62,
  '2025-03': 8_477.21, '2025-04': 8_477.21, '2025-05': 8_477.21,
  '2025-06': 8_962.28, '2025-07': 8_962.28, '2025-08': 8_962.28,
  '2025-09': 8_748.63, '2025-10': 8_748.63, '2025-11': 8_748.63,
  '2025-12': 8_771.70,
  '2026-01': 8_771.70, '2026-02': 8_771.70,
  '2026-03': 9_197.79, '2026-04': 9_197.79, '2026-05': 9_197.79,
  '2026-06': 9_562.88, '2026-07': 9_562.88, '2026-08': 9_562.88,
  '2026-09': 9_233.13, '2026-10': 9_233.13, '2026-11': 9_233.13,
});

export const getPostTerminationBenefitCap = (
  year: number,
  month: number,
): number | null => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  const key = `${year}-${String(month).padStart(2, '0')}` as keyof typeof CAPS;
  return CAPS[key] ?? null;
};
