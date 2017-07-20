'use strict';

export interface Conditional<State, Event> {
	(state: State, event: Event): boolean;
}
