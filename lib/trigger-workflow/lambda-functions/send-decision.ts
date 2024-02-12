import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        queryParameters: event.queryStringParameters,
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