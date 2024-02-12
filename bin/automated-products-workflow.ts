#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UpdateProductsStack } from '../lib/update-products/update-products-stack';
import { WorkflowTriggersStack } from '../lib/trigger-workflow/workflow-triggers-stack';
import { OrdersWorkflowStack } from '../lib/orders-workflow/orders-workflow-stack';

/* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */

const app = new cdk.App();
const updateProductsStack = new UpdateProductsStack(app, 'UpdateProductsStack');
const ordersWorkflowStack = new OrdersWorkflowStack(app, 'OrdersWorkflowStack', {
  productsTableArn: updateProductsStack.productsTableArn
});
new WorkflowTriggersStack(app, 'TriggerWorkflowStack', {
  stateMachineArn: ordersWorkflowStack.stateMachineArn,
  decisionCallbackArn: ordersWorkflowStack.decisionCallbackArn
});
