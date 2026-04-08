export const SESSION_STATUSES = [
  'created',
  'planning',
  'planned',
  'patching',
  'validating',
  'reviewing',
  'completed',
] as const;

export const PATCH_STATUSES = ['pending', 'accepted', 'rejected'] as const;
