import {BlueshellState} from '../BlueshellState';

import {resultCodes as rc} from '../../utils/resultCodes';
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
	onEvent(state: S, event: E): Promise<string> {
		let p = this.child.handleEvent(state, event);

		return p.then((res: string) => {
			switch (res) {
			case rc.SUCCESS:
				res = rc.FAILURE;
				break;
			case rc.FAILURE:
				res = rc.SUCCESS;
				break;
			default:
				// no-op
			}

			return res;
		});
	}
}
