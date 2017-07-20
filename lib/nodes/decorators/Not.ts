'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Decorator} from '../Decorator';

export class Not<State, Event> extends Decorator<State, Event> {

	onEvent(state: State, event: Event): Promise<ResultCodes> {

		return this.child.handleEvent(state, event)
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
