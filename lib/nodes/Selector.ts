'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Composite} from './Composite';

export class Selector<State> extends Composite<State> {

	// Recursively sends the event to each child until one of them returns
	// success or running. If we exhaust all the children, return failure.
	handleChild(state: State, i: number): Promise<ResultCodes> {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return Promise.resolve(ResultCodes.FAILURE);
		}

		let child = this.children[i];

		return child.handleEvent(state)
		.then(res => this._afterChild(res, state))
		.then(([res, state]: [ResultCodes, State]) => {
			if (res !== ResultCodes.FAILURE) {

				if (this.latched && res === ResultCodes.RUNNING) {
					storage.running = i;
				}

				return res;
			} else {
				return this.handleChild(state, ++i);
			}
		});
	}

	_afterChild(res: ResultCodes, state: State) {
		return [res, state];
	}
}
