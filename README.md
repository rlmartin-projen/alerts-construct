# Alerts Construct
This is a set of interfaces and constructs that are intended to make it as easy as possible to define an alerting implementation (across providers such as Datadog, AWS, Sentry, etc) and follow that pattern in a repeatable manner.

The goal is to define a type of alert (e.g. DatadogLogAlert) - which includes a constructor - then create many alerts of that type by only specifying strongly-typed config.

Additionally, this is opinionated in forcing a list of teams and standard means of notifying those teams (likely through PagerDuty, Zenduty, etc).

## Pattern / approach
The core construct is the `AllAlerts` abstract class, which requires extension and small implementations. The important features are as follows:

### Teams
A list of team names (as a type), which is used to enforce types downstream. Define it as a union of string types:

```
type Teams = 'infrastructure' | 'data_engineering' | 'frontend';
```


### Namespace
Used for naming of alerts, to disambiguate similarly-named alerts from different systems. Similar to `Teams`, this is a string-union-type.


### Implementations
An interface that defines a property name and a constructor type used to create all alerts of that type. This is used to strongly-type the config for each of the different types of alerts.


### Environments
Another string-union-type, which defines which environments the alerts may be deployed to.


### Notifier
The type to be expected for the notifier config for the team.


### severityMap
Set this private property to a map of severity to `lowPriority` or `highPriority`.


### envOverrides
Override this method to control any sort of environment-specific overrides that should be enforced for all alerts in a given environment. An example use case would be to map the severity to a low severity for all alerts in a non-production environment.


## Example
Implement this abstract class to bring together all of your own org-specific configuration according to the above.

```javascript
import { Alert, AlertConstructors, alerts, AllAlerts, ConvertInterfaceToDict, NotificationEndpoints, Severity, WithOwner } from '@rlmartin-projen/alerts-construct';

type Environments = 'dev' | 'uat' | 'prod';
type Teams = 'data_engineering' | 'dev_ops';
type Namespace = 'AWS' | 'frontend' | 'message-service';

interface Implementations {
  datadogService: alerts.datadog.monitor.DatadogMonitorAlert<Namespace> & WithOwner<Teams>;
  datadogMetric: alerts.datadog.monitor.DatadogMonitorAlert<Namespace> & WithOwner<Teams>;
  datadogLog: alerts.datadog.monitor.DatadogMonitorAlert<Namespace> & WithOwner<Teams>;
}

export class MyAlerts extends AllAlerts<Teams, Namespace, ConvertInterfaceToDict<Implementations>, Environments, string> {
  protected get alertConstructors(): AlertConstructors<Implementations, string> {
    return {
      datadogService: alerts.datadog.service.DatadogServiceAlertConstruct,
      datadogMetric: alerts.datadog.metric.DatadogMetricAlertConstruct,
      datadogLog: alerts.datadog.log.DatadogLogAlertConstruct,
    };
  };

  protected get severityMap(): Record<Severity, keyof NotificationEndpoints<string>> {
    return {
      SEV0: 'highPriority',
      SEV1: 'highPriority',
      SEV2: 'highPriority',
      SEV3: 'lowPriority',
      SEV4: 'lowPriority',
    };
  }

  envOverrides<T extends Alert<Namespace> & WithOwner<Teams>>(alert: T): T {
    return {
      ...alert,
      severity: this.env === 'dev' ? 'SEV4' : alert.severity,
    };
  }
}
```