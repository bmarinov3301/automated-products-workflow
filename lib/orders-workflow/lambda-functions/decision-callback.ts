import { Handler } from 'aws-lambda';
import { OrderTotal } from '../../common/types/OrderTotal';
import { sendEmail } from '../../common/helpers/email-helper';
import { env } from 'process';

type FunctionEvent = {
  taskToken: string,
  isApproved?: boolean
} & OrderTotal

export const handler: Handler = async (event: FunctionEvent): Promise<void> => {
  console.log(`Event received: ${JSON.stringify(event)}`);
  const apiUrl = env.apiUrl ?? '';

  await sendEmail(apiUrl, event.orderId, event.taskToken);
}