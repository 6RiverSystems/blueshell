import {BlueshellState} from '../BlueshellState';

import {resultCodes as rc, ResultCode} from '../../utils/resultCodes';
import {Decorator} from '../Decorator';

/**
 * !Node
 * Node returns `FAILURE` when the child returns `SUCCESS`.
 * Node returns `SUCCESS` when the child returns `FAILURE`.
 * Node returns `RUNNING` when the child returns `RUNNING`.
 * 1/12/16
 * @author Joshua Chaitin-Pollak
 */
export class Not<S extends BlueshellState, E> extends Decorator<S, E> {

	/**
	 * @override
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 */
	async onEvent(state: S, event: E): Promise<ResultCode> {
		const res = await this.child.handleEvent(state, event);

		switch (res) {
		case rc.SUCCESS:
			return rc.FAILURE;
		case rc.FAILURE:
			return rc.SUCCESS;
		default:
			return res;
		}
	}

	get symbol(): string {
		return '∼';
	}
}
