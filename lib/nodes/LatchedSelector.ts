'use strict';

import {Action} from './actions/Action';
import {Selector} from './Selector';

export class LatchedSelector<State, Event> extends Selector<State, Event> {

	constructor(name: string, children: Array<Action<State, Event>>) {
		super(name, children, true);
	}

}
