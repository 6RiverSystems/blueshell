'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Decorator} from '../Decorator';

export class Not<State> extends Decorator<State> {

	onEvent(state: State): Promise<ResultCodes> {

		return this.child.handleEvent(state)
			.then(res => {
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
