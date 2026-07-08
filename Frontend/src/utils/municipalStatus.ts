import type { MunicipalStatus } from '../types';

export interface PublicStatusInfo {
  label: string;
  icon: string;
  color: string;
  dotColor: string;
  message: string;
  progressPercent: number;
}

export interface StatusStage {
  key: MunicipalStatus;
  label: string;
  icon: string;
  dotColor: string;
}

const statusMap: Record<MunicipalStatus, PublicStatusInfo> = {
  pending: {
    label: 'Report Submitted',
    icon: 'circle',
    color: 'text-blue-400',
    dotColor: 'bg-blue-500',
    message: 'Your pollution report has been submitted and is awaiting review by municipal authorities.',
    progressPercent: 10,
  },
  under_review: {
    label: 'Under Review',
    icon: 'magnifying-glass',
    color: 'text-yellow-400',
    dotColor: 'bg-yellow-500',
    message: 'Municipal authorities are reviewing your report and assessing the required response.',
    progressPercent: 30,
  },
  team_assigned: {
    label: 'Team Assigned',
    icon: 'circle',
    color: 'text-orange-400',
    dotColor: 'bg-orange-500',
    message: 'A municipal response team has been assigned to address the reported pollution issue.',
    progressPercent: 50,
  },
  in_progress: {
    label: 'Cleanup In Progress',
    icon: 'circle',
    color: 'text-orange-400',
    dotColor: 'bg-orange-500',
    message: 'Municipal team has been assigned and cleanup is currently in progress.',
    progressPercent: 70,
  },
  resolved: {
    label: 'Resolved',
    icon: 'circle',
    color: 'text-green-400',
    dotColor: 'bg-green-500',
    message: 'This pollution report has been resolved by the municipal authorities.',
    progressPercent: 100,
  },
};

export const STATUS_STAGES: StatusStage[] = [
  { key: 'pending', label: 'Report Submitted', icon: 'file-lines', dotColor: 'bg-blue-500' },
  { key: 'under_review', label: 'Under Review', icon: 'magnifying-glass', dotColor: 'bg-yellow-500' },
  { key: 'team_assigned', label: 'Team Assigned', icon: 'users', dotColor: 'bg-orange-500' },
  { key: 'in_progress', label: 'In Progress', icon: 'screwdriver-wrench', dotColor: 'bg-orange-500' },
  { key: 'resolved', label: 'Resolved', icon: 'check', dotColor: 'bg-green-500' },
];

const stageOrder: MunicipalStatus[] = ['pending', 'under_review', 'team_assigned', 'in_progress', 'resolved'];

export function getPublicStatusInfo(status: MunicipalStatus): PublicStatusInfo {
  return statusMap[status] || statusMap.pending;
}

export function getStageIndex(status: MunicipalStatus): number {
  return stageOrder.indexOf(status);
}

export function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export { stageOrder };
