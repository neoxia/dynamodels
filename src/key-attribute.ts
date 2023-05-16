import ConditionAttribute from './condition-attribute';
import { KeyValue } from './base-model';
import { KeyCondition } from './key-conditions';

export default class KeyAttribute extends ConditionAttribute<KeyValue> {
  public eq(value: KeyValue): KeyCondition {
    return new KeyCondition(...super.prepareEq(value));
  }

  public gt(value: KeyValue): KeyCondition {
    return new KeyCondition(...super.prepareGt(value));
  }

  public ge(value: KeyValue): KeyCondition {
    return new KeyCondition(...super.prepareGe(value));
  }

  public lt(value: KeyValue): KeyCondition {
    return new KeyCondition(...super.prepareLt(value));
  }

  public le(value: KeyValue): KeyCondition {
    return new KeyCondition(...super.prepareLe(value));
  }

  public between(lower: KeyValue, upper: KeyValue): KeyCondition {
    return new KeyCondition(...super.prepareBetween(lower, upper));
  }

  public beginsWith(value: string): KeyCondition {
    return new KeyCondition(...super.prepareBeginsWith(value));
  }
}
