'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from './Action';
import {Decorator} from '../Decorator';

/** If the event matches the predicate function, call the child.
 *
 *  Otherwise return FAILURE (for use with a Selector).
 */
export class EventFilter<State> extends Decorator<State> {
	private elseResult: ResultCodes;

	constructor(prefix: string, child: Action<State>, elseResult = ResultCodes.FAILURE) {
		super(`${prefix}-EventFilter`, child);

		this.elseResult = elseResult;
	}

	/* If true is returned, the filter accepts the event and the child is notified
	 * If false is returned, the filter rejects the event.
	 *
	 * @param {event} event Incoming Event
	 * @returns {boolean} true if event passes filter
	 */
	predicate(state: State) {
		throw new Error('Unimplemented Predicate');
	}

	onEvent(state: State) {

		if (this.predicate(state)) {
			return this.child.handleEvent(state);
		} else {
			return Promise.resolve(this.elseResult);
		}

	}
}

module.exports = EventFilter;
