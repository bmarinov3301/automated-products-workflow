import {
  Stack,
  StackProps,
  aws_iam as iam,
  aws_lambda as lambda,
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
import path = require('path');

interface OrdersWorkflowStackProps extends StackProps {
  productsTableArn: string,
  productsTableName: string
}

export class OrdersWorkflowStack extends Stack {
  public readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: OrdersWorkflowStackProps) {
    super(scope, id, props);

    // IAM
    const retrieveProductsRole = new iam.Role(this, 'RetrieveProductsRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'retrieve-products-lambda-role'
    });
    addCloudWatchPermissions(retrieveProductsRole);
    addDynamoPermissions(retrieveProductsRole, props?.productsTableArn);

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
        productsTableName: props.productsTableName
      }
    });

    // Step Function
    const retrieveState = new tasks.LambdaInvoke(this, 'RetrieveTask', {
      stateName: 'Retrieve products',
      lambdaFunction: retrieveProductsFunction
    });
    const checkAvailability = new stepFunctions.Choice(this, 'CheckProductAvailability');
    const allProductsAvailable = stepFunctions.Condition.booleanEquals('$.success', true);

    const waitState = new stepFunctions.Wait(this, 'WaitForProductAvailability', {
      stateName: 'Wait',
      time: stepFunctions.WaitTime.duration(Duration.seconds(15))
    });

    const successState = new stepFunctions.Succeed(this, 'Success');

    const stateMachineDefinition = 
      retrieveState
      .next(waitState)
      .next(successState);
    
    const stateMachine = new stepFunctions.StateMachine(this, 'OrdersWorkflow', {
      stateMachineName: 'orders-workflow',
      definitionBody: stepFunctions.DefinitionBody.fromChainable(stateMachineDefinition),
      timeout: Duration.minutes(15)
    });
    this.stateMachineArn = stateMachine.stateMachineArn;
  }
}
