'use strict';

import {Action} from './Action';
import {Selector} from './Selector';

export class LatchedSelector<State> extends Selector<State> {

	constructor(name: string, children: Array<Action<State>>) {
		super(name, children, true);
	}

}
