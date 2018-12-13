import {Composite} from './Composite';
import {BlueshellState} from './BlueshellState';

import {resultCodes as rc, ResultCode} from '../utils/resultCodes';

/**
 * Selector Node (a.k.a. Fallback)
 * Sends an event to each child until one of them returns `SUCCESS` or `RUNNING`, then returns that value.
 * If all children return `FAILURE`, then this node returns `FAILURE`.
 * 1/18/16
 * @author Joshua Chaitin-Pollak
 */
export class Selector<S extends BlueshellState, E> extends Composite<S, E> {
	/**
	 * Recursively sends the event to each child until one of them returns
	 * success or running. If we exhaust all the children, return failure.
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @param i The child index.
	 */
	async handleChild(state: S, event: E, i: number): Promise<ResultCode> {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return rc.FAILURE;
		}

		let child = this.children[i];

		const res = await child.handleEvent(state, event);
		const {res: res_, state: state_, event: event_} = await this._afterChild(res, state, event);
		if (res_ !== rc.FAILURE) {

			if (this.latched && res_ === rc.RUNNING) {
				storage.running = i;
			}

			return res_;
		} else {
			return this.handleChild(state_, event_, ++i);
		}
	}

	/**
	 * @ignore
	 * @param res
	 * @param state
	 * @param event
	 */
	_afterChild(res: ResultCode, state: S, event: E) {
		return {res, state, event};
	}

	get symbol(): string {
		return '∣';
	}
}
