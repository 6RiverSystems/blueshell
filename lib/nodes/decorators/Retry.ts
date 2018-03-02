'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {Decorator} from './Decorator';

export class Retry<State> extends Decorator<State> {

	private numRepeats: number;

	constructor(child: Base<State>, numRepeats: number) {
		super(`Retry-${numRepeats}`, child);
		this.numRepeats = numRepeats;
	}

	onRun(state: State): Promise<ResultCodes> {

		return this.child.onRun(state)
			.then(res => {
				// Get the node storage
				let nodeStorage = this.getNodeStorage(state);
				if (!nodeStorage.repeats) {
					nodeStorage.repeats = 0;
				}
				if (res == ResultCodes.FAILURE
					&& (this.numRepeats < 0
					|| nodeStorage.repeats < this.numRepeats)) {
					nodeStorage.repeats++;
					return this.onRun(state);
				} else {
					if (res == ResultCodes.SUCCESS) {
						nodeStorage.repeats = 0;
					}
					return res;
				}
			});
	}
}
