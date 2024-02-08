import {
  Handler
} from 'aws-lambda';
import { getProduct } from '../../common/helpers/dynamo-helper';
import { ProductsWithOrder } from '../../common/types/inputs-outputs/ProductsWithOrder';
import Product from '../../common/types/Product';

interface WorkflowEvent {
  productIds: string[]
}

type Response = {
  productIds?: string[],
  availableAfter?: number
} & ProductsWithOrder

export const handler: Handler = async (event: WorkflowEvent): Promise<Response> => {
  try {
    console.log(`Automated workflow starting with input ${JSON.stringify(event)}`);

    let productList: Product[] = [];
    for (let productId of event.productIds) {
      const product = await getProduct(productId);
      product && productList.push(product);
    }

    const notAvailable = productList.find((product) => !product.Available);
    if (notAvailable) {
      return {
        success: false,
        productIds: event.productIds,
        availableAfter: notAvailable.AvailableAfter
      }
    }

    return {
      success: true
    }
  }
  catch (error) {
    console.log(`Error! ${error}`);
    return {
      success: false
    }
  }
}