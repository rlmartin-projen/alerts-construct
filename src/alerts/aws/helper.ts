import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { Construct } from 'constructs';
import { DefinedNotifier, isSnsNotifier, isWebhookNotifier, SnsNotifier } from '../../notifiers';

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
