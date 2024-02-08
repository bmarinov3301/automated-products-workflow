import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';
import { env } from 'process';

interface FunctionPayload {
  productIds: string[]
}

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log(`Event received: ${JSON.stringify(event)}`);
    const productIds: FunctionPayload = JSON.parse(event.body ?? '');
    console.log(`Env var: ${env.stateMachineArn}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        eventReceived: event,
      }),
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