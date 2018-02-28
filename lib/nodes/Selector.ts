/**
 * Created by josh on 1/18/16.
 */
import {Composite} from './Composite';
import {BlueshellState} from './BlueshellState';

import {resultCodes as rc} from '../utils/resultCodes';

export class Selector<S extends BlueshellState, E> extends Composite<S, E> {

	// Recursively sends the event to each child until one of them returns
	// success or running. If we exhaust all the children, return failure.
	handleChild(state: S, event: E, i: number): string {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return rc.FAILURE;
		}

		let child = this.children[i];

		const res = child.handleEvent(state, event);

		const {res: res_, state: state_, event: event_} =
			this._afterChild(res, state, event);

		if (res_ !== rc.FAILURE) {

			if (this.latched && res_ === rc.RUNNING) {
				storage.running = i;
			}

			return res_;
		} else {
			return this.handleChild(state_, event_, ++i);
		}
	}

	_afterChild(res: string, state: S, event: E) {
		return {res, state, event};
	}
}
