/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {Composite} from './Composite';
import {
	EventCode,
	BehaviorCode
} from '../utils/ResultCodes';

export class Sequence extends Composite {

	// Recursively executes children until one of them returns
	// failure. If we call all the children successfully, return success.
	handleChildBehavior(state: any, i: number): Promise<BehaviorCode> {
		let storage = this.getNodeStorage(state);

		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve(BehaviorCode.SUCCESS);
		}

		let child = this.children[i];

		return child.run(state)
			.then((res: BehaviorCode) => {
				if (res === BehaviorCode.SUCCESS) {
					// Call the next child
					return this.handleChildBehavior(state, ++i);
				} else {
					if (this.latched && res === BehaviorCode.RUNNING) {
						storage.running = i;
					}

					return res;
				}
			});
	}

}
