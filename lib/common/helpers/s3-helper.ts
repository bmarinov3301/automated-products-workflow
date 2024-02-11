import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput
} from "@aws-sdk/client-s3";
import { region } from '../constants';

const client = new S3Client({
  region
});

export const getObjectFromS3 = async (key: string, bucket: string): Promise<GetObjectCommandOutput | undefined> => {
  const params: GetObjectCommandInput = {
    Bucket: bucket,
    Key: key
  }

  console.log(`Getting object with key ${key} from bucket ${bucket}...`)
  return await client.send(new GetObjectCommand(params));
}
