import { Construct } from 'constructs';
import { DatadogMonitorAlert, DatadogMonitorAlertConstruct } from './monitorAlert';
import { WithOwner } from '../../types';

export class DatadogLogAlertConstruct<
  Namespace extends string,
  Environments,
  Teams extends string,
> extends DatadogMonitorAlertConstruct<Namespace, Environments, Teams> {
  constructor(scope: Construct, id: string, config: DatadogMonitorAlert<Namespace>, notifier: string) {
    super(scope, id, config, notifier, 'log alert');
  }
}

export type AggregationType = 'avg' | 'count' | 'max' | 'min' | 'sum';
export interface LogsQuery {
  readonly selector: { [key: string]: string | string[] };
  readonly timeSpan: {
    readonly num: number;
    readonly unit?: 'm' | 'h';
  };
  readonly comparator: string;
  readonly threshold: number;
  readonly aggregate?: AggregationType;
  readonly parameter?: string;
}

export interface WithLogsQuery<EnvFilterType> {
  readonly query: LogsQuery;
  readonly envFilterType?: EnvFilterType;
}

export function toAlerts<
  Teams extends string,
  Namespace extends string,
  Environment extends string,
  EnvFilterType extends string,
>(
  env: Environment,
  logAlerts: { [key:string]: Omit<DatadogMonitorAlert<Namespace> & WithOwner<Teams>, 'name' | 'query'> & WithLogsQuery<EnvFilterType> },
  defaultEnvFilterType: EnvFilterType,
  envFilterGenerator: (env: Environment, envFilterType: EnvFilterType) => object,
  disabled: string[] = [],
  nameGenerator: ((name: string, env: Environment, namespace: Namespace | undefined) => string) = defaultNameGenerator,
): (DatadogMonitorAlert<Namespace> & WithOwner<Teams>)[] {
  return Object.entries(logAlerts).filter(([name, _]) => !disabled.includes(name)).map(([name, alert]) => {
    return {
      name: nameGenerator(name, env, alert.namespace),
      ...alert,
      query: toQueryString(alert.query, envFilterGenerator(env, alert.envFilterType ?? defaultEnvFilterType)),
    };
  });
}

export function toQueryString(query: LogsQuery, additionalQuery?: object): string {
  const { aggregate = 'count', comparator, parameter, timeSpan, threshold } = query;
  const selector = Object.entries({ ...query.selector, ...additionalQuery }).map(([name, value]) => {
    const values = Array.isArray(value) ? `(${value.map(wrap).join(' OR ')})` : wrap(value);
    return `${name}:${values}`;
  }).join(' ');
  const aggParam = parameter ? `, "${parameter}"` : '';
  return `logs("${selector}").index("*").rollup("${aggregate}"${aggParam}).last("${timeSpan.num}${timeSpan.unit ?? 'm'}") ${comparator} ${threshold}`;
}

function defaultNameGenerator<Environment extends string, Namespace extends string>(
  name: string,
  env: Environment,
  namespace: Namespace | undefined,
): string {
  return `${namespace ? namespace + ' ' : ''}[${env}] - ${name}`;
}

function wrap(str: string): string {
  return str.match(/\s/) ? `"${str}"` : str;
}
