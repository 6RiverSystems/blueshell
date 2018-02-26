import {BlueshellState} from './BlueshellState';
import {Base} from './Base';
import {Composite} from './Composite';

export class Decorator<S extends BlueshellState, E> extends Composite<S, E> {

	constructor(name: string, child: Base<S, E>) {
		super(name, [child]);
	}

	get child() {
		return this.children[0];
	}

	onEvent(state: S, event: E): Promise<string> {
		// Passthrough
		return this.child.handleEvent(state, event);
	}
}
