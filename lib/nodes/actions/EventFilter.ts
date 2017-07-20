'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from './Action';
import {Decorator} from '../Decorator';

/** If the event matches the predicate function, call the child.
 *
 *  Otherwise return FAILURE (for use with a Selector).
 */
export class EventFilter<State, Event> extends Decorator<State, Event> {
	private elseResult: ResultCodes;

	constructor(prefix: string, child: Action<State, Event>, elseResult = ResultCodes.FAILURE) {
		super(`${prefix}-EventFilter`, child);

		this.elseResult = elseResult;
	}

	/* If true is returned, the filter accepts the event and the child is notified
	 * If false is returned, the filter rejects the event.
	 *
	 * @param {event} event Incoming Event
	 * @returns {boolean} true if event passes filter
	 */
	predicate(state: State, event: Event) {
		throw new Error('Unimplemented Predicate');
	}

	onEvent(state: State, event: Event) {

		if (this.predicate(state, event)) {
			return this.child.handleEvent(state, event);
		} else {
			return Promise.resolve(this.elseResult);
		}

	}
}

module.exports = EventFilter;
