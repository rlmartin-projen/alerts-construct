import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { paramCase } from 'change-case';
import { Construct } from 'constructs';
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
const comparisonOperatorMap: Record<ComparisonOperator, AwsAlarmComparisonOperator> = {
  '<': 'LessThanThreshold',
  '<=': 'LessThanOrEqualToThreshold',
  '>': 'GreaterThanThreshold',
  '>=': 'GreaterThanOrEqualToThreshold',
};

export interface AwsMetricAlert<Namespace extends string> extends Alert<Namespace> {
  readonly aggregate: {
    readonly overSeconds?: AllowedSeconds;
    readonly type: AggregateType;
  };
  readonly metric: {
    readonly name: string;
    readonly namespace?: string;
    readonly dimensions?: { [key: string]: string };
  };
  readonly watch: {
    readonly operator: ComparisonOperator;
    readonly forPeriods: number;
  };
}

export class AwsMetricAlertConstruct<Namespace extends string> extends Construct {
  constructor(scope: Construct, id: string, config: AwsMetricAlert<Namespace>, notifier: string) {
    super(scope, id);
    const {
      aggregate: { overSeconds, type: aggregateType }, critical,
      metric: { dimensions: metricDimensions, name: metricName, namespace: metricNamespace },
      name, namespace, tags, watch: { forPeriods, operator }, warning,
    } = config;
    const cleanName = paramCase(`${namespace}-${name}`);

    const setups = {
      critical,
      warning,
    };

    Object.entries(setups).forEach(([setupName, threshold]) => {
      const topic = new SnsTopic(this, `${setupName}-topic`, {
        name: `${cleanName}-${setupName}`,
      });
      new CloudwatchMetricAlarm(this, `${setupName}-monitor`, {
        alarmName: `${name}-${setupName}`,
        metricName,
        namespace: metricNamespace,
        dimensions: metricDimensions,
        comparisonOperator: comparisonOperatorMap[operator],
        evaluationPeriods: forPeriods,
        period: overSeconds,
        statistic: aggregateType.startsWith('p') ? undefined : aggregateType,
        extendedStatistic: aggregateType.startsWith('p') ? aggregateType : undefined,
        threshold,
        alarmActions: [topic.arn],
        okActions: [topic.arn],
        tags,
      });
      new SnsTopicSubscription(this, `${setupName}-subscription`, {
        protocol: 'https',
        endpoint: notifier,
        topicArn: topic.arn,
      });
    });
  }
}
