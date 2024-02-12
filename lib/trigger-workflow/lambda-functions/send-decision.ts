import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';
import {
  SFNClient,
  SendTaskSuccessCommand
} from '@aws-sdk/client-sfn';

type RequestQueryParams = {
  orderId: string,
  taskToken: string,
  isApproved: boolean
}

const client = new SFNClient();

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    
    const stringified = JSON.stringify(event.queryStringParameters);
    const queryParams: RequestQueryParams = JSON.parse(stringified);

    const command = new SendTaskSuccessCommand({
      output: JSON.stringify({
        isApproved: queryParams.isApproved,
        orderId: queryParams.orderId
      }),
      taskToken: queryParams.taskToken
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        requestId: response.$metadata.requestId
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