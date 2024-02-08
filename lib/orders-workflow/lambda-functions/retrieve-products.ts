import {
  Handler
} from 'aws-lambda';

interface WorkflowEvent {
  productIds: string[]
}

export const handler: Handler = async (event: WorkflowEvent): Promise<void> => {
  console.log(`Automated workflow starting with input ${JSON.stringify(event)}`);
}