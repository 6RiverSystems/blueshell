'use strict';

export interface Conditional<State> {
	(state: State): boolean;
}
