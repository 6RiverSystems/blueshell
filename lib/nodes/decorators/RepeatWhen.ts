'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {Decorator} from './Decorator';

//TODO: This is stupid - might as well pass state and event as well
export interface ResultConditional {
	(result: ResultCodes): boolean;
}

export class RepeatWhen<State> extends Decorator<State> {

	private conditional: ResultConditional;

	constructor(desc: string, child: Base<State>, conditional: ResultConditional) {
		super('RepeatWhen-' + desc, child);
		this.conditional = conditional;
	}

	onRun(state: State): Promise<ResultCodes> {

		let p = this.child.onRun(state);

		return p.then(res => {
			if (this.conditional(res)) {
				return this.onRun(state);
			} else {
				return res;
			}
		});
	}
}
