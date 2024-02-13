#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { UpdateProductsStack } from '../lib/update-products/update-products-stack';
import { WorkflowTriggersStack } from '../lib/workflow-triggers/workflow-triggers-stack';
import { OrdersWorkflowStack } from '../lib/orders-workflow/orders-workflow-stack';

const app = new cdk.App();
const updateProductsStack = new UpdateProductsStack(app, 'UpdateProductsStack');
const ordersWorkflowStack = new OrdersWorkflowStack(app, 'OrdersWorkflowStack', {
  productsTableArn: updateProductsStack.productsTableArn
});
new WorkflowTriggersStack(app, 'TriggerWorkflowStack', {
  stateMachineArn: ordersWorkflowStack.stateMachineArn,
  decisionCallbackArn: ordersWorkflowStack.decisionCallbackArn
});
