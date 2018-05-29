import {Composite} from './Composite';
import {BlueshellState} from './BlueshellState';
import {resultCodes as rc} from '../utils/resultCodes';

/**
 * Sends an event to each child until one of the returns `FAILURE`, or `RUNNING`, then returns that value.
 * If all children return `SUCCESS`, return `SUCCESS`.
 * 1/10/16
 * @author Joshua Chaitin-Pollak
 */
export class Sequence<S extends BlueshellState, E> extends Composite<S, E> {
	/**
	 * Recursively executes children until one of them returns
	 * failure. If we call all the children successfully, return success.
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @param i The child index.
	 */
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

	/**
	 * @ignore
	 * @param res
	 * @param state
	 * @param event
	 */
	_afterChild(res: string, state: S, event: E) {
		return {res, state, event};
	}
}
