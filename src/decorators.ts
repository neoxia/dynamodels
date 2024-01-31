import "reflect-metadata";
import joi from 'joi';
import ValidationError from "./validation-error";

const itemParamMetadataKey = Symbol("ItemParam");
const itemPropertyKey = Symbol("ItemProperty");
const pkKey = Symbol('PK');
const skKey = Symbol('SK');

export function hashKey(target: any, key: string) {
    Reflect.defineProperty(target, key, {
        get: function () {
            return this[pkKey];
        },
        set: function (newVal: string) {
            this[pkKey] = newVal
        }
    })
}

export function rangeKey(target: any, key: string) {
    Reflect.defineProperty(target, key, {
        get: function () {
            return this[skKey];
        },
        set: function (newVal: string) {
            this[skKey] = newVal
        }
    })
}

export function item(target: any, key: string) {
    Reflect.defineProperty(target, key, {
        get: function () {
            const pk = this[pkKey]
            const sk = this[skKey]
            const item = this[itemPropertyKey];
            validateSchema(pk, sk, item);
            return item;
        },
        set: function (newVal: unknown) {
            this[itemPropertyKey] = newVal;
        }
    })
}

export function validItem(
    target: any,
    propertyKey: string,
    parameterIndex: number
) {
    const existingParameters: number[] =
        Reflect.getOwnMetadata(itemParamMetadataKey, target, propertyKey) || [];
    existingParameters.push(parameterIndex);
    Reflect.defineMetadata(
        itemParamMetadataKey,
        existingParameters,
        target,
        propertyKey
    );
}

export function validate(
    target: any,
    propertyName: string,
    descriptor: any
) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
        const pk = this[pkKey]
        const sk = this[skKey]
        const parameters: number[] = Reflect.getOwnMetadata(
            itemParamMetadataKey,
            target,
            propertyName
        );
        if (parameters) {
            for (const parameter of parameters) {
                validateSchema(pk, sk, args[parameter]);
            }
        }
        return original.apply(this, args);
    };
}

function validateSchema(pk: string | undefined, sk: string | undefined, item: unknown) {
    if (!pk) {
        throw new Error('Model error: hash key is not defined on this Model');
    }
    const schema = joi.object().keys({
        [pk]: joi.required(),
        ...(!!sk && { [sk]: joi.required() })
    }).options({ allowUnknown: true })
    const { error } = schema.validate(item);
    if (error) {
        throw new ValidationError('Validation error', error);
    }
}