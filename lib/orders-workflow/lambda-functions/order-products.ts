import { Handler } from 'aws-cdk-lib/aws-lambda';
import { OrderTotal } from '../../common/types/OrderTotal';
import { getOrder, completeOrder } from '../../common/helpers/dynamo-helper';


export const handler: Handler = async (event: OrderTotal): Promise<void> => {

  try {
    const order = await getOrder(event.orderId);
    if (!order) {
      console.log(`No order found in orders-table with order id ${event.orderId}`);
    } else {
      const orderId = await completeOrder(order.orderId);
      console.log(`Product order complete! Order ID - ${order.orderId}, total amount - `);
    }
  } catch (error) {
    console.log(`Error! ${error}`);
  }
}