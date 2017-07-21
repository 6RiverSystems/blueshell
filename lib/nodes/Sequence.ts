'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Composite} from './Composite';

export class Sequence<State> extends Composite<State> {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChild(state: State, i: number): Promise<ResultCodes> {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve(ResultCodes.SUCCESS);
		}

		let child = this.children[i];

		return child.handleEvent(state)
			.then(res => this._afterChild(res, state))
			.then(([res, state]: [ResultCodes, State]) => {
				if (res === ResultCodes.SUCCESS) {
					// Call the next child
					return this.handleChild(state, ++i);
				} else {
					if (this.latched && res === ResultCodes.RUNNING) {
						storage.running = i;
					}

					return res;
				}
			});
	}

	_afterChild(res: ResultCodes, state: State) {
		return [res, state];
	}
}
