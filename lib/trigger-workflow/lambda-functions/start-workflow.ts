import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';
import {
  SFNClient,
  StartExecutionCommand
} from '@aws-sdk/client-sfn';
import { env } from 'process';

interface FunctionPayload {
  Payload: {
    productIds: string[]
  }
}

const client = new SFNClient();

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log(`Received API Gateway event with body: ${event.body}`);
    const payload: FunctionPayload = JSON.parse(event.body ?? '');
    const stateMachineArn = env.stateMachineArn;

    if (payload.Payload.productIds.length < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          body: "Request body cannot be empty. Please provide an array of product IDs"
        }),
      }
    }

    console.log(`Starting workflow with state machine arn ${stateMachineArn}`);

    const command = new StartExecutionCommand({
      stateMachineArn,
      input: JSON.stringify(payload)
    });
    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        startTime: response.startDate,
        arn: response.executionArn
      })
    }
  }
  catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error!',
      }),
    }
  }
}