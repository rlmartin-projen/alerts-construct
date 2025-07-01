import { Construct } from 'constructs';
import { DatadogMonitorAlert, DatadogMonitorAlertConstruct } from './monitorAlert';

export class DatadogMetricAlertConstruct<
  Namespace extends string,
  Environments,
  Teams extends string,
> extends DatadogMonitorAlertConstruct<Namespace, Environments, Teams> {
  constructor(
    scope: Construct,
    id: string,
    config: DatadogMonitorAlert<Namespace, Environments>,
    notifier: string,
    warningNotifier: string,
  ) {
    super(scope, id, config, notifier, warningNotifier, 'query alert');
  }
}
