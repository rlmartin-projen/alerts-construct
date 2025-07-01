import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { paramCase } from 'change-case';
import { Construct } from 'constructs';
import { toSnsNotifier } from './helper';
import { AwsMetric, ComparisonOperator, comparisonOperatorMap } from './metricAlert';
import { compact } from '../../helpers';
import { DefinedNotifier } from '../../notifiers';
import { Alert } from '../../types';

export interface AwsMetricQueryAlert<Namespace extends string, Environments> extends Alert<Namespace, Environments> {
  readonly equation: string;
  readonly metrics: { [key: string]: AwsMetric | undefined };
  readonly watch: {
    readonly operator: ComparisonOperator;
    readonly forPeriods: number;
  };
}

export class AwsMetricQueryAlertConstruct<Namespace extends string, Environments, Teams extends string> extends Construct {
  constructor(
    scope: Construct,
    id: string,
    config: AwsMetricQueryAlert<Namespace, Environments>,
    notifier: DefinedNotifier<Environments, Teams>,
    warningNotifier: DefinedNotifier<Environments, Teams>,
  ) {
    super(scope, id);
    const {
      autoClose = true, critical, description, env, equation, metrics,
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
        comparisonOperator: comparisonOperatorMap[operator],
        evaluationPeriods: forPeriods,
        metricQuery: [
          {
            id: 'equation',
            expression: equation,
            label: description,
            returnData: true,
          },
          ...compact(Object.entries(metrics).map(([metricName, metric]) => {
            return metric ? {
              id: metricName,
              metric: {
                metricName: metric.name,
                namespace: metric.namespace,
                period: metric.aggregate.overSeconds,
                stat: metric.aggregate.type,
                dimensions: metric.dimensions,
              },
            } : undefined;
          })),
        ],
        threshold,
        alarmActions: [snsNotifier.arn],
        okActions: autoClose ? [snsNotifier.arn] : undefined,
        tags,
      });
    });
  }
}
