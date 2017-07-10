/**
 * Created by josh on 1/18/16.
 */
'use strict';

import {Composite} from './Composite';
import {
	EventCode,
	BehaviorCode
} from './../utils/ResultCodes';

export class Selector extends Composite {

	// Recursively sends the event to each child until one of them returns
	// success or running. If we exhaust all the children, return failure.
	handleChildBehavior(state: any, i: number): Promise<BehaviorCode> {
		let storage: any = this.getNodeStorage(state);

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return Promise.resolve(BehaviorCode.ERROR);
		}

		let child = this.children[i];

		return child.run(state)
			.then((res: BehaviorCode) => {
				if (res !== BehaviorCode.ERROR) {

					if (this.latched && res === BehaviorCode.RUNNING) {
						storage.running = i;
					}

					return res;
				} else {
					return this.handleChildBehavior(state, ++i);
				}
			});
	}

}
