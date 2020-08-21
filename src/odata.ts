/* eslint-disable import/no-unresolved,no-unused-vars */
import {
  IFilterConditionOperators,
  FilterCondition,
  attr,
  FilterValue,
  not,
} from './filter-conditions';
import { KeyCondition } from './key-conditions';
import {
  eq,
  neq,
  ge,
  gt,
  le,
  lt,
  isIn,
  between,
  isNull,
  notNull,
  notExists,
  contains,
  notContains,
  beginsWith,
  exists,
} from './operators';
import { Key } from './base-model';
/* eslint-enable import/no-unresolved,no-unused-vars */

// TODO: Escape commas

export type ODataFilterOperators =
  | 'eq'
  | 'ne'
  | 'in'
  | 'le'
  | 'lt'
  | 'ge'
  | 'gt'
  | 'between'
  | 'not_null'
  | 'null'
  | 'exists'
  | 'not_exists'
  | 'contains'
  | 'not_contains'
  | 'begins_with';

export type ODataLogicalOperators = 'and' | 'or';

export type ODataOperator = ODataLogicalOperators | ODataFilterOperators;

export class ODataError extends Error {
  received: string;

  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, ODataError.prototype);
  }
}

export interface ODataParamaters {
  $index?: string;
  $query?: string | string[];
  $filter?: string | string[];
  $orderby?: string;
  $select?: string | string[];
  $skip?: string;
  $top?: string;
  $count?: string;
}

export interface ODataOptions {
  $index?: string;
  $query?: KeyCondition;
  $filter?: FilterCondition;
  $select?: string[];
  $orderby?: 'desc' | 'asc';
  $count?: boolean;
  $skip?: {pk: Key, sk?: Key};
  $top?: number;
}

interface IOperationMatcher {
  pattern: RegExp;
  operation: IFilterConditionOperators;
  operator: Function;
  queryCompatible?: boolean;
}

interface ILogicalMatcher {
  pattern: RegExp;
  operation: 'NOT' | 'OR' | 'AND';
}

const patterns: Array<IOperationMatcher> = [
  {
    pattern: /^eq\((.+), ?(.+)\)$/,
    operation: 'EQ',
    operator: eq,
    queryCompatible: true,
  },
  {
    pattern: /^ne\((.+), ?(.+)\)$/,
    operation: 'NE',
    operator: neq,
  },
  {
    pattern: /^ge\((.+), ?(.+)\)$/,
    operation: 'GE',
    operator: ge,
    queryCompatible: true,
  },
  {
    pattern: /^gt\((.+), ?(.+)\)$/,
    operation: 'GT',
    operator: gt,
    queryCompatible: true,
  },
  {
    pattern: /^le\((.+), ?(.+)\)$/,
    operation: 'LE',
    operator: le,
    queryCompatible: true,
  },
  {
    pattern: /^lt\((.+), ?(.+)\)$/,
    operation: 'LT',
    operator: lt,
    queryCompatible: true,
  },
  {
    pattern: /^in\((.+), ?\[(.+)\]\)$/,
    operation: 'IN',
    operator: isIn,
  },
  {
    pattern: /^between\((.+), ?(.+), ?(.+)\)$/,
    operation: 'BETWEEN',
    operator: between,
    queryCompatible: true,
  },
  {
    pattern: /^null\((.+), ?(.+)\)$/,
    operation: 'NULL',
    operator: isNull,
  },
  {
    pattern: /^not_null\((.+), ?(.+)\)$/,
    operation: 'NOT_NULL',
    operator: notNull,
  },
  {
    pattern: /^exists\((.+), ?\[(.+)\]\)$/,
    operation: 'EXISTS',
    operator: exists,
  },
  {
    pattern: /^not_exists\((.+), ?(.+), ?(.+)\)$/,
    operation: 'NOT_EXISTS',
    operator: notExists,
  },
  {
    pattern: /^contains\((.+), ?(.+)\)$/,
    operation: 'CONTAINS',
    operator: contains,
  },
  {
    pattern: /^not_contains\((.+), ?(.+)\)$/,
    operation: 'NOT_CONTAINS',
    operator: notContains,
  },
  {
    pattern: /^begins_with\((.+), ?(.+)\)$/,
    operation: 'BEGINS_WITH',
    operator: beginsWith,
    queryCompatible: true,
  },
];

const logicalPatterns: Array<ILogicalMatcher> = [
  {
    pattern: /^not\((.+)\)$/,
    operation: 'NOT',
  },
  {
    pattern: /^and\((.+), ?(.+)\)$/,
    operation: 'AND',
  },
  {
    pattern: /^or\((.+), ?(.+)\)$/,
    operation: 'OR',
  },
];

const getQueryArguments = (matches: RegExpMatchArray): Key[] =>
  matches.slice(2).map((arg) => {
    if (arg.startsWith("'") && arg.endsWith("'")) {
      return arg.substring(1, arg.length - 1);
    }
    if (!Number.isNaN(Number(arg))) {
      return Number(arg);
    }
    throw new ODataError(`Synthax Error: Invalid operand ${arg} (string must be in single quotes)`);
  });

