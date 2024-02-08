import {
  Handler
} from 'aws-lambda';
import { getProduct } from '../../common/helpers/dynamo-helper';
import { ProductsWithOrder } from '../../common/types/inputs-outputs/ProductsWithOrder';

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
    for (let productId of event.productIds) {
      const product = await getProduct(productId);
    }

    return {
      success: false
    }
  }
  catch (error) {
    console.log(`Error! ${error}`);
    return {
      success: false
    }
  }
}