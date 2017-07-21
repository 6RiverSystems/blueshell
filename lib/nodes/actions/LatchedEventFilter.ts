/**
 * Created by jpollak on 5/29/16.
 */
'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from './Action';
import {EventFilter} from './EventFilter';

/** If the event matches the predicate function, call the child.
 *
 *  Otherwise return FAILURE (for use with a Selector).
 */
class LatchedEventFilter<State> extends EventFilter<State> {

	constructor(prefix: any, child: Action<State>, elseResult: ResultCodes) {
		super(`${prefix}-Latched`, child, elseResult);
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
		const nodeStorage = this.getNodeStorage(state);

		if (nodeStorage.latched) {
			return this.child.handleEvent(state)
			.then((result) => {
				if (result !== ResultCodes.RUNNING) {
					nodeStorage.latched = false;
				}

				return result;
			});

		} else {
			return super.onEvent(state)
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
