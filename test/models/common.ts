import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export default new DocumentClient({
  region: 'localhost',
  endpoint: `http://localhost:${process.env.LOCAL_DYNAMODB_PORT || 8000}`,
});

export interface CommonFields {
  number: number;
  bool: boolean;
  string: string;
  stringset: string[];
  list: Array<number | string>;
  stringmap: { [key: string]: string };
  optionalNumber?: number;
  optionalBool?: boolean;
  optionalString?: string;
  optionalStringset?: string[];
  optionalList?: Array<number | string>;
  optionalStringmap?: { [key: string]: string };
}
