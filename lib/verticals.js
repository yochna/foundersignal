/**
 * Sector taxonomy. Standalone (no zod, no data layer) so client components can
 * import it without pulling server-only code into the browser bundle.
 */
export const VERTICALS = [
  'IT',
  'BFSI',
  'HealthTech',
  'EdTech',
  'ClimateTech',
  'AgriTech',
  'Logistics',
  'ECommerce',
  'LegalTech',
  'SaaS',
  'CleanTech',
  'PropTech',
  'HRTech',
  'Gaming',
];

export const MOMENTUM_VALUES = ['rising', 'steady', 'declining'];

export default VERTICALS;
