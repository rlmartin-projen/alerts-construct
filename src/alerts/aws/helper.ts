import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { Construct } from 'constructs';
import { DefinedNotifier, isSnsNotifier, isWebhookNotifier, SnsNotifier } from '../../notifiers';
import { NotificationEndpoints, TeamNotificationMap } from '../../types';

export function toSnsNotifier<Environments, Teams extends string, NotifierType>(
  notifier: DefinedNotifier<Environments, Teams, NotifierType>, scope: Construct, name: string,
): SnsNotifier {
  if (isSnsNotifier(notifier)) return notifier;
  const topic = new SnsTopic(scope, `${name}-topic`, {
    name,
  });
  const endpoint = isWebhookNotifier(notifier) ? notifier.url : notifier;
  new SnsTopicSubscription(scope, `${name}-subscription`, {
    protocol: 'https',
    endpoint,
    topicArn: topic.arn,
  });
  return {
    arn: topic.arn,
    name,
  };
}

export function teamNotificationsMapToSnsNotifiers<Teams extends string, Notifier>(
  teamNotificationMap: TeamNotificationMap<Teams, Notifier>,
  scope: Construct,
  namespace?: string,
): TeamNotificationMap<Teams, SnsNotifier> {
  return Object.entries(teamNotificationMap).reduce((all, [teamName, notifiers]) => {
    all[teamName as Teams] = Object.entries(notifiers as NotificationEndpoints<Notifier>)
      .reduce((teamNotifications, [notifierType, notifier]) => {
        teamNotifications[notifierType as keyof NotificationEndpoints<Notifier>] = toSnsNotifier(notifier, scope, `${namespace ? namespace + '-' : ''}${teamName}-${notifierType}`);
        return teamNotifications;
      }, Object.apply({}) as Record<keyof NotificationEndpoints<Notifier>, SnsNotifier>);
    return all;
  }, Object.apply({}) as TeamNotificationMap<Teams, SnsNotifier>);
}
