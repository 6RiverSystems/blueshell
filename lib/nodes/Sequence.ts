/**
 * Created by josh on 1/10/16.
 */
import {Composite} from './Composite';
import {BlueshellState} from './BlueshellState';
import {resultCodes as rc} from '../utils/resultCodes';

export class Sequence<S extends BlueshellState, E> extends Composite<S, E> {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChild(state: S, event: E, i: number): Promise<string> {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve(rc.SUCCESS);
		}

		let child = this.children[i];

		return child.handleEvent(state, event)
		.then(res => this._afterChild(res, state, event))
		.then(({res, state: state_, event: event_}) => {
			if (res === rc.SUCCESS) {
				// Call the next child
				return this.handleChild(state_, event_, ++i);
			} else {
				if (this.latched && res === rc.RUNNING) {
					storage.running = i;
				}

				return res;
			}
		});
	}

	_afterChild(res: string, state: S, event: E) {
		return {res, state, event};
	}
}
