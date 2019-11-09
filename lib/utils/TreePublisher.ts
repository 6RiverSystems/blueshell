import {BlueshellState} from '../nodes/BlueshellState';

// @@@ probably a better way to do this than a global
let treePublisher: TreePublisher<BlueshellState, any>;

export interface TreePublisher<S extends BlueshellState, E> {
	maybePublishTree(state: S, event: E, topLevel: boolean): void;
	configure(options: object): void;
}

export function registerTreePublisher<S extends BlueshellState, E>(publisher: TreePublisher<S, E>): void {
	treePublisher = publisher;
}

// toplevel is handleEvent cadence of publishing
export function maybePublishTree<S extends BlueshellState, E>(state: S, event: E, topLevel: boolean) {
	if (!!treePublisher) {
		treePublisher.maybePublishTree(state, event, topLevel);
	}
}
