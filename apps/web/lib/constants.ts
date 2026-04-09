/**
 * Shared constants used across the GrokForge frontend.
 * Single source of truth for session statuses, display labels, and config.
 */

export const SESSION_STATUS = {
  CREATED: 'created',
  PLANNING: 'planning',
  PLANNED: 'planned',
  PATCHING: 'patching',
  REVIEWING: 'reviewing',
  VALIDATING: 'validating',
  COMPLETED: 'completed',
} as const;

export type SessionStatusType = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const STATUS_DISPLAY: Record<string, { short: string; label: string; color: string }> = {
  [SESSION_STATUS.CREATED]: { short: 'NEW', label: 'New Session', color: 'text-foreground/30' },
  [SESSION_STATUS.PLANNING]: { short: 'PLAN', label: 'Planning', color: 'text-yellow-400/60' },
  [SESSION_STATUS.PLANNED]: { short: 'PLAN', label: 'Planned', color: 'text-blue-400/60' },
  [SESSION_STATUS.PATCHING]: { short: 'PATCH', label: 'Patching', color: 'text-yellow-400/60' },
  [SESSION_STATUS.REVIEWING]: { short: 'REV', label: 'Reviewing', color: 'text-purple-400/60' },
  [SESSION_STATUS.VALIDATING]: { short: 'TEST', label: 'Validating', color: 'text-orange-400/60' },
  [SESSION_STATUS.COMPLETED]: { short: 'DONE', label: 'Completed', color: 'text-green-400/60' },
};

export const PATCH_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const SIDEBAR_CONFIG = {
  DEFAULT_WIDTH: 224,
  MIN_WIDTH: 180,
  MAX_WIDTH: 360,
  COLLAPSED_WIDTH: 48,
  POLL_INTERVAL_MS: 3000,
} as const;
