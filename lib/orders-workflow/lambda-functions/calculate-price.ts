import { Handler } from 'aws-cdk-lib/aws-lambda';
import { Order } from '../../common/types/Order';
import { OrderTotal } from '../../common/types/OrderTotal';


export const handler: Handler = async (event: Order): Promise<OrderTotal> => {
  const totalPrice = event.products.reduce((total, product) => total + product.price, 0);

  console.log(`Calculated price: ${totalPrice}`);
  return {
    orderId: event.orderId,
    totalPrice
  }
}