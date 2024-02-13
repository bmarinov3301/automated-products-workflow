import { Construct } from 'constructs';
import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_iam as iam,
  custom_resources as cr,
  CfnOutput,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod
} from 'aws-cdk-lib/aws-apigatewayv2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {
  addCloudWatchPermissions,
  addStateMachinePermissions
} from '../common/cdk-helpers/iam-helper';
import path = require('path');

interface WorkflowTriggersStackProps extends StackProps {
  stateMachineArn: string,
  decisionCallbackArn: string
}

export class WorkflowTriggersStack extends Stack {
  constructor(scope: Construct, id: string, props: WorkflowTriggersStackProps) {
    super(scope, id, props);

    // IAM
    const triggerWorkflowRole = new iam.Role(this, 'TriggerWorkflowLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'trigger-workflow-lambda-role',
    });
    addCloudWatchPermissions(triggerWorkflowRole);
    addStateMachinePermissions(triggerWorkflowRole, props.stateMachineArn);

    // Lambda
    const startWorkflowFunction = new NodejsFunction(this, 'StartWorkflowLambda', {
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

    const sendDecisionFunction = new NodejsFunction(this, 'SendDecisionLambda', {
      functionName: 'send-decision-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(5),
      entry: path.join(__dirname, 'lambda-functions/send-decision.ts'),
      role: triggerWorkflowRole
    })

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
    const startWorkflowIntegration = new HttpLambdaIntegration('StartWorkflowLambdaIntegration', startWorkflowFunction);
    const sendDecisionIntegration = new HttpLambdaIntegration('SendDecisionLambdaIntegration', sendDecisionFunction);

    httpApi.addRoutes({
      path: '/start',
      methods: [ HttpMethod.POST],
      integration: startWorkflowIntegration,
    });
    httpApi.addRoutes({
      path: '/order/decision',
      methods: [ HttpMethod.GET ],
      integration: sendDecisionIntegration
    });

    // Update function environment variable from OrdersWorkflowStack
    const decisionCallbackFunction = lambda.Function.fromFunctionArn(this, 'DecisionCallbackImported', props.decisionCallbackArn);

    new cr.AwsCustomResource(this, 'UpdateEnvVar', {
      onCreate: {
        service: 'Lambda',
        action: 'updateFunctionConfiguration',
        parameters: {
          FunctionName: decisionCallbackFunction.functionArn,
          Environment: {
            Variables: {
              apiUrl: httpApi.apiEndpoint,
            },
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of('DecisionCallbackLambda'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [decisionCallbackFunction.functionArn],
      }),
      removalPolicy: RemovalPolicy.DESTROY
    });

    new CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint
    });
  }
}
