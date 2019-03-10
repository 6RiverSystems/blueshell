import {Base} from '../nodes/Base';
import {BlueshellState} from '../nodes/BlueshellState';
import {

	NodeStateVisitor,
	OnPathAnalysis,
	InContextAnalysis,
	NodeVisitor,
	StatelessAnalysis,
	NodeAnalysis,
} from './NodeVisitor';
import {ResultCode} from '..';

export type D3Node = {
	children: D3Node[];
	name: string;
	nodeType: string;
	id: string;
	symbol: string;
	lastResult?: ResultCode;
};

export type D3Result = D3Node | undefined;

export class D3StatelessVisitor<S extends BlueshellState, E> extends NodeVisitor<S, E, D3Result> {
	protected visitStateless(analysis: StatelessAnalysis<S, E, D3Result>): D3Result {
		return {
			name: analysis.name,
			nodeType: analysis.nodeType,
			id: analysis.id,
			symbol: analysis.symbol,
			children: [...(analysis.visitChildren())].filter((v) => v !== undefined) as D3Node[],
		};
	}
}

export class D3Visitor<S extends BlueshellState, E> extends NodeStateVisitor<S, E, D3Result> {
	protected visitOnPath(analysis: OnPathAnalysis<S, E, D3Result>): D3Result {
		return {
			name: analysis.name,
			nodeType: analysis.nodeType,
			id: analysis.id,
			symbol: analysis.symbol,
			lastResult: analysis.lastResult,
			children: [...(analysis.visitChildren())].filter((v) => v !== undefined) as D3Node[],
		};
	}	protected visitInContext(analysis: InContextAnalysis<S, E, D3Result>): D3Result {
		return {
			name: analysis.name,
			nodeType: analysis.nodeType,
			id: analysis.id,
			symbol: analysis.symbol,
			children: [...(analysis.visitChildren())].filter((v) => v !== undefined) as D3Node[],
		};
	}
	protected visitEdgeOfContext(analysis: NodeAnalysis<S, E>): D3Result {
		return {
			name: '...',
			nodeType: analysis.nodeType,
			id: analysis.id,
			symbol: analysis.symbol,
			children: [],
		};
	}
	protected visitOutOfContext(): D3Result {
		return undefined;
	}
}

export function serializeD3Tree<S extends BlueshellState, E>(
	root: Base<S, E>, state?: S, contextDepth = Number.MAX_SAFE_INTEGER
) {
	if (!root) {
		return '{}';
	}

	if (state) {
		const v = new D3Visitor<S, E>();
		return JSON.stringify(v.visit(root, state, contextDepth));
	} else {
		const v = new D3StatelessVisitor<S, E>();
		return JSON.stringify(v.visit(root));
	}
}
