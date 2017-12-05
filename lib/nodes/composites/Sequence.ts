'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Composite} from './Composite';

export class Sequence<State> extends Composite<State> {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	protected runChild(state: State, i: number): Promise<ResultCodes> {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve(ResultCodes.SUCCESS);
		}

		let child = this.children[i];

		return child.run(state)
			.then(res => this.afterChild(res, state))
			.then(([res, state]: [ResultCodes, State]) => {
				if (res === ResultCodes.SUCCESS) {
					// Call the next child
					return this.runChild(state, ++i);
				} else {
					if (this.latched && res === ResultCodes.RUNNING) {
						storage.running = i;
					}

					return res;
				}
			});
	}

	private afterChild(res: ResultCodes, state: State) {
		return [res, state];
	}
}
