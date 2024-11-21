import { Construct } from 'constructs';
import { DatadogMonitorAlert, DatadogMonitorAlertConstruct } from './monitorAlert';

export class DatadogMetricAlertConstruct<
  Namespace extends string,
  Environments,
  Teams extends string,
  NotifierType
> extends DatadogMonitorAlertConstruct<Namespace, Environments, Teams, NotifierType> {
  constructor(scope: Construct, id: string, config: DatadogMonitorAlert<Namespace>, notifier: string) {
    super(scope, id, config, notifier, 'query alert');
  }
}
