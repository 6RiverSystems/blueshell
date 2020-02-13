/**
 * Created by jpollak on 3/23/16.
 */
import {BlueshellState, BaseNode} from '../models';
import {serializeArchyTree} from './archyTree';
import {serializeDotTree} from './dotTree';

export function toString<S extends BlueshellState, E>(
	tree: BaseNode<S, E>, state?: S, contextDepth = Number.MAX_SAFE_INTEGER
): string {
	return serializeArchyTree(tree, state, contextDepth);
}

export function toConsole<S extends BlueshellState, E>(
	tree: BaseNode<S, E>, state?: S, contextDepth = Number.MAX_SAFE_INTEGER
) {
	console.log(toString(tree, state, contextDepth)); // eslint-disable-line no-console
}

export function toDotString<S extends BlueshellState, E>(tree: BaseNode<S, E>, state?: S) {
	return serializeDotTree(tree, state);
}

export function toDotConsole<S extends BlueshellState, E>(tree: BaseNode<S, E>, state?: S) {
	console.log(toDotString(tree, state)); // eslint-disable-line no-console
}
