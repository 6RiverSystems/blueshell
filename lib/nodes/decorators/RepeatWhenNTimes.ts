'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {Decorator} from './Decorator';

export interface ResultConditional {
	(result: ResultCodes): boolean;
}

export class RepeatWhenNTimes<State> extends Decorator<State> {

	private conditional: ResultConditional;
	private numRepeats: number;

	constructor(desc: string, child: Base<State>, conditional: ResultConditional, numRepeats: number) {
		super(`RepeatWhen${numRepeats}Times-${desc}`, child);
		this.conditional = conditional;
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
				if (this.conditional(res)
					&& (this.numRepeats < 0
					|| nodeStorage.repeats < this.numRepeats)) {
					nodeStorage.repeats++;
					return this.onRun(state);
				} else {
					nodeStorage.repeats = 0;
					return res;
				}
			});
	}
}
