/* eslint-disable import/no-unresolved,no-unused-vars */
import ConditionAttribute from './condition-attribute';
import { FilterValue, FilterCondition } from './filter-conditions';
import { Key } from './base-model';
/* eslint-enable import/no-unresolved,no-unused-vars */

export default class FilterAttribute extends ConditionAttribute<FilterValue> {
  public eq(value: FilterValue): FilterCondition {
    return new FilterCondition(...super.prepareEq(value));
  }

  public gt(value: FilterValue): FilterCondition {
    return new FilterCondition(...super.prepareGt(value));
  }

  public ge(value: FilterValue): FilterCondition {
    return new FilterCondition(...super.prepareGe(value));
  }

  public lt(value: FilterValue): FilterCondition {
    return new FilterCondition(...super.prepareLt(value));
  }

  public le(value: FilterValue): FilterCondition {
    return new FilterCondition(...super.prepareLe(value));
  }

  public between(lower: Key, upper: Key): FilterCondition {
    return new FilterCondition(...super.prepareBetween(lower, upper));
  }

  public beginsWith(value: string): FilterCondition {
    return new FilterCondition(...super.prepareBeginsWith(value));
  }

  public neq(value: FilterValue): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return new FilterCondition(`#${id} <> :${id}`, attr, values);
  }

  public in(...values: FilterValue[]): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const val: Map<string, FilterValue> = new Map();
    attr.set(`#${id}`, this.field);
    values.forEach((value, idx) => {
      val.set(`:${id}${idx}`, value);
    });
    return new FilterCondition(`#${id} IN (${Array.from(val.keys()).join(',')})`, attr, val);
  }

  public null(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const values: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    values.set(':null', null);
    return new FilterCondition(`#${id} = :null`, attr, values);
  }

  public notNull(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const values: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    values.set(':null', null);
    return new FilterCondition(`#${id} <> :null`, attr, values);
  }

  public exists(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    return new FilterCondition(`attribute_exists(#${id})`, attr, new Map());
  }

  public notExists(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    return new FilterCondition(`attribute_not_exists(#${id})`, attr, new Map());
  }

  public contains(value: string): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return new FilterCondition(`contains(#${id}, :${id})`, attr, values);
  }

  public notContains(value: string): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return new FilterCondition(`NOT contains(#${id}, :${id})`, attr, values);
  }
}
