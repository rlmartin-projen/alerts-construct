import { Construct } from 'constructs';
import { DatadogMonitorAlert, DatadogMonitorAlertConstruct } from './monitorAlert';

export class DatadogServiceAlertConstruct<
  Namespace extends string,
  Environments,
  Teams extends string,
> extends DatadogMonitorAlertConstruct<Namespace, Environments, Teams> {
  constructor(
    scope: Construct,
    id: string,
    config: DatadogMonitorAlert<Namespace>,
    env: keyof Environments,
    notifier: string,
    warningNotifier: string,
  ) {
    super(scope, id, config, env, notifier, warningNotifier, 'service check');
  }
}
