import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { paramCase } from 'change-case';
import { Construct } from 'constructs';
import { toSnsNotifier } from './helper';
import { AwsMetric, ComparisonOperator, comparisonOperatorMap } from './metricAlert';
import { DefinedNotifier } from '../../notifiers';
import { Alert } from '../../types';

export interface AwsMetricQueryAlert<Namespace extends string> extends Alert<Namespace> {
  readonly equation: string;
  readonly description?: string;
  readonly metrics: { [key: string]: AwsMetric };
  readonly watch: {
    readonly operator: ComparisonOperator;
    readonly forPeriods: number;
  };
}

export class AwsMetricQueryAlertConstruct<Namespace extends string, Environments, Teams extends string> extends Construct {
  constructor(scope: Construct, id: string, config: AwsMetricQueryAlert<Namespace>, notifier: DefinedNotifier<Environments, Teams>) {
    super(scope, id);
    const {
      critical, description, equation, metrics,
      name, namespace, tags, watch: { forPeriods, operator }, warning,
    } = config;
    const cleanName = paramCase(`${namespace}-${name}`);

    const setups: { [key: string]: number } = JSON.parse(JSON.stringify({
      critical,
      warning,
    }));

    const snsNotifier = toSnsNotifier(notifier, this, cleanName);

    Object.entries(setups).forEach(([setupName, threshold]) => {
      new CloudwatchMetricAlarm(this, `${setupName}-monitor`, {
        alarmName: `${name}-${setupName}`,
        comparisonOperator: comparisonOperatorMap[operator],
        evaluationPeriods: forPeriods,
        metricQuery: [
          {
            id: 'equation',
            expression: equation,
            label: description,
            returnData: true,
          },
          ...Object.entries(metrics).map(([metricName, metric]) => {
            return {
              id: metricName,
              metric: {
                metricName: metric.name,
                namespace: metric.namespace,
                period: metric.aggregate.overSeconds,
                stat: metric.aggregate.type,
                dimensions: metric.dimensions,
              },
            };
          }),
        ],
        threshold,
        alarmActions: [snsNotifier.arn],
        okActions: [snsNotifier.arn],
        tags,
      });
    });
  }
}