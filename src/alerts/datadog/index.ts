import { Severity } from '../../types';

export const severityToDatadogPriority: Record<Severity, number> = {
  SEV0: 1,
  SEV1: 2,
  SEV2: 3,
  SEV3: 4,
  SEV4: 5,
};

// For other types, see https://docs.datadoghq.com/api/latest/monitors/#create-a-monitor
export type DatadogMonitorType = 'log alert' | 'query alert' | 'service check';

export function transformTags(tags: { [key: string]: string } | undefined): string[] | undefined {
  return tags ? Object.entries(tags).map(([name, value]) => `${name}:${value}`) : undefined;
}

export * as helper from './helper';
export * as log from './logAlert';
export * as metric from './metricAlert';
export * as monitor from './monitorAlert';
export * as service from './serviceAlert';
