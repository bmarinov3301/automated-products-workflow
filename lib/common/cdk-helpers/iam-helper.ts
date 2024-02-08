import {
  aws_iam as iam
} from 'aws-cdk-lib';

export const addCloudWatchPermissions = (role: iam.Role): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
    resources: ['arn:aws:logs:*:*:*']
  }));
}

export const addDynamoPermissions = (role: iam.Role, tableArn: string): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['dynamodb:PutItem'],
    resources: [tableArn]
  }))
}

export const addS3Permissions = (role: iam.Role, bucketArn: string): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['s3:GetObject'],
    resources: [bucketArn + '/*']
  }))
}

export const addStateMachinePermissions = (role: iam.Role, stateMachineArn: string): void => {
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['states:StartExecution'],
    resources: [stateMachineArn]
  }))
}