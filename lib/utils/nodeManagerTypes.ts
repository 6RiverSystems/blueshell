import {Debugger} from 'inspector';

// Map key that is the path property of a bt node
export type NodePathKey = string;
// Map key that is the class plus method name of a bt node method: ClassName::MethodName
export type ClassMethodNameKey = string;

// the two parts of a ClassMethodNameKey - the className is the class the method comes from
// which might be a super class
export interface NodeMethodInfo {
	className: string;
	methodName: string;
}

// the information about a breakpoint from one node on a particular class/method
export interface BreakpointData {
	nodePath: string;
	condition?: string;
	nodeName?: string;
	nodeParent?: string;
}

// the information about a breakpoint set on a particular class/method (for 1 or more nodes)
export interface BreakpointInfo {
	methodInfo: NodeMethodInfo,
	breakpointId?: Debugger.BreakpointId;
	breakpoints: Map<NodePathKey, BreakpointData>,
}

// the information for the methods available for a particuliar node as well as the node name and parent
export interface NodeMethodsInfo {
	listOfMethods: NodeMethodInfo[];
	nodeName: string;
	nodeParent: string;
}
