'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Composite} from './Composite';

export class Sequence<State, Event> extends Composite<State, Event> {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChild(state: State, event: Event, i: number): Promise<ResultCodes> {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve(ResultCodes.SUCCESS);
		}

		let child = this.children[i];

		return child.handleEvent(state, event)
			.then(res => this._afterChild(res, state, event))
			.then(([res, state_, event_]) => {
			if (res === ResultCodes.SUCCESS) {
				// Call the next child
				return this.handleChild(state, event, ++i);
			} else {
				if (this.latched && res === ResultCodes.RUNNING) {
					storage.running = i;
				}

				return res;
			}
		});
	}

	_afterChild(res: ResultCodes, state: State, event: any) {
		return [res, state, event];
	}
}
