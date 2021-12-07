import {Base} from '../nodes/Base';
import {BlueshellState} from '../models';
import {Server} from 'ws';
import {Session, Debugger} from 'inspector';

export class NodeManager {
	private nodePathMap: Map<string, Base<BlueshellState, any>> = new Map();
	private nodeIdMap: Map<string, Base<BlueshellState, any>> = new Map();

	private breakpointIdMap: Map<string, Debugger.BreakpointId> = new Map();
	private server: Server|undefined;

	private session = new Session();

	private static instance: NodeManager|null = null;
	private constructor() {
		(<any>global).breakpointMethods = new Map<string, Function>();

		this.session.connect();

		this.session.post('Debugger.enable', () => {
		});

		if (process.env.NO_SERVER !== 'true') {
			this.server = new Server({
				host: 'localhost',
				port: 10001,
			});
			this.server.on('connection', (clientSocket) => {
				this.breakpointIdMap.forEach((breakpointId, nodePathAndMethodName) => {
					this.session.post('Debugger.removeBreakpoint', {
						breakpointId,
					}, () => {
						this.breakpointIdMap.delete(nodePathAndMethodName);
					});
				});
				this.breakpointIdMap.clear();

				// should be empty but good measure
				(<any>global).breakpointMethods.clear();

				clientSocket.on('message', (data: string) => {
					const dataObj = JSON.parse(data);
					const request = dataObj.request;
					const nodeId = dataObj.nodeId;
					switch (request) {
					case 'getMethodsForNode': {
						const listOfMethods: string[] = this.getMethodsForNode(nodeId);

						clientSocket.send(JSON.stringify({
							request: 'getMethodsForNode',
							nodeId,
							listOfMethods,
						}));

						break;
					}
					case 'placeBreakpoint': {
						const conditional = dataObj.conditional;
						const methodName = dataObj.methodName;

						this.setBreakpoint(nodeId, methodName, conditional, (success) => {
							const node = this.nodeIdMap.get(nodeId);
							clientSocket.send(JSON.stringify({
								request: 'placeBreakpoint',
								nodeId,
								nodePath: node!.path,
								methodName,
								success,
							}));
						});

						break;
					}
					case 'removeBreakpoint': {
						const methodName = dataObj.methodName;

						this.removeBreakpoint(nodeId, methodName);

						break;
					}
					default:
						throw new Error(`Unknown request type: ${dataObj.request}`);
					}
				});
			});
		}
	}

	private removeBreakpoint(nodeId: string, methodName: string) {
		const node = this.nodeIdMap.get(nodeId);
		const key = `${node!.path}::${methodName}`;
		const breakpointId = this.breakpointIdMap.get(key);

		if (breakpointId) {
			this.session.post('Debugger.removeBreakpoint', {
				breakpointId,
			}, () => {
				this.breakpointIdMap.delete(key);
			});
		}
		(<any>global).breakpointMethods.delete(key);
	}

	private setBreakpoint(nodeId: string, methodName: string, condition: string, callback: (success: boolean) => void) {
		if (!this.nodeIdMap.has(nodeId)) {
			throw new Error(`Attempting to set breakpoint on node ${nodeId}\
			 in method: ${methodName} but node does not exist.`);
		} else {
			const node = this.nodeIdMap.get(nodeId);

			const key = `${node!.path}::${methodName}`;
			if (!(<any>global).breakpointMethods.get(key)) {
				(<any>global).breakpointMethods.set(key, (<any>node)[methodName].bind(node));

				this.session.post('Runtime.evaluate', {expression: `global.breakpointMethods.get('${key}')`},
				 (err, {result}) => {
						if (err) {
						/* eslint no-console: ["error", { allow: ["error"] }] */
							console.error('Error in Runtime.evaluate', err);
							callback(false);
							return;
						}
						const objectId = result.objectId;

						this.session.post('Runtime.getProperties', {objectId}, (err, result) => {
							if (err) {
							/* eslint no-console: ["error", { allow: ["error"] }] */
								console.error('Error in Runtime.getProperties', err);
								callback(false);
								return;
							}

							const funcObjId = (<any>result).internalProperties[0].value.objectId;

							this.session.post('Debugger.setBreakpointOnFunctionCall', {
								objectId: funcObjId,
								condition: `this.path === '${node!.path}'`,
							},
							(err, result) => {
								if (err) {
								/* eslint no-console: ["error", { allow: ["error"] }] */
									console.error('Error in Debugger.setBreakpointOnFunctionCall', err);
									callback(false);
									return;
								}
								if (!result) {
									console.error('Got no result in Debugger.setBreakpointOnFunctionCall');
									callback(false);
									return;
								}
								this.breakpointIdMap.set(key, (result as any).breakpointId);	// HACK: types are not defined
								callback(true);
							});
						});
					});
			}

			// let methodMap = this.breakpointMethods.get(nodeId);
			// if(!methodMap){
			//     methodMap = new Map();
			//     this.breakpointMethods.set(nodeId, methodMap);
			// }

			// let methodObj = methodMap.get(methodName);
			// // if we haven't set a breakpoint on this method yet
			// if(!methodObj) {
			//     let originalMethod = (<any>node)[methodName];
			//     let breakpointMethod = this.generateBreakpointMethod(node!, originalMethod);
			//     methodObj = {
			//         originalMethod: originalMethod,
			//         breakpointMethod: breakpointMethod
			//     };

			//     // assign the reference on the object to the breakpoint method
			//     (<any>node)[methodName] = breakpointMethod;
			// }
			// // if we've already set a breakpoint in this node's method, just update the breakpointMethod reference
			// else {
			//     let breakpointMethod = this.generateBreakpointMethod(node!, methodObj.originalMethod);
			//     methodObj.breakpointMethod = breakpointMethod;

			//     // assign the reference on the object to the breakpoint method
			//     (<any>node)[methodName] = breakpointMethod;
			// }
		}
	}

	private getMethodsForNode(nodeId: string): string[] {
		if (!this.nodeIdMap.has(nodeId)) {
			throw new Error(`Requesting methods for node ${nodeId} which does not exist`);
		} else {
			let node = this.nodeIdMap.get(nodeId);
			const setOfMethods: Set<string> = new Set();
			do {
				const methods = Object.getOwnPropertyNames(node);
				methods.forEach((method) => {
					// de-duplicate any inherited methods
					if (!setOfMethods.has(method) &&
						this.getMethodType(node!, method)
					) {
						setOfMethods.add(method);
					}
				});
				// climb up the inheritance tree
			} while (node = Object.getPrototypeOf(node));

			return Array.from(setOfMethods);
		}
	}

	private getMethodType(node: Base<BlueshellState, any>, methodName: string) {
		try {
			return typeof (<any>node)[methodName] === 'function';
		} catch (ex) {
			// if we catch an error, it's likely because we called a property and it threw
			// in which case it's a method and we should return false to reflect that
			return false;
		}
	}

	public static getInstance(): NodeManager {
		if (!this.instance) {
			this.instance = new NodeManager();
		}
		return this.instance;
	}

	public addNode(path: string, node: Base<BlueshellState, any>) {
		if (this.nodePathMap.has(path)) {
			throw new Error(`Key ${path} already exists! Cannot add new node.`);
		} else {
			this.nodePathMap.set(path, node);
			this.nodeIdMap.set(node.id, node);
		}
	}

	public removeNode(path: string) {
		this.nodePathMap.delete(path);
	}

	public getNode(path: string): Base<BlueshellState, any>|undefined {
		return this.nodePathMap.get(path);
	}

	public async shutdown() {
		return new Promise<void>((resolve, reject) => {
			if (this.server) {
				this.server.close((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}
}
