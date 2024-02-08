import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Approving order...');
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