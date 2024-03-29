import {
  Stack,
  StackProps,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_dynamodb as dynamoDB,
  aws_stepfunctions as stepFunctions,
  aws_stepfunctions_tasks as tasks,
  aws_ses as ses,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';

import { Construct } from 'constructs';
import {
  addCloudWatchPermissions,
  addDynamoPermissions,
  addSESPermissions
} from '../common/cdk-helpers/iam-helper';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  productsTableName,
  ordersTableName,
  senderEmail,
  recipientEmail
} from '../common/constants';
import path = require('path');
import { IntegrationPattern, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';

interface OrdersWorkflowStackProps extends StackProps {
  productsTableArn: string
}

export class OrdersWorkflowStack extends Stack {
  public readonly stateMachineArn: string;
  public readonly decisionCallbackArn: string;

  constructor(scope: Construct, id: string, props: OrdersWorkflowStackProps) {
    super(scope, id, props);

    // DynamoDB
    const ordersTable = new dynamoDB.Table(this, 'OrdersTable', {
      tableName: ordersTableName,
      partitionKey: { name: 'orderId', type: dynamoDB.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    // IAM
    const retrieveAndOrderRole = new iam.Role(this, 'RetrieveAndOrderProductsRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'retrieve-products-lambda-role'
    });
    addCloudWatchPermissions(retrieveAndOrderRole);
    addDynamoPermissions(retrieveAndOrderRole, [props.productsTableArn, ordersTable.tableArn]);

    const decisionCallbackRole = new iam.Role(this, 'DecisionCallbackRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'decision-callback-lambda-role'
    });
    addCloudWatchPermissions(decisionCallbackRole);
    addSESPermissions(decisionCallbackRole);

    // SES
    const senderIdentity = new ses.EmailIdentity(this, 'SenderIdentity', {
      identity: {
        value: senderEmail
      }
    });
    const recipientIdentity = new ses.EmailIdentity(this, 'RecipientIdentity', {
      identity: {
        value: recipientEmail
      }
    });

    // Lambda
    const retrieveProductsFunction = new NodejsFunction(this, 'RetrieveProductsLambda', {
      functionName: 'retrieve-products-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      timeout: Duration.seconds(10),
      entry: path.join(__dirname, 'lambda-functions/retrieve-products.ts'),
      role: retrieveAndOrderRole,
      environment: {
        productsTableName,
        ordersTableName
      }
    });

    const calculateTotalFunction = new NodejsFunction(this, 'CalculateTotalPriceLambda', {
      functionName: 'calculate-total-price-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda-functions/calculate-price.ts')
    });

    const decisionCallbackFunction = new NodejsFunction(this, 'DecisionCallbackLambda', {
      functionName: 'decision-callback-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      timeout: Duration.seconds(10),
      entry: path.join(__dirname, 'lambda-functions/decision-callback.ts'),
      role: decisionCallbackRole
    });
    this.decisionCallbackArn = decisionCallbackFunction.functionArn;

    const orderProductsFunction = new NodejsFunction(this, 'OrderProductsLambda', {
      functionName: 'order-products-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda-functions/order-products.ts'),
      role: retrieveAndOrderRole
    });

    // Step Function
    const retrieveState = new tasks.LambdaInvoke(this, 'RetrieveProductsTask', {
      stateName: 'Retrieve products',
      lambdaFunction: retrieveProductsFunction,
      inputPath: '$.Payload'
    });
    const checkAvailabilityChoice = new stepFunctions.Choice(this, 'AreAllProductsAvailable', { stateName: 'Are all products available ?' });
    const allAvailableResult = stepFunctions.Condition.isPresent('$.Payload.products');
    const allAvailablePass = new stepFunctions.Pass(this, 'AllAvailable', { stateName: 'Yes' });
    const notAllAvailablePass = new stepFunctions.Pass(this, 'NotAllAvailable', { stateName: 'No' });

    const waitState = new stepFunctions.Wait(this, 'WaitForProductAvailability', {
      stateName: 'Wait for availability to change...',
      time: stepFunctions.WaitTime.secondsPath('$.Payload.availableAfter')
    });

    const calculateTotalState = new tasks.LambdaInvoke(this, 'CalculateTask', {
      stateName: 'Calculate total order price',
      lambdaFunction: calculateTotalFunction,
      inputPath: '$.Payload'
    });

    const checkTotalPriceChoice = new stepFunctions.Choice(this, 'CheckTotalPrice', { stateName: 'Is total order price over 10,000 ?' });
    const totalOverLimitCondition = stepFunctions.Condition.numberGreaterThanEquals('$.Payload.totalPrice', 10000);
    const totalOverLimitPass = new stepFunctions.Pass(this, 'TotalOverLimitPass', { stateName: 'Total price is over 10,000' });
    const totalUnderLimitPass = new stepFunctions.Pass(this, 'TotalUnderLimitPass', { stateName: 'Total price is under 10,000' });

    const decisionCallbackState = new tasks.LambdaInvoke(this, 'DecisionCallbackTask', {
      stateName: 'Waiting for manual order decision',
      lambdaFunction: decisionCallbackFunction,
      integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      payload: stepFunctions.TaskInput.fromObject({
        "orderId.$": "$.Payload.orderId",
        "totalPrice.$": "$.Payload.totalPrice",
        "isApproved.$": "$.Payload.isApproved",
        taskToken: JsonPath.taskToken,
      })
    });

    const isOrderApprovedChoice = new stepFunctions.Choice(this, 'IsOrderApproved', { stateName: 'Is order approved ?' });
    const orderApprovedCondition = stepFunctions.Condition.booleanEquals('$.Payload.isApproved', true);
    const orderApprovedPass = new stepFunctions.Pass(this, 'OrderApprovedPass', { stateName: 'Order approved' });
    const orderRejectedPass = new stepFunctions.Pass(this, 'OrderRejectedPass', { stateName: 'Order rejected' });

    const orderProductsState = new tasks.LambdaInvoke(this, 'OrderProductsTask', {
      stateName: 'Order products',
      lambdaFunction: orderProductsFunction,
      inputPath: '$.Payload'
    })

    const failureState = new stepFunctions.Fail(this, 'Failed');
    const successState = new stepFunctions.Succeed(this, 'Success');

    const stateMachineDefinition = 
      retrieveState
      .next(checkAvailabilityChoice
        .when(allAvailableResult,
          allAvailablePass
          .next(calculateTotalState)
          .next(checkTotalPriceChoice
            .when(totalOverLimitCondition,
              totalOverLimitPass
              .next(decisionCallbackState)
              .next(isOrderApprovedChoice
                .when(orderApprovedCondition,
                  orderApprovedPass
                  .next(orderProductsState))
                .otherwise(orderRejectedPass
                  .next(failureState))))
            .otherwise(totalUnderLimitPass
              .next(orderProductsState)
              .next(successState))))
        .otherwise(notAllAvailablePass
          .next(waitState)
          .next(retrieveState)));

    const stateMachine = new stepFunctions.StateMachine(this, 'OrdersWorkflow', {
      stateMachineName: 'orders-workflow',
      definitionBody: stepFunctions.DefinitionBody.fromChainable(stateMachineDefinition),
      timeout: Duration.minutes(15)
    });
    this.stateMachineArn = stateMachine.stateMachineArn;
  }
}
