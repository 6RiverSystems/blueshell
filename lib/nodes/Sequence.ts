/**
 * Created by josh on 1/10/16.
 */
'use strict';

import ResultCodes = require('./../utils/ResultCodes');
import Composite = require('./Composite');

class Sequence extends Composite {

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
		.then((res) => {
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

}

export = Sequence;
