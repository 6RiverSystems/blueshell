// @@@ probably a better way to do this than a global
let treePublisher: TreePublisher;

export interface TreePublisher {
	publishTree(): void;
}

export function registerTreePublisher(publisher: TreePublisher): void {
	treePublisher = publisher;
}

export function publishTree() {
	if (!!treePublisher) {
		treePublisher.publishTree();
	}
}
