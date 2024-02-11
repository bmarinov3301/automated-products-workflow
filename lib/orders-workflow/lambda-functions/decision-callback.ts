import { Handler } from 'aws-lambda';
import { OrderTotal } from '../../common/types/OrderTotal';


export const handler: Handler = async (event: OrderTotal): Promise<void> => {
  console.log('Waiting for order decision...');
}