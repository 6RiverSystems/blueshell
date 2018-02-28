/**
 * Created by josh on 1/10/16.
 */
import {Composite} from './Composite';
import {BlueshellState} from './BlueshellState';
import {resultCodes as rc} from '../utils/resultCodes';

export class Sequence<S extends BlueshellState, E> extends Composite<S, E> {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChild(state: S, event: E, i: number): string {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return rc.SUCCESS;
		}

		let child = this.children[i];

		const res = child.handleEvent(state, event);
		const {res: res_, state: state_, event: event_} =
			this._afterChild(res, state, event);

		if (res_ === rc.SUCCESS) {
			// Call the next child
			return this.handleChild(state_, event_, ++i);
		} else {
			if (this.latched && res_ === rc.RUNNING) {
				storage.running = i;
			}

			return res_;
		}
	}

	_afterChild(res: string, state: S, event: E) {
		return {res, state, event};
	}
}
