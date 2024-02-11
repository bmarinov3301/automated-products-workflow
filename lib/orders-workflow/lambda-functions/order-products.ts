import { Handler } from 'aws-cdk-lib/aws-lambda';
import { OrderTotal } from '../../common/types/OrderTotal';


export const handler: Handler = async (event: OrderTotal): Promise<void> => {
  console.log(`Product order complete! Order ID - ${event.orderId}, total amount - ${event.totalPrice}`);
}