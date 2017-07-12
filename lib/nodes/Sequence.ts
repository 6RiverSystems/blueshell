/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {Composite} from './Composite';
import {ResultCodes} from '../utils/ResultCodes';

export class Sequence extends Composite {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChild(state: any, event: any, i: number): Promise<ResultCodes> {

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

	_afterChild(res: ResultCodes, state: any, event: any) {
		return [res, state, event];
	}
}
