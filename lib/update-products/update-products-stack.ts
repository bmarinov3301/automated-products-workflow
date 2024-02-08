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
import {
  addCloudWatchPermissions,
  addDynamoPermissions,
  addS3Permissions
} from '../common/cdk-helpers/iam-helper';
import { productsTableName } from '../common/constants';
import path = require('path');

export class UpdateProductsStack extends Stack {
  public readonly productsTableArn: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB
    const productsTable = new dynamoDB.Table(this, 'ProductsTable', {
      tableName: productsTableName,
      partitionKey: { name: 'productId', type: dynamoDB.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });
    this.productsTableArn = productsTable.tableArn;

    // S3
    const updateProductsBucket = new s3.Bucket(this, 'UpdateProductsBucket', {
      bucketName: 'update-products-bucket',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // IAM
    const updateProductsRole = new iam.Role(this, 'UpdateProductsLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'update-products-lambda-role'
    });
    addCloudWatchPermissions(updateProductsRole);
    addS3Permissions(updateProductsRole, updateProductsBucket.bucketArn);
    addDynamoPermissions(updateProductsRole, [productsTable.tableArn]);

    // Lambda
    const updateProductsFunction = new NodejsFunction(this, 'UpdateProductsLambda', {
      functionName: 'update-products-lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(10),
      entry: path.join(__dirname, 'lambda-functions/update-products.ts'),
      role: updateProductsRole,
      events: [
        new lambdaEventSource.S3EventSource(updateProductsBucket, {
          events: [
            s3.EventType.OBJECT_CREATED_PUT
          ]
        })
      ],
      environment: {
        productsTableName
      }
    });
  }
}
