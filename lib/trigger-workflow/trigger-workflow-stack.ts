import { Construct } from 'constructs';
import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_iam as iam,
  Duration
} from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod
} from 'aws-cdk-lib/aws-apigatewayv2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {
  addCloudWatchPermissions
} from '../common/cdk-helpers/iam-helper';
import path = require('path');

interface TriggerWorkflowStackProps extends StackProps {
  stateMachineArn: string
}

export class TriggerWorkflowStack extends Stack {
  constructor(scope: Construct, id: string, props: TriggerWorkflowStackProps) {
    super(scope, id, props);

    // IAM
    const triggerWorkflowRole = new iam.Role(this, 'TriggerWorkflowLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'trigger-workflow-lambda-role',
    });
    addCloudWatchPermissions(triggerWorkflowRole);

    // Lambda
    const startWorkflowLambda = new NodejsFunction(this, 'StartWorkflowLambda', {
      functionName: 'start-workflow-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(30),
      entry: path.join(__dirname, 'lambda-functions/start-workflow.ts'),
      role: triggerWorkflowRole,
      environment: {
        stateMachineArn: props?.stateMachineArn
      }
    });

    // API Gateway
    const httpApi = new HttpApi(this, 'AutomatedWorkflowAPI', {
      apiName: 'automated-workflow-api',
      corsPreflight: {
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
        ],
        allowOrigins: ["*"]
      }
    });
    const startWorkflowIntegration = new HttpLambdaIntegration('StartWorkflowLambdaIntegration', startWorkflowLambda);

    httpApi.addRoutes({
      path: '/start',
      methods: [ HttpMethod.POST],
      integration: startWorkflowIntegration,
    });
    // httpApi.addRoutes({
    //   path: '/orders/approve/{orderId}',
    //   methods: [ HttpMethod.POST],
    //   integration: triggerWorkflowIntegration,
    // });
    // httpApi.addRoutes({
    //   path: '/orders/reject/{orderId}',
    //   methods: [ HttpMethod.POST],
    //   integration: triggerWorkflowIntegration,
    // });
  }
}
