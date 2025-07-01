import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { paramCase } from 'change-case';
import { Construct } from 'constructs';
import { toSnsNotifier } from './helper';
import { DefinedNotifier } from '../../notifiers';
import { Alert } from '../../types';

export type ComparisonOperator = '>' | '>=' | '<' | '<=';
export type AggregateType = 'SampleCount' | 'Average' | 'Sum' | 'Minimum' | 'Maximum' | 'p95' | 'p99' | 'p99.9';
export type AllowedSeconds = 10 | 30 | 60 | 120 | 180 | 240 | 300 | 360 | 420 | 480 | 540 | 600;
type AwsAlarmComparisonOperator =
  'GreaterThanOrEqualToThreshold'
  | 'GreaterThanThreshold'
  | 'GreaterThanUpperThreshold'
  | 'LessThanLowerOrGreaterThanUpperThreshold'
  | 'LessThanLowerThreshold'
  | 'LessThanOrEqualToThreshold'
  | 'LessThanThreshold'
;
export const comparisonOperatorMap: Record<ComparisonOperator, AwsAlarmComparisonOperator> = {
  '<': 'LessThanThreshold',
  '<=': 'LessThanOrEqualToThreshold',
  '>': 'GreaterThanThreshold',
  '>=': 'GreaterThanOrEqualToThreshold',
};

export interface AwsMetric {
  readonly name: string;
  readonly namespace: string;
  readonly dimensions?: { [key: string]: string };
  readonly aggregate: {
    readonly overSeconds: AllowedSeconds;
    readonly type: AggregateType;
  };
}

export interface AwsMetricAlert<Namespace extends string> extends Alert<Namespace> {
  readonly metric: AwsMetric;
  readonly watch: {
    readonly operator: ComparisonOperator;
    readonly forPeriods: number;
  };
}

export class AwsMetricAlertConstruct<Namespace extends string, Environments, Teams extends string> extends Construct {
  constructor(
    scope: Construct,
    id: string,
    config: AwsMetricAlert<Namespace>,
    env: keyof Environments,
    notifier: DefinedNotifier<Environments, Teams>,
    warningNotifier: DefinedNotifier<Environments, Teams>,
  ) {
    super(scope, id);
    const {
      autoClose = true, critical, description,
      metric: { aggregate: { overSeconds, type: aggregateType }, dimensions: metricDimensions, name: metricName, namespace: metricNamespace },
      name, namespace, tags, watch: { forPeriods, operator }, warning,
    } = config;
    const cleanName = paramCase(`${namespace}-${name}`);

    const setups: { [key: string]: number } = JSON.parse(JSON.stringify({
      critical,
      warning,
    }));

    const snsCriticalNotifier = toSnsNotifier(notifier, this, cleanName);
    const snsWarningNotifier = toSnsNotifier(warningNotifier, this, cleanName);

    Object.entries(setups).forEach(([setupName, threshold]) => {
      const snsNotifier = setupName === 'warning' ? snsWarningNotifier : snsCriticalNotifier;
      new CloudwatchMetricAlarm(this, `${setupName}-monitor`, {
        alarmName: `${name}-${setupName}${String(env) === 'prod' ? '' : ('-' + String(env))}`,
        alarmDescription: description,
        metricName,
        namespace: metricNamespace,
        dimensions: metricDimensions,
        comparisonOperator: comparisonOperatorMap[operator],
        evaluationPeriods: forPeriods,
        period: overSeconds,
        statistic: aggregateType.startsWith('p') ? undefined : aggregateType,
        extendedStatistic: aggregateType.startsWith('p') ? aggregateType : undefined,
        threshold,
        alarmActions: [snsNotifier.arn],
        okActions: autoClose ? [snsNotifier.arn] : undefined,
        tags,
      });
    });
  }
}
