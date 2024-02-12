import { SES } from 'aws-sdk';
import {
  region,
  senderEmail,
  recipientEmail,
  decisionEndpoint
} from '../constants';
import { SendEmailRequest } from 'aws-sdk/clients/ses';

const client = new SES({ region });

export const sendEmail = async (apiUrl: string, orderId: string, taskToken: string): Promise<void> => {
  console.log(`Sending order decision email for orderId ${orderId}...`);
  const params: SendEmailRequest = {
    Source: senderEmail,
    Destination: {
      ToAddresses: [
        recipientEmail
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `<p>Please click one of the following links for order decision:</p>
                  <p><b><a href="${apiUrl}${decisionEndpoint}?orderId=${orderId}&taskToken=${encodeURIComponent(taskToken)}&isApproved=true">Approve order</a></b></p>
                  <p><b><a href="${apiUrl}${decisionEndpoint}?orderId=${orderId}&taskToken=${encodeURIComponent(taskToken)}&isApproved=false">Reject order</a></b></p>`,
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: `Waiting for decision for order ${orderId}`
      }
    }
  }

  await client.sendEmail(params).promise();
}