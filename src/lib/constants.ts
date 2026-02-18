export const APP_NAME = "Enluka Legal";

export const REFRESH_TOKEN_COOKIE = "lexsuite_refresh_token";

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.6,
} as const;

export const ESCALATION_OFFSET_HOURS = {
  T_14D: 336,
  T_7D: 168,
  T_48H: 48,
  T_24H: 24,
  OVERDUE: 0,
} as const;
