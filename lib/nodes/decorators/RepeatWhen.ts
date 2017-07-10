/**
 * Created by josh on 1/12/16.
 */
'use strict';

import {Decorator} from '../Decorator';
import {Base} from '../Base';
import {BehaviorCode} from '../../utils/ResultCodes';

//TODO: This is stupid - might as well pass state and event as well
export interface ResultConditional {
	(result: BehaviorCode): boolean;
}

export class RepeatWhen extends Decorator {
	conditional: ResultConditional;

	constructor(desc: string, child: Base, conditional: ResultConditional) {
		super('RepeatWhen-' + desc, child);
		this.conditional = conditional;
	}

	onRun(state: any): Promise<BehaviorCode> {
		return this.child.run(state)
			.then((res: BehaviorCode) => {
				if (this.conditional(res)) {
					return this.run(state);
				} else {
					return res;
				}
		});
	}
}