const getFiltersArguments = (
  operation: IFilterConditionOperators,
  matches: RegExpMatchArray,
): FilterValue[] => {
  let args: string[];
  if (operation === 'IN') {
    const array = matches[2];
    const elts = array.match(/^\[(.+)\]$/);
    if (!elts) {
      throw new ODataError(
        "Synthax Error: IN operations take an array operand (e.g. ['value1', 'value2'])",
      );
    }
    args = elts[1].split(',');
  } else {
    args = matches.slice(2);
  }
  return args.map((arg) => {
    if (arg === 'true') {
      return true;
    }
    if (arg === 'false') {
      return false;
    }
    if (arg.startsWith("'") && arg.endsWith("'")) {
      return arg.substring(1, arg.length - 1);
    }
    if (!Number.isNaN(Number(arg))) {
      return Number(arg);
    }
    throw new ODataError(`Synthax Error: Invalid operand ${arg} (string must be in single quotes)`);
  });
};

const toCondition = (expression: string, filter = false): FilterCondition | KeyCondition => {
  const operation = patterns.find((p) => expression.match(p.pattern));
  if (!operation) {
    throw new ODataError(`Synthax Error: Invalid operand ${expression}`);
  }
  if (!filter && !operation.queryCompatible) {
    throw new ODataError(
      `Synthax Error: Operator cannot be used for key condition ${operation.operator}`,
    );
  }
  const operands = expression.match(operation.pattern);
  const attribute = attr(operands[1]);
  return operation.operator.apply(
    attribute,
    filter ? getFiltersArguments(operation.operation, operands) : getQueryArguments(operands),
  );
};

const toKeyCondition = (expression: string): KeyCondition =>
  toCondition(expression) as KeyCondition;

const toFilterCondition = (expression: string): FilterCondition =>
  toCondition(expression, true) as FilterCondition;

const parseFilterExpression = (expression: string): FilterCondition => {
  const logical = logicalPatterns.find((lp) => expression.match(lp.pattern));
  if (!logical) {
    return toFilterCondition(expression);
  }
  const operands = expression.match(logical.pattern).slice(1);
  if (logical.operation === 'NOT') {
    return not(toFilterCondition(operands[0]));
  }
  if (logical.operation === 'OR') {
    return toFilterCondition(operands[0]).or(toFilterCondition(operands[1]));
  }
  if (logical.operation === 'AND') {
    return toFilterCondition(operands[0]).and(toFilterCondition(operands[1]));
  }
  throw new ODataError('Invalid filter expression');
};

export const toOptions = (params: ODataParamaters): ODataOptions => {
  const odata: ODataOptions = {};
  if (params.$index) {
    odata.$index = params.$index;
  }
  if (params.$query) {
    const queries = Array.isArray(params.$query) ? params.$query : [params.$query];
    if (queries.length > 2) {
      const error = new ODataError(
        'Invalid $query: should have only two conditions including one eq condition on hash key',
      );
      error.received = params.$query.toString();
      throw error;
    }
    if (queries.length === 1) {
      odata.$query = toKeyCondition(queries[0]);
    }
    if (queries.length === 2) {
      odata.$query = toKeyCondition(queries[0]).and(toKeyCondition(queries[1]));
    }
  }
  if (params.$count) {
    if (['true', 'false'].includes(params.$count)) {
      const error = new ODataError('$count is not a valid boolean');
      error.received = params.$count;
      throw error;
    }
    odata.$count = params.$count === 'true';
  }
  if (params.$orderby) {
    if (['asc', 'desc'].includes(params.$orderby)) {
      const error = new ODataError('$orderby is not a valid value (asc, desc)');
      error.received = params.$orderby;
      throw error;
    }
    odata.$orderby = params.$orderby as 'asc' | 'desc';
  }
  if (params.$select) {
    odata.$select = Array.isArray(params.$select) ? params.$select : [params.$select];
  }
  if (params.$filter) {
    const filters = Array.isArray(params.$filter) ? params.$filter : [params.$filter];
    odata.$filter = parseFilterExpression(filters[0]);
    if (filters.length > 2) {
      for (let i = 1; i < filters.length; i += 1) {
        odata.$filter = odata.$filter.and(parseFilterExpression(filters[i]));
      }
    }
  }
  if (params.$top) {
    if (!Number.isInteger(Number(params.$top))) {
      const error = new ODataError('$top is not a valid integer');
      error.received = params.$top;
      throw error;
    }
    odata.$top = Number(params.$top);
  }
  if (params.$skip) {
    const skip = params.$skip.split(',');
    if (skip.length > 2) {
      throw new ODataError(`Synthax Error: Invalid exclusive start key ${skip}`);
    }
    odata.$skip = {
      pk: skip[0],
      sk: skip[1],
    };
  }
  return odata;
};
