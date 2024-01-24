import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { clearTables } from './hooks/create-tables';
import * as modelApi from '../src/base-model';
import SSMParamModel from './models/ssm-param';

jest.mock('@aws-sdk/client-ssm');

describe('fetchTableName', () => {
    afterEach(async () => {
        jest.clearAllMocks();
    });
    test('should throw an error', async () => {
        const mockSend = jest.fn();
        SSMClient.prototype.send = mockSend;
        mockSend.mockRejectedValueOnce(new Error());
        try {
            await modelApi.fetchTableName('arn:aws:ssm:us-east-1:617599655210:parameter/tableName');
        } catch (e) {
            expect((e as Error).message.includes('Invalid SSM Parameter')).toBe(true);
        }
    });
    test('should fetch tableName from SSM parameter store', async () => {
        const mockSend = jest.fn();
        mockSend.mockResolvedValueOnce({ Parameter: { Value: 'table_test_hashkey' } });
        SSMClient.prototype.send = mockSend;
        const tableName = await modelApi.fetchTableName('arn:aws:ssm:us-east-1:617599655210:parameter/tableName');
        expect(GetParameterCommand).toHaveBeenCalledWith({ Name: 'tableName' });
        expect(mockSend).toHaveBeenCalledWith(expect.any(GetParameterCommand));
        expect(tableName).toEqual('table_test_hashkey');
    });
    test('should return the provided tableName', async () => {
        const mockSend = jest.fn();
        SSMClient.prototype.send = mockSend;
        const mockResponse = { Parameter: { Value: 'table_test_hashkey' } };
        mockSend.mockResolvedValueOnce(mockResponse);
        const tableName = await modelApi.fetchTableName('tableName');
        expect(mockSend).not.toHaveBeenCalled();
        expect(GetParameterCommand).not.toHaveBeenCalled();
        expect(tableName).toEqual('tableName');
    });
});

describe('SSM parameter ARN', () => {
    const item = {
        hashkey: 'bar',
        string: 'whatever',
        stringmap: { foo: 'bar' },
        stringset: ['bar, bar'],
        number: 43,
        bool: true,
        list: ['foo', 42],
    };
    beforeEach(async () => {
        const mockSend = jest.fn();
        mockSend.mockResolvedValueOnce({ Parameter: { Value: 'table_test_hashkey' } });
        SSMClient.prototype.send = mockSend;
        await clearTables();
    });
    afterEach(async () => {
        jest.clearAllMocks();
    });
    test('Should fetch tableName and save the item', async () => {
        const model = new SSMParamModel();
        await model.save(item);
        const saved = await model.get('bar');
        expect(saved).toEqual(item);
    });
    test('Should fetch tableName once and cache its value for subsequent requests', async () => {
        jest.spyOn(modelApi, 'fetchTableName');
        const model = new SSMParamModel();
        await model.save(item);
        await model.save(item);
        expect(modelApi.fetchTableName).toHaveBeenCalledTimes(1);
    });
});
