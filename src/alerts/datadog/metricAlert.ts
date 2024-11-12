import { Construct } from 'constructs';
import { DatadogMonitorAlert, DatadogMonitorAlertConstruct } from './monitorAlert';

export class DatadogMetricAlertConstruct<Namespace extends string> extends DatadogMonitorAlertConstruct<Namespace> {
  constructor(scope: Construct, id: string, config: DatadogMonitorAlert<Namespace>, notifier: string) {
    super(scope, id, config, notifier, 'query alert');
  }
}