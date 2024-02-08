import {
  Handler,
  S3Event
} from 'aws-lambda';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { getObjectFromS3 } from './helpers/s3-helper';
import {
  streamToBuffer,
  retrieveDataFromWorkbook
} from './helpers/data-helper';
import { uploadProducts } from './helpers/dynamo-helper';

export const handler: Handler = async (event: S3Event) => {
  console.log(`Event received: ${JSON.stringify(event)}`);
  const { key, bucket } = getObjectData(event);

  const s3Response: GetObjectCommandOutput | undefined = await getObjectFromS3(key, bucket);
  const buffer = await streamToBuffer(s3Response?.Body);
  const rows = retrieveDataFromWorkbook(buffer);

  await uploadProducts(rows);

  console.log('Product data uploaded successfully!');
}

const getObjectData = (event: S3Event): { key: string, bucket: string } => {
  const eventData = event.Records.at(0)?.s3;
  const key = eventData?.object.key ?? '';
  const bucket = eventData?.bucket.name ?? '';

  return {
    key,
    bucket
  };
}