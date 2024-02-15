import { HashKeyEntity } from "./hashkey";
import documentClient from './common';
;
import Model from "../../src/base-model";
export default class SSMParamModel extends Model<HashKeyEntity> {
    protected tableName = 'arn:aws:ssm:us-east-1:617599655210:parameter/tableName';

    protected pk = 'hashkey';

    protected documentClient = documentClient;
}