import {BlueshellState} from "../nodes/BlueshellState";

// @@@ probably a better way to do this than a global
let treePublisher: TreePublisher<BlueshellState, any>;

export interface TreePublisher<S extends BlueshellState, E> {
	publishTree(state: S, event: E): void;
	configure(options: object): void;
}

export function registerTreePublisher<S extends BlueshellState, E>(publisher: TreePublisher<S, E>): void {
	treePublisher = publisher;
}

export function publishTree<S extends BlueshellState, E>(state: S, event: E) {
	if (!!treePublisher) {
		treePublisher.publishTree(state, event);
	}
}
