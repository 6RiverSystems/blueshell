'use strict';

import {Event} from './';

export interface Conditional<State> {
	(state: State, event: Event): boolean;
}
