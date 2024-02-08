import { Construct } from 'constructs';
import {
  Stack,
  StackProps,
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_dynamodb as dynamoDB,
  aws_lambda_event_sources as lambdaEventSource,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path = require('path');

export class UpdateProductsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB
    const productsTable = new dynamoDB.Table(this, 'ProductsTable', {
      tableName: 'products-table',
      partitionKey: { name: 'productId', type: dynamoDB.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    // S3 Buckets
    const updateProductsBucket = new s3.Bucket(this, 'UpdateProductsBucket', {
      bucketName: 'update-products-bucket',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // IAM Roles
    const updateProductsRole = new iam.Role(this, 'UpdateProductsLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'update-products-lambda-role'
    });
    updateProductsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [updateProductsBucket.bucketArn + '/*']
    }));
    updateProductsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [productsTable.tableArn]
    }));
    updateProductsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:*:*:*']
    }));

    // Lambda
    const updateProductsFunction = new NodejsFunction(this, 'UpdateProductsLambda', {
      functionName: 'update-products-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(10),
      entry: path.join(__dirname, 'update-products-lambda.ts'),
      role: updateProductsRole,
      events: [
        new lambdaEventSource.S3EventSource(updateProductsBucket, {
          events: [
            s3.EventType.OBJECT_CREATED_PUT
          ]
        })
      ]
    });
  }
}
