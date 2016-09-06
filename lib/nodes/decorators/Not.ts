/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {Decorator} from '../Decorator';
import {ResultCodes} from '../../utils/ResultCodes';

export class Not extends Decorator {

	onEvent(state: any, event: any): Promise<ResultCodes> {

		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			switch (res) {
			case ResultCodes.SUCCESS:
				res = ResultCodes.FAILURE;
				break;
			case ResultCodes.FAILURE:
				res = ResultCodes.SUCCESS;
				break;
			default:
				// no-op
			}

			return res;
		});
	}
}
