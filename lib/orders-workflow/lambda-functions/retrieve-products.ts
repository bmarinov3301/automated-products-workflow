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
      if (product != null) productList.push(product);
    }

    if (productList.length < 1) {
      return {
        success: false
      }
    }

    console.log(`Retrieved product list: ${JSON.stringify(productList)}`);
    const notAvailable = productList.find((p) => p.available === false);
    if (notAvailable) {
      return {
        success: true,
        productIds: event.productIds,
        availableAfter: notAvailable.availableAfter
      }
    }

    return {
      success: true,
      products: productList
    }
  }
  catch (error) {
    console.log(`Error! ${error}`);
    return {
      success: false
    }
  }
}