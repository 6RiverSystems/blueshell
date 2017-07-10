/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {Decorator} from '../Decorator';
import {BehaviorCode} from '../../utils/ResultCodes';

export class Not extends Decorator {

	onRun(state: any): Promise<BehaviorCode> {

		let p = this.child.run(state);

		return p.then((res: BehaviorCode) => {
			switch (res) {
			case BehaviorCode.SUCCESS:
				res = BehaviorCode.FAILURE;
				break;
			case BehaviorCode.FAILURE:
				res = BehaviorCode.SUCCESS;
				break;
			default:
				// no-op
			}

			return res;
		});
	}
}
