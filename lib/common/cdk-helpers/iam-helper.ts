import {
  aws_iam as iam
} from 'aws-cdk-lib';
import {
  region,
  senderEmail
} from '../constants';

export const addCloudWatchPermissions = (role: iam.Role): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
    resources: ['arn:aws:logs:*:*:*']
  }));
}

export const addDynamoPermissions = (role: iam.Role, tableArns: string[]): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem'],
    resources: tableArns
  }));
}

export const addS3Permissions = (role: iam.Role, bucketArn: string): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['s3:GetObject'],
    resources: [bucketArn + '/*']
  }));
}

export const addStateMachinePermissions = (role: iam.Role, stateMachineArn: string): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['states:StartExecution'],
    resources: [stateMachineArn]
  }));
}

export const addSESPermissions = (role: iam.Role): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['ses:sendEmail', 'ses:sendRawEmail'],
    resources: [`arn:aws:ses:${region}:*:identity/${senderEmail}`]
  }));
}
