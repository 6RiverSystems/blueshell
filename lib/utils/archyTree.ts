import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';

import * as archy from 'archy';
import {Data} from 'archy';
import {
	NodeStateVisitor,
	OnPathAnalysis,
	InContextAnalysis,
	NodeAnalysis,
	NodeVisitor,
	StatelessAnalysis,
} from './NodeVisitor';

type ArchyResult = Required<archy.Data>|undefined;

export class ArchyStatelessVisitor<S extends BlueshellState, E> extends NodeVisitor<S, E, ArchyResult> {
	protected visitStateless(analysis: StatelessAnalysis<S, E, ArchyResult>): ArchyResult {
		const label = (analysis.name !== analysis.nodeType) ?
			`${analysis.name} (${analysis.nodeType})` :
			analysis.name;
		const nodes: Required<archy.Data>[] = [];
		for ( const node of analysis.visitChildren() ) {
			if (node !== undefined) {
				nodes.push(node);
			}
		}
		return {label, nodes};
	}
}

export class ArchyVisitor<S extends BlueshellState, E> extends NodeStateVisitor<S, E, ArchyResult> {
	protected visitOnPath(analysis: OnPathAnalysis<S, E, ArchyResult>): Required<archy.Data> | undefined {
		const label = (analysis.name !== analysis.nodeType) ?
			`${analysis.name} (${analysis.nodeType}) => ${analysis.lastResult}` :
			`${analysis.name} => ${analysis.lastResult}`;
		const nodes: Required<archy.Data>[] = [];
		for ( const node of analysis.visitChildren() ) {
			if (node !== undefined) {
				nodes.push(node);
			}
		}
		return {label, nodes};
	}
	protected visitInContext(analysis: InContextAnalysis<S, E, ArchyResult>): Required<archy.Data> | undefined {
		const label = (analysis.name !== analysis.nodeType) ?
			`${analysis.name} (${analysis.nodeType})` :
			analysis.name;
		const nodes: Required<archy.Data>[] = [];
		for ( const node of analysis.visitChildren() ) {
			if (node !== undefined) {
				nodes.push(node);
			}
		}
		return {label, nodes};
	}
	protected visitEdgeOfContext(analysis: NodeAnalysis<S, E>): Required<archy.Data> | undefined {
		const label = '...';
		const nodes: Required<archy.Data>[] = [];
		return {label, nodes};
	}
	protected visitOutOfContext(analysis: NodeAnalysis<S, E>): Required<archy.Data> | undefined {
		return undefined;
	}
}

function buildArchyTree<S extends BlueshellState, E>(
	node: Base<S, E>, contextDepth: number, state?: S
): Required<Data>|undefined {
	if (state) {
		const v = new ArchyVisitor<S, E>();
		return v.visit(node, state, contextDepth);
	} else {
		const v = new ArchyStatelessVisitor<S, E>();
		return v.visit(node);
	}
}

export function serializeArchyTree<S extends BlueshellState, E>(
	tree: Base<S, E>, state?: S, contextDepth = Number.MAX_SAFE_INTEGER
): string {
	const archyTree = buildArchyTree(tree, contextDepth, state);
	if (archyTree) {
		return archy(archyTree);
	}
	return '';
}
