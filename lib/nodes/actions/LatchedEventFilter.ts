/**
 * Created by jpollak on 5/29/16.
 */
'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {EventFilter} from './EventFilter';

/** If the event matches the predicate function, call the child.
 *
 *  Otherwise return FAILURE (for use with a Selector).
 */
export class LatchedEventFilter<State> extends EventFilter<State> {

	constructor(prefix, child, elseResult) {
		super(`${prefix}-Latched`, child, elseResult);
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

	onEvent(state: State, event: Event): Promise<ResultCodes> {

		const nodeStorage = this.getNodeStorage(state);

		if (nodeStorage.latched) {
			return this.child.handleEvent(state, event)
			.then((result) => {
				if (result !== ResultCodes.RUNNING) {
					nodeStorage.latched = false;
				}

				return result;
			});

		} else {
			return super.onEvent(state, event)
			.then((result) => {
				if (result === ResultCodes.RUNNING) {
					nodeStorage.latched = true;
				}

				return result;
			});

		}

	}
}

module.exports = LatchedEventFilter;
