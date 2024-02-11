import { Handler } from 'aws-lambda';
import { OrderTotal } from '../../common/types/OrderTotal';

type FunctionEvent = {
  taskToken: string
} & OrderTotal

export const handler: Handler = async (event: FunctionEvent): Promise<void> => {
  console.log(`Event received: ${JSON.stringify(event)}`);
}