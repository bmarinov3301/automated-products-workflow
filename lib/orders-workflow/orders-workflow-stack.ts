import {
  Stack,
  StackProps,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_dynamodb as dynamoDB,
  aws_stepfunctions as stepFunctions,
  aws_stepfunctions_tasks as tasks,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';

import { Construct } from 'constructs';
import {
  addCloudWatchPermissions, addDynamoPermissions
} from '../common/cdk-helpers/iam-helper';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  productsTableName,
  ordersTableName
} from '../common/constants';
import path = require('path');

interface OrdersWorkflowStackProps extends StackProps {
  productsTableArn: string
}

export class OrdersWorkflowStack extends Stack {
  public readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: OrdersWorkflowStackProps) {
    super(scope, id, props);

    // DynamoDB
    const ordersTable = new dynamoDB.Table(this, 'OrdersTable', {
      tableName: ordersTableName,
      partitionKey: { name: 'orderId', type: dynamoDB.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    // IAM
    const retrieveProductsRole = new iam.Role(this, 'RetrieveProductsRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'retrieve-products-lambda-role'
    });
    addCloudWatchPermissions(retrieveProductsRole);
    addDynamoPermissions(retrieveProductsRole, [props.productsTableArn, ordersTable.tableArn]);

    // Lambda
    const retrieveProductsFunction = new NodejsFunction(this, 'RetrieveProductsLambda', {
      functionName: 'retrieve-products-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(10),
      entry: path.join(__dirname, 'lambda-functions/retrieve-products.ts'),
      role: retrieveProductsRole,
      environment: {
        productsTableName,
        ordersTableName
      }
    });

    const calculateTotalFunction = new NodejsFunction(this, 'CalculateTotalPriceLambda', {
      functionName: 'calculate-total-price-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(5),
      entry: path.join(__dirname, 'lambda-functions/calculate-price.ts')
    });

    // Step Function
    const retrieveState = new tasks.LambdaInvoke(this, 'RetrieveTask', {
      stateName: 'Retrieve products',
      lambdaFunction: retrieveProductsFunction,
      inputPath: '$.Payload'
    });
    const checkAvailabilityStep = new stepFunctions.Choice(this, 'AreAllProductsAvailable', { stateName: 'Are all products available ?' });
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

    const checkTotalPriceStep = new stepFunctions.Choice(this, 'CheckTotalPrice', { stateName: 'Is total order price over 10,000 ?' });
    const totalOverLimitResult = stepFunctions.Condition.numberGreaterThanEquals('$.Payload.totalPrice', 10000);
    const totalOverLimitPass = new stepFunctions.Pass(this, 'TotalOverLimitPass', { stateName: 'Total price is over 10,000' });
    const totalUnderLimitPass = new stepFunctions.Pass(this, 'TotalUnderLimitPass', { stateName: 'Total price is under 10,000' });

    const failureState = new stepFunctions.Fail(this, 'Failed');
    const successState = new stepFunctions.Succeed(this, 'Success');

    const stateMachineDefinition = 
      retrieveState
      .next(checkAvailabilityStep
        .when(allAvailableResult, allAvailablePass
          .next(calculateTotalState)
          .next(checkTotalPriceStep
            .when(totalOverLimitResult, totalOverLimitPass
              .next(failureState))
            .otherwise(totalUnderLimitPass
              .next(successState))))
        .otherwise(notAllAvailablePass
          .next(waitState
            .next(retrieveState))));

    const stateMachine = new stepFunctions.StateMachine(this, 'OrdersWorkflow', {
      stateMachineName: 'orders-workflow',
      definitionBody: stepFunctions.DefinitionBody.fromChainable(stateMachineDefinition),
      timeout: Duration.minutes(15)
    });
    this.stateMachineArn = stateMachine.stateMachineArn;
  }
}
