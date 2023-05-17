import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export default DynamoDBDocumentClient.from(
  new DynamoDBClient({
    credentials: {
      accessKeyId: '$fake',
      secretAccessKey: '$fake',
    },
    region: 'local',
    endpoint: `http://${process.env.LOCAL_DYNAMODB_HOST}:${process.env.LOCAL_DYNAMODB_PORT || 8000}`,
  }),
  { marshallOptions: { removeUndefinedValues: true } },
);

export type CommonFields = {
  number: number | null;
  bool: boolean | null;
  string: string | null;
  stringset: string[] | null;
  list: Array<number | string> | null;
  stringmap: { [key: string]: string } | null;
  optionalNumber?: number | undefined;
  optionalBool?: boolean | undefined;
  optionalString?: string | undefined;
  optionalStringset?: string[] | undefined;
  optionalList?: Array<number | string> | undefined;
  optionalStringmap?: { [key: string]: string } | undefined;
};
