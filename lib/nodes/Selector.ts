/**
 * Created by josh on 1/18/16.
 */
'use strict';

import {Composite} from './Composite';
import {ResultCodes} from './../utils/ResultCodes';

export class Selector extends Composite {

	// Recursively sends the event to each child until one of them returns
	// success or running. If we exhaust all the children, return failure.
	handleChild(state: any, event: any, i: number): Promise<ResultCodes> {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return Promise.resolve(ResultCodes.FAILURE);
		}

		let child = this.children[i];

		return child.handleEvent(state, event)
		.then(res => this._afterChild(res, state, event))
		.then(([res, state_, event_]) => {
			if (res !== ResultCodes.FAILURE) {

				if (this.latched && res === ResultCodes.RUNNING) {
					storage.running = i;
				}

				return res;
			} else {
				return this.handleChild(state, event, ++i);
			}
		});
	}

	_afterChild(res: ResultCodes, state: any, event: any) {
		return [res, state, event];
	}
}
