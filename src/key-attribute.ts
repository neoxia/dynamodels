/* eslint-disable import/no-unresolved,no-unused-vars */
import ConditionAttribute from './condition-attribute';
import { Key } from './base-model';
import { KeyCondition } from './key-conditions';
/* eslint-enable import/no-unresolved,no-unused-vars */

export default class KeyAttribute extends ConditionAttribute<Key> {
  public eq(value: Key): KeyCondition {
    return new KeyCondition(...super.prepareEq(value));
  }

  public gt(value: Key): KeyCondition {
    return new KeyCondition(...super.prepareGt(value));
  }

  public ge(value: Key): KeyCondition {
    return new KeyCondition(...super.prepareGe(value));
  }

  public lt(value: Key): KeyCondition {
    return new KeyCondition(...super.prepareLt(value));
  }

  public le(value: Key): KeyCondition {
    return new KeyCondition(...super.prepareLe(value));
  }

  public between(lower: Key, upper: Key): KeyCondition {
    return new KeyCondition(...super.prepareBetween(lower, upper));
  }

  public beginsWith(value: string): KeyCondition {
    return new KeyCondition(...super.prepareBeginsWith(value));
  }
}
