// src/node.ts
var isNode = (obj) => {
  return "$" in obj && typeof obj.$ === "object" && obj.$ !== null && "tag" in obj.$ && typeof obj.$.tag === "string";
};
var isResource = (obj) => {
  return isNode(obj) && obj.$.tag === "resource";
};
var isDataSource = (obj) => {
  return isNode(obj) && obj.$.tag === "data";
};

// src/group.ts
class Group {
  parent;
  type;
  name;
  children = [];
  constructor(parent, type, name) {
    this.parent = parent;
    this.type = type;
    this.name = name;
    parent?.children.push(this);
  }
  get urn() {
    const urn = this.parent ? this.parent.urn : "urn";
    return `${urn}:${this.type}:{${this.name}}`;
  }
  addChild(child) {
    if (isNode(child)) {
      const duplicate = this.children.filter((c) => isResource(c)).find((c) => c.$.type === child.$.type && c.$.logicalId === child.$.logicalId);
      if (duplicate) {
        throw new Error(`Duplicate node found: ${child.$.type}:${child.$.logicalId}`);
      }
    }
    if (child instanceof Group) {
      const duplicate = this.children.filter((c) => c instanceof Group).find((c) => c.type === child.type && c.name === child.name);
      if (duplicate) {
        throw new Error(`Duplicate group found: ${child.type}:${child.name}`);
      }
    }
    this.children.push(child);
  }
  add(...children) {
    for (const child of children) {
      this.addChild(child);
    }
  }
  get nodes() {
    return this.children.map((child) => {
      if (child instanceof Group) {
        return child.nodes;
      }
      if (isNode(child)) {
        return child;
      }
      return;
    }).flat().filter((child) => !!child);
  }
  get resources() {
    return this.nodes.filter((node) => isResource(node));
  }
  get dataSources() {
    return this.nodes.filter((node) => isDataSource(node));
  }
}

// src/stack.ts
class Stack extends Group {
  app;
  dependencies = new Set;
  constructor(app, name) {
    super(app, "stack", name);
    this.app = app;
  }
  dependsOn(...stacks) {
    for (const stack of stacks) {
      if (stack.app !== this.app) {
        throw new Error(`Stacks that belong to different apps can't be dependent on each other`);
      }
      this.dependencies.add(stack);
    }
    return this;
  }
}
var findParentStack = (group) => {
  if (group instanceof Stack) {
    return group;
  }
  if (!group.parent) {
    throw new Error("No stack found");
  }
  return findParentStack(group.parent);
};

// src/app.ts
class App extends Group {
  name;
  constructor(name) {
    super(undefined, "app", name);
    this.name = name;
  }
  get stacks() {
    return this.children.filter((child) => child instanceof Stack);
  }
}
// src/future.ts
var IDLE = 0;
var PENDING = 1;
var RESOLVED = 2;
var REJECTED = 3;

class Future {
  callback;
  listeners = new Set;
  status = IDLE;
  data;
  error;
  constructor(callback) {
    this.callback = callback;
  }
  get [Symbol.toStringTag]() {
    switch (this.status) {
      case IDLE:
        return `<idle>`;
      case PENDING:
        return `<pending>`;
      case RESOLVED:
        return `${this.data}`;
      case REJECTED:
        return `<rejected> ${this.error}`;
    }
  }
  pipe(cb) {
    return new Future((resolve, reject) => {
      this.then((value) => {
        Promise.resolve(cb(value)).then((value2) => {
          resolve(value2);
        }).catch(reject);
      }, reject);
    });
  }
  then(resolve, reject) {
    if (this.status === RESOLVED) {
      resolve(this.data);
    } else if (this.status === REJECTED) {
      reject?.(this.error);
    } else {
      this.listeners.add({ resolve, reject });
      if (this.status === IDLE) {
        this.status = PENDING;
        this.callback((data) => {
          if (this.status === PENDING) {
            this.status = RESOLVED;
            this.data = data;
            this.listeners.forEach(({ resolve: resolve2 }) => resolve2(data));
            this.listeners.clear();
          }
        }, (error) => {
          if (this.status === PENDING) {
            this.status = REJECTED;
            this.error = error;
            this.listeners.forEach(({ reject: reject2 }) => reject2?.(error));
            this.listeners.clear();
          }
        });
      }
    }
  }
}

// src/input.ts
var findInputDeps = (props) => {
  const deps = [];
  const find = (props2) => {
    if (props2 instanceof Output) {
      deps.push(...props2.dependencies);
    } else if (Array.isArray(props2)) {
      props2.map(find);
    } else if (props2?.constructor === Object) {
      Object.values(props2).map(find);
    }
  };
  find(props);
  return deps;
};
var resolveInputs = async (inputs) => {
  const unresolved = [];
  const find = (props, parent, key) => {
    if (props instanceof Output || props instanceof Future || props instanceof Promise) {
      unresolved.push([parent, key]);
    } else if (Array.isArray(props)) {
      props.map((value, index) => find(value, props, index));
    } else if (props?.constructor === Object) {
      Object.entries(props).map(([key2, value]) => find(value, props, key2));
    }
  };
  find(inputs, {}, "root");
  const responses = await Promise.all(unresolved.map(async ([obj, key]) => {
    const promise = obj[key];
    let timeout;
    const response = await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          if (promise instanceof Output) {
            reject(new Error(`Resolving Output<${[...promise.dependencies].map((d) => d.urn).join(", ")}> took too long.`));
          } else if (promise instanceof Future) {
            reject(new Error("Resolving Future took too long."));
          } else {
            reject(new Error("Resolving Promise took too long."));
          }
        }, 3000);
      })
    ]);
    clearTimeout(timeout);
    return response;
  }));
  unresolved.forEach(([props, key], i) => {
    props[key] = responses[i];
  });
  return inputs;
};

// src/output.ts
class Output extends Future {
  dependencies;
  constructor(dependencies, callback) {
    super(callback);
    this.dependencies = dependencies;
  }
  pipe(cb) {
    return new Output(this.dependencies, (resolve, reject) => {
      this.then((value) => {
        Promise.resolve(cb(value)).then((value2) => {
          resolve(value2);
        }).catch(reject);
      }, reject);
    });
  }
}
var deferredOutput = (cb) => {
  return new Output(new Set, cb);
};
var output = (value) => {
  return deferredOutput((resolve) => resolve(value));
};
var combine = (...inputs) => {
  const deps = new Set(findInputDeps(inputs));
  return new Output(deps, (resolve, reject) => {
    Promise.all(inputs).then((result) => {
      resolve(result);
    }, reject);
  });
};
var resolve = (inputs, transformer) => {
  return combine(...inputs).pipe((data) => {
    return transformer(...data);
  });
};
var interpolate = (literals, ...placeholders) => {
  return combine(...placeholders).pipe((unwrapped) => {
    const result = [];
    for (let i = 0;i < unwrapped.length; i++) {
      result.push(literals[i], unwrapped[i]);
    }
    result.push(literals.at(-1));
    return result.join("");
  });
};
// src/urn.ts
var createUrn = (tag, type, name, parentUrn) => {
  return `${parentUrn ? parentUrn : "urn"}:${tag}:${type}:{${name}}`;
};

// src/meta.ts
var createMeta = (tag, provider, parent, type, logicalId, input, config) => {
  const urn = createUrn(tag, type, logicalId, parent.urn);
  const stack = findParentStack(parent);
  let output2;
  return {
    tag,
    urn,
    logicalId,
    type,
    stack,
    provider,
    input,
    config,
    get dependencies() {
      const dependencies = new Set;
      const linkMetaDep = (dep) => {
        if (dep.urn === urn) {
          throw new Error("You can't depend on yourself");
        }
        dependencies.add(dep.urn);
      };
      for (const dep of findInputDeps(input)) {
        linkMetaDep(dep);
      }
      for (const dep of config?.dependsOn ?? []) {
        linkMetaDep(dep.$);
      }
      return dependencies;
    },
    resolve(data) {
      output2 = data;
    },
    output(cb) {
      return new Output(new Set([this]), (resolve2) => {
        if (!output2) {
          throw new Error(`Unresolved output for ${tag}: ${urn}`);
        }
        resolve2(cb(output2));
      });
    }
  };
};
// src/debug.ts
var enabled = false;
var enableDebug = () => {
  enabled = true;
};
var createDebugger = (group) => {
  return (...args) => {
    if (!enabled) {
      return;
    }
    console.log();
    console.log(`${group}:`, ...args);
    console.log();
  };
};
// src/workspace/exit.ts
import asyncOnExit from "async-on-exit";
var listeners = new Set;
var listening = false;
var onExit = (cb) => {
  listeners.add(cb);
  if (!listening) {
    listening = true;
    asyncOnExit(async () => {
      await Promise.allSettled([...listeners].map((cb2) => cb2()));
    }, true);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      listening = false;
      asyncOnExit.dispose();
    }
  };
};

// src/workspace/lock.ts
var lockApp = async (lockBackend, app, fn) => {
  let releaseLock;
  try {
    releaseLock = await lockBackend.lock(app.urn);
  } catch (error) {
    throw new Error(`Already in progress: ${app.urn}`);
  }
  const releaseExit = onExit(async () => {
    await releaseLock();
  });
  let result;
  try {
    result = await fn();
  } catch (error) {
    throw error;
  } finally {
    await releaseLock();
    releaseExit();
  }
  return result;
};

// src/workspace/concurrency.ts
import promiseLimit from "p-limit";
var concurrencyQueue = (concurrency) => {
  const queue = promiseLimit(concurrency);
  return (cb) => {
    return queue(cb);
  };
};

// src/workspace/dependency.ts
import { DirectedGraph } from "graphology";
import { topologicalGenerations, willCreateCycle } from "graphology-dag";

// src/workspace/entries.ts
var entries = (object) => {
  return Object.entries(object);
};

// src/workspace/dependency.ts
class DependencyGraph {
  graph = new DirectedGraph;
  callbacks = new Map;
  add(urn, deps, callback) {
    this.callbacks.set(urn, callback);
    this.graph.mergeNode(urn);
    for (const dep of deps) {
      if (willCreateCycle(this.graph, dep, urn)) {
        throw new Error(`There is a circular dependency between ${urn} -> ${dep}`);
      }
      this.graph.mergeEdge(dep, urn);
    }
  }
  validate() {
    const nodes = this.graph.nodes();
    for (const urn of nodes) {
      if (!this.callbacks.has(urn)) {
        const deps = this.graph.filterNodes((node) => {
          return this.graph.areNeighbors(node, urn);
        });
        throw new Error(`The following resources ${deps.join(", ")} have a missing dependency: ${urn}`);
      }
    }
  }
  async run() {
    this.validate();
    const graph = topologicalGenerations(this.graph);
    const errors = [];
    for (const list of graph) {
      const result = await Promise.allSettled(list.map((urn) => {
        const callback = this.callbacks.get(urn);
        if (!callback) {
          return;
        }
        return callback();
      }));
      for (const entry of result) {
        if (entry.status === "rejected") {
          if (entry.reason instanceof Error) {
            errors.push(entry.reason);
          } else {
            errors.push(new Error(`Unknown error: ${entry.reason}`));
          }
        }
      }
      if (errors.length > 0) {
        break;
      }
    }
    return errors;
  }
}
var dependentsOn = (resources, dependency) => {
  const dependents = [];
  for (const [urn, resource] of entries(resources)) {
    if (resource.dependencies.includes(dependency)) {
      dependents.push(urn);
    }
  }
  return dependents;
};

// src/workspace/error.ts
class ResourceError extends Error {
  urn;
  type;
  operation;
  static wrap(urn, type, operation, error) {
    if (error instanceof Error) {
      return new ResourceError(urn, type, operation, error.message);
    }
    return new ResourceError(urn, type, operation, "Unknown Error");
  }
  constructor(urn, type, operation, message) {
    super(message);
    this.urn = urn;
    this.type = type;
    this.operation = operation;
  }
}

class AppError extends Error {
  app;
  issues;
  constructor(app, issues, message) {
    super(message);
    this.app = app;
    this.issues = issues;
  }
}

class ResourceNotFound extends Error {
}

class ResourceAlreadyExists extends Error {
}

// src/workspace/state.ts
var compareState = (left, right) => {
  const replacer = (_, value) => {
    if (value !== null && value instanceof Object && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((sorted, key) => {
        sorted[key] = value[key];
        return sorted;
      }, {});
    }
    return value;
  };
  const l = JSON.stringify(left, replacer);
  const r = JSON.stringify(right, replacer);
  return l === r;
};
var removeEmptyStackStates = (appState) => {
  for (const [stackUrn, stackState] of entries(appState.stacks)) {
    if (Object.keys(stackState.nodes).length === 0) {
      delete appState.stacks[stackUrn];
    }
  }
};

// src/workspace/state/v1.ts
var v1 = (oldAppState) => {
  const stacks = {};
  for (const [urn, stack] of entries(oldAppState.stacks)) {
    const nodes = {};
    for (const [urn2, resource] of entries(stack.resources)) {
      nodes[urn2] = {
        ...resource,
        tag: "resource"
      };
    }
    stacks[urn] = {
      name: stack.name,
      dependencies: stack.dependencies,
      nodes
    };
  }
  return {
    ...oldAppState,
    stacks,
    version: 1
  };
};

// src/workspace/state/v2.ts
var v2 = (oldAppState) => {
  const stacks = {};
  for (const [urn, stack] of entries(oldAppState.stacks)) {
    stacks[urn] = {
      name: stack.name,
      nodes: stack.nodes
    };
  }
  return {
    ...oldAppState,
    stacks,
    version: 2
  };
};

// src/workspace/state/migrate.ts
var versions = [
  [1, v1],
  [2, v2]
];
var migrateAppState = (oldState) => {
  const version = "version" in oldState && oldState.version || 0;
  for (const [v, migrate] of versions) {
    if (v > version) {
      oldState = migrate(oldState);
    }
  }
  return oldState;
};

// src/provider.ts
var findProvider = (providers, id) => {
  for (const provider of providers) {
    if (provider.ownResource(id)) {
      return provider;
    }
  }
  throw new TypeError(`Can't find the "${id}" provider.`);
};

// src/workspace/token.ts
import { v5 } from "uuid";
var createIdempotantToken = (appToken, urn, operation) => {
  return v5(`${urn}-${operation}`, appToken);
};

// src/workspace/procedure/delete-resource.ts
var debug = createDebugger("Delete");
var deleteResource = async (appToken, urn, state, opt) => {
  debug(state.type);
  debug(state);
  if (state.lifecycle?.retainOnDelete) {
    debug("retain", state.type);
    return;
  }
  const idempotantToken = createIdempotantToken(appToken, urn, "delete");
  const provider = findProvider(opt.providers, state.provider);
  try {
    await provider.deleteResource({
      type: state.type,
      state: state.output,
      idempotantToken
    });
  } catch (error) {
    if (error instanceof ResourceNotFound) {
      debug(state.type, "already deleted");
    } else {
      throw ResourceError.wrap(urn, state.type, "delete", error);
    }
  }
};

// src/workspace/procedure/delete-app.ts
var deleteApp = async (app, opt) => {
  const latestState = await opt.backend.state.get(app.urn);
  if (!latestState) {
    throw new AppError(app.name, [], `App already deleted: ${app.name}`);
  }
  const appState = migrateAppState(latestState);
  if (opt.idempotentToken || !appState.idempotentToken) {
    appState.idempotentToken = opt.idempotentToken ?? crypto.randomUUID();
    await opt.backend.state.update(app.urn, appState);
  }
  let stackStates = Object.values(appState.stacks);
  if (opt.filters && opt.filters.length > 0) {
    stackStates = stackStates.filter((stackState) => opt.filters.includes(stackState.name));
  }
  const queue = concurrencyQueue(opt.concurrency ?? 10);
  const graph = new DependencyGraph;
  const allNodes = {};
  for (const stackState of Object.values(appState.stacks)) {
    for (const [urn, nodeState] of entries(stackState.nodes)) {
      allNodes[urn] = nodeState;
    }
  }
  for (const stackState of stackStates) {
    for (const [urn, state] of entries(stackState.nodes)) {
      graph.add(urn, dependentsOn(allNodes, urn), async () => {
        if (state.tag === "resource") {
          await queue(() => deleteResource(appState.idempotentToken, urn, state, opt));
        }
        delete stackState.nodes[urn];
      });
    }
  }
  const errors = await graph.run();
  removeEmptyStackStates(appState);
  delete appState.idempotentToken;
  await opt.backend.state.update(app.urn, appState);
  if (errors.length > 0) {
    throw new AppError(app.name, [...new Set(errors)], "Deleting app failed.");
  }
  if (Object.keys(appState.stacks).length === 0) {
    await opt.backend.state.delete(app.urn);
  }
};

// src/workspace/replacement.ts
import { get } from "get-wild";
var requiresReplacement = (priorState, proposedState, replaceOnChanges) => {
  for (const path of replaceOnChanges) {
    const priorValue = get(priorState, path);
    const proposedValue = get(proposedState, path);
    if (path.includes("*") && Array.isArray(priorValue)) {
      for (let i = 0;i < priorValue.length; i++) {
        if (!compareState(priorValue[i], proposedValue[i])) {
          return true;
        }
      }
    }
    if (!compareState(priorValue, proposedValue)) {
      return true;
    }
  }
  return false;
};

// src/workspace/procedure/create-resource.ts
var debug2 = createDebugger("Create");
var createResource = async (resource, appToken, input, opt) => {
  const provider = findProvider(opt.providers, resource.$.provider);
  const idempotantToken = createIdempotantToken(appToken, resource.$.urn, "create");
  debug2(resource.$.type);
  debug2(input);
  let result;
  try {
    result = await provider.createResource({
      type: resource.$.type,
      state: input,
      idempotantToken
    });
  } catch (error) {
    throw ResourceError.wrap(resource.$.urn, resource.$.type, "create", error);
  }
  return {
    tag: "resource",
    version: result.version,
    type: resource.$.type,
    provider: resource.$.provider,
    input: resource.$.input,
    output: result.state
  };
};

// src/workspace/procedure/get-data-source.ts
var debug3 = createDebugger("Data Source");
var getDataSource = async (dataSource, input, opt) => {
  const provider = findProvider(opt.providers, dataSource.provider);
  debug3(dataSource.type);
  if (!provider.getData) {
    throw new Error(`Provider doesn't support data sources`);
  }
  let result;
  try {
    result = await provider.getData({
      type: dataSource.type,
      state: input
    });
  } catch (error) {
    throw ResourceError.wrap(dataSource.urn, dataSource.type, "get", error);
  }
  return {
    tag: "data",
    type: dataSource.type,
    provider: dataSource.provider,
    input,
    output: result.state
  };
};

// src/workspace/procedure/import-resource.ts
var debug4 = createDebugger("Import");
var importResource = async (resource, input, opt) => {
  const provider = findProvider(opt.providers, resource.$.provider);
  debug4(resource.$.type);
  debug4(input);
  let result;
  try {
    result = await provider.getResource({
      type: resource.$.type,
      state: {
        ...input,
        id: resource.$.config?.import
      }
    });
  } catch (error) {
    throw ResourceError.wrap(resource.$.urn, resource.$.type, "import", error);
  }
  return {
    tag: "resource",
    version: result.version,
    type: resource.$.type,
    provider: resource.$.provider,
    input: resource.$.input,
    output: result.state
  };
};

// src/workspace/procedure/replace-resource.ts
var debug5 = createDebugger("Replace");
var replaceResource = async (resource, appToken, priorState, proposedState, opt) => {
  const urn = resource.$.urn;
  const type = resource.$.type;
  const provider = findProvider(opt.providers, resource.$.provider);
  const idempotantToken = createIdempotantToken(appToken, resource.$.urn, "replace");
  debug5(resource.$.type);
  debug5(proposedState);
  if (resource.$.config?.retainOnDelete) {
    debug5("retain", type);
  } else {
    try {
      await provider.deleteResource({
        type,
        state: priorState,
        idempotantToken
      });
    } catch (error) {
      if (error instanceof ResourceNotFound) {
        debug5(type, "already deleted");
      } else {
        throw ResourceError.wrap(urn, type, "replace", error);
      }
    }
  }
  let result;
  try {
    result = await provider.createResource({
      type,
      state: proposedState,
      idempotantToken
    });
  } catch (error) {
    throw ResourceError.wrap(urn, type, "replace", error);
  }
  return {
    version: result.version,
    output: result.state
  };
};

// src/workspace/procedure/update-resource.ts
var debug6 = createDebugger("Update");
var updateResource = async (resource, appToken, priorState, proposedState, opt) => {
  const provider = findProvider(opt.providers, resource.$.provider);
  const idempotantToken = createIdempotantToken(appToken, resource.$.urn, "update");
  let result;
  debug6(resource.$.type);
  debug6(proposedState);
  try {
    result = await provider.updateResource({
      type: resource.$.type,
      priorState,
      proposedState,
      idempotantToken
    });
  } catch (error) {
    throw ResourceError.wrap(resource.$.urn, resource.$.type, "update", error);
  }
  return {
    version: result.version,
    output: result.state
  };
};

// src/workspace/procedure/deploy-app.ts
var debug7 = createDebugger("Deploy App");
var deployApp = async (app, opt) => {
  debug7(app.name, "start");
  const latestState = await opt.backend.state.get(app.urn);
  const appState = migrateAppState(latestState ?? {
    name: app.name,
    stacks: {}
  });
  const releaseOnExit = onExit(async () => {
    await opt.backend.state.update(app.urn, appState);
  });
  if (opt.idempotentToken || !appState.idempotentToken) {
    appState.idempotentToken = opt.idempotentToken ?? crypto.randomUUID();
    await opt.backend.state.update(app.urn, appState);
  }
  let stacks = app.stacks;
  let filteredOutStacks = [];
  if (opt.filters && opt.filters.length > 0) {
    stacks = app.stacks.filter((stack) => opt.filters.includes(stack.name));
    filteredOutStacks = app.stacks.filter((stack) => !opt.filters.includes(stack.name));
  }
  const queue = concurrencyQueue(opt.concurrency ?? 10);
  const graph = new DependencyGraph;
  const allNodes = {};
  for (const stackState of Object.values(appState.stacks)) {
    for (const [urn, nodeState] of entries(stackState.nodes)) {
      allNodes[urn] = nodeState;
    }
  }
  for (const stack of filteredOutStacks) {
    const stackState = appState.stacks[stack.urn];
    if (stackState) {
      for (const node of stack.nodes) {
        const nodeState = stackState.nodes[node.$.urn];
        if (nodeState && nodeState.output) {
          graph.add(node.$.urn, [], async () => {
            debug7("hydrate", node.$.urn);
            node.$.resolve(nodeState.output);
          });
        }
      }
    }
  }
  for (const [urn, stackState] of entries(appState.stacks)) {
    const found = app.stacks.find((stack) => {
      return stack.urn === urn;
    });
    const filtered = opt.filters ? opt.filters.find((filter) => filter === stackState.name) : true;
    if (!found && filtered) {
      for (const [urn2, nodeState] of entries(stackState.nodes)) {
        graph.add(urn2, dependentsOn(allNodes, urn2), async () => {
          if (nodeState.tag === "resource") {
            await queue(() => deleteResource(appState.idempotentToken, urn2, nodeState, opt));
          }
          delete stackState.nodes[urn2];
        });
      }
    }
  }
  for (const stack of stacks) {
    const stackState = appState.stacks[stack.urn] = appState.stacks[stack.urn] ?? {
      name: stack.name,
      nodes: {}
    };
    for (const [urn, nodeState] of entries(stackState.nodes)) {
      const resource = stack.nodes.find((r) => r.$.urn === urn);
      if (!resource) {
        graph.add(urn, dependentsOn(allNodes, urn), async () => {
          if (nodeState.tag === "resource") {
            await queue(() => deleteResource(appState.idempotentToken, urn, nodeState, opt));
          }
          delete stackState.nodes[urn];
        });
      }
    }
    for (const node of stack.nodes) {
      const dependencies = [...node.$.dependencies];
      const partialNewResourceState = {
        dependencies,
        lifecycle: isResource(node) ? {
          retainOnDelete: node.$.config?.retainOnDelete
        } : undefined
      };
      graph.add(node.$.urn, dependencies, () => {
        return queue(async () => {
          let nodeState = stackState.nodes[node.$.urn];
          let input;
          try {
            input = await resolveInputs(node.$.input);
          } catch (error) {
            throw ResourceError.wrap(node.$.urn, node.$.type, "resolve", error);
          }
          if (isDataSource(node)) {
            if (!nodeState) {
              const dataSourceState = await getDataSource(node.$, input, opt);
              nodeState = stackState.nodes[node.$.urn] = {
                ...dataSourceState,
                ...partialNewResourceState
              };
            } else if (!compareState(nodeState.input, input)) {
              const dataSourceState = await getDataSource(node.$, input, opt);
              Object.assign(nodeState, {
                ...dataSourceState,
                ...partialNewResourceState
              });
            } else {
              Object.assign(nodeState, partialNewResourceState);
            }
          }
          if (isResource(node)) {
            if (!nodeState) {
              if (node.$.config?.import) {
                const importedState = await importResource(node, input, opt);
                const newResourceState = await updateResource(node, appState.idempotentToken, importedState.output, input, opt);
                nodeState = stackState.nodes[node.$.urn] = {
                  ...importedState,
                  ...newResourceState,
                  ...partialNewResourceState
                };
              } else {
                const newResourceState = await createResource(node, appState.idempotentToken, input, opt);
                nodeState = stackState.nodes[node.$.urn] = {
                  ...newResourceState,
                  ...partialNewResourceState
                };
              }
            } else if (!compareState(nodeState.input, input)) {
              let newResourceState;
              if (requiresReplacement(nodeState.input, input, node.$.config?.replaceOnChanges ?? [])) {
                newResourceState = await replaceResource(node, appState.idempotentToken, nodeState.output, input, opt);
              } else {
                newResourceState = await updateResource(node, appState.idempotentToken, nodeState.output, input, opt);
              }
              Object.assign(nodeState, {
                input,
                ...newResourceState,
                ...partialNewResourceState
              });
            } else {
              Object.assign(nodeState, partialNewResourceState);
            }
          }
          if (nodeState?.output) {
            node.$.resolve(nodeState.output);
          }
        });
      });
    }
  }
  const errors = await graph.run();
  removeEmptyStackStates(appState);
  delete appState.idempotentToken;
  await opt.backend.state.update(app.urn, appState);
  releaseOnExit();
  debug7(app.name, "done");
  if (errors.length > 0) {
    throw new AppError(app.name, [...new Set(errors)], "Deploying app failed.");
  }
  if (Object.keys(appState.stacks).length === 0) {
    await opt.backend.state.delete(app.urn);
  }
  return appState;
};

// src/workspace/procedure/hydrate.ts
var hydrate = async (app, opt) => {
  const appState = await opt.backend.state.get(app.urn);
  if (appState) {
    for (const stack of app.stacks) {
      const stackState = appState.stacks[stack.urn];
      if (stackState) {
        for (const node of stack.nodes) {
          const nodeState = stackState.nodes[node.$.urn];
          if (nodeState && nodeState.output) {
            node.$.resolve(nodeState.output);
          }
        }
      }
    }
  }
};

// src/workspace/workspace.ts
class WorkSpace {
  props;
  constructor(props) {
    this.props = props;
  }
  deploy(app, options = {}) {
    return lockApp(this.props.backend.lock, app, async () => {
      try {
        await deployApp(app, { ...this.props, ...options });
      } finally {
        await this.destroyProviders();
      }
    });
  }
  delete(app, options = {}) {
    return lockApp(this.props.backend.lock, app, async () => {
      try {
        await deleteApp(app, { ...this.props, ...options });
      } finally {
        await this.destroyProviders();
      }
    });
  }
  hydrate(app) {
    return hydrate(app, this.props);
  }
  async destroyProviders() {
    await Promise.all(this.props.providers.map((p) => {
      return p.destroy?.();
    }));
  }
}
// src/backend/memory/state.ts
class MemoryStateBackend {
  states = new Map;
  async get(urn) {
    return this.states.get(urn);
  }
  async update(urn, state) {
    this.states.set(urn, state);
  }
  async delete(urn) {
    this.states.delete(urn);
  }
  clear() {
    this.states.clear();
  }
}
// src/backend/memory/lock.ts
class MemoryLockBackend {
  locks = new Map;
  async insecureReleaseLock(urn) {
    this.locks.delete(urn);
  }
  async locked(urn) {
    return this.locks.has(urn);
  }
  async lock(urn) {
    if (this.locks.has(urn)) {
      throw new Error("Already locked");
    }
    const id = Math.random();
    this.locks.set(urn, id);
    return async () => {
      if (this.locks.get(urn) === id) {
        this.locks.delete(urn);
      }
    };
  }
  clear() {
    this.locks.clear();
  }
}
// src/backend/file/state.ts
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
var debug8 = createDebugger("State");

class FileStateBackend {
  props;
  constructor(props) {
    this.props = props;
  }
  stateFile(urn) {
    return join(this.props.dir, `${urn}.json`);
  }
  async mkdir() {
    await mkdir(this.props.dir, {
      recursive: true
    });
  }
  async get(urn) {
    debug8("get");
    let json;
    try {
      json = await readFile(join(this.stateFile(urn)), "utf8");
    } catch (error) {
      return;
    }
    return JSON.parse(json);
  }
  async update(urn, state) {
    debug8("update");
    await this.mkdir();
    await writeFile(this.stateFile(urn), JSON.stringify(state, undefined, 2));
  }
  async delete(urn) {
    debug8("delete");
    await this.mkdir();
    await rm(this.stateFile(urn));
  }
}
// src/backend/file/lock.ts
import { mkdir as mkdir2, rm as rm2, stat } from "node:fs/promises";
import { join as join2 } from "node:path";
import { lock } from "proper-lockfile";

class FileLockBackend {
  props;
  constructor(props) {
    this.props = props;
  }
  lockFile(urn) {
    return join2(this.props.dir, `${urn}.lock`);
  }
  async mkdir() {
    await mkdir2(this.props.dir, {
      recursive: true
    });
  }
  async insecureReleaseLock(urn) {
    if (await this.locked(urn)) {
      await rm2(this.lockFile(urn));
    }
  }
  async locked(urn) {
    const result = await stat(this.lockFile(urn));
    return result.isFile();
  }
  async lock(urn) {
    await this.mkdir();
    return lock(this.lockFile(urn), {
      realpath: false
    });
  }
}
// src/backend/aws/s3-state.ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException
} from "@aws-sdk/client-s3";

class S3StateBackend {
  props;
  client;
  constructor(props) {
    this.props = props;
    this.client = new S3Client(props);
  }
  async get(urn) {
    let result;
    try {
      result = await this.client.send(new GetObjectCommand({
        Bucket: this.props.bucket,
        Key: `${urn}.state`
      }));
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === "NoSuchKey") {
        return;
      }
      throw error;
    }
    if (!result.Body) {
      return;
    }
    const body = await result.Body.transformToString("utf8");
    const state = JSON.parse(body);
    return state;
  }
  async update(urn, state) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.props.bucket,
      Key: `${urn}.state`,
      Body: JSON.stringify(state)
    }));
  }
  async delete(urn) {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.props.bucket,
      Key: `${urn}.state`
    }));
  }
}
// src/backend/aws/dynamodb-lock.ts
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

class DynamoLockBackend {
  props;
  client;
  constructor(props) {
    this.props = props;
    this.client = new DynamoDB(props);
  }
  async insecureReleaseLock(urn) {
    await this.client.updateItem({
      TableName: this.props.tableName,
      Key: marshall({ urn }),
      ExpressionAttributeNames: { "#lock": "lock" },
      UpdateExpression: "REMOVE #lock"
    });
  }
  async locked(urn) {
    const result = await this.client.getItem({
      TableName: this.props.tableName,
      Key: marshall({ urn })
    });
    if (!result.Item) {
      return false;
    }
    const item = unmarshall(result.Item);
    return typeof item.lock === "number";
  }
  async lock(urn) {
    const id = Math.floor(Math.random() * 1e5);
    const props = {
      TableName: this.props.tableName,
      Key: marshall({ urn }),
      ExpressionAttributeNames: { "#lock": "lock" },
      ExpressionAttributeValues: { ":id": marshall(id) }
    };
    await this.client.updateItem({
      ...props,
      UpdateExpression: "SET #lock = :id",
      ConditionExpression: "attribute_not_exists(#lock)"
    });
    return async () => {
      await this.client.updateItem({
        ...props,
        UpdateExpression: "REMOVE #lock",
        ConditionExpression: "#lock = :id"
      });
    };
  }
}
// src/helpers.ts
import { createHash } from "node:crypto";
import { readFile as readFile2 } from "node:fs/promises";
var file = (path, encoding = "utf8") => {
  return new Future(async (resolve2, reject) => {
    try {
      const file2 = await readFile2(path, {
        encoding
      });
      resolve2(file2);
    } catch (error) {
      reject(error);
    }
  });
};
var hash = (path, algo = "sha256") => {
  return file(path).pipe((file2) => createHash(algo).update(file2).digest("hex"));
};

// src/globals.ts
globalThis.$resolve = resolve;
globalThis.$combine = combine;
globalThis.$interpolate = interpolate;
globalThis.$hash = hash;
globalThis.$file = file;

// src/custom/resource.ts
var createCustomResourceClass = (providerId, resourceType) => {
  return new Proxy(class {
  }, {
    construct(_, [parent, id, input, config]) {
      const $ = createMeta("resource", `custom:${providerId}`, parent, resourceType, id, input, config);
      const node = new Proxy({ $ }, {
        get(_2, key) {
          if (key === "$") {
            return $;
          }
          return $.output((data) => data[key]);
        }
      });
      parent.add(node);
      return node;
    }
  });
};
// src/custom/provider.ts
var createCustomProvider = (providerId, resourceProviders) => {
  const version = 1;
  const getProvider = (type) => {
    const provider = resourceProviders[type];
    if (!provider) {
      throw new Error(`The "${providerId}" provider doesn't support the "${type}" resource type.`);
    }
    return provider;
  };
  return {
    ownResource(id) {
      return id === `custom:${providerId}`;
    },
    async getResource({ type, ...props }) {
      const provider = getProvider(type);
      if (!provider.getResource) {
        return {
          version,
          state: props.state
        };
      }
      return {
        version,
        state: await provider.getResource(props)
      };
    },
    async createResource({ type, ...props }) {
      const provider = getProvider(type);
      if (!provider.createResource) {
        return {
          version,
          state: props.state
        };
      }
      return {
        version,
        state: await provider.createResource(props)
      };
    },
    async updateResource({ type, ...props }) {
      const provider = getProvider(type);
      if (!provider.updateResource) {
        return {
          version,
          state: props.proposedState
        };
      }
      return {
        version,
        state: await provider.updateResource(props)
      };
    },
    async deleteResource({ type, ...props }) {
      await getProvider(type).deleteResource?.(props);
    },
    async getData({ type, ...props }) {
      return {
        version,
        state: await getProvider(type).getData?.(props) ?? {}
      };
    }
  };
};
export {
  resolveInputs,
  output,
  isResource,
  isNode,
  isDataSource,
  findInputDeps,
  enableDebug,
  deferredOutput,
  createMeta,
  createDebugger,
  createCustomResourceClass,
  createCustomProvider,
  WorkSpace,
  Stack,
  S3StateBackend,
  ResourceNotFound,
  ResourceError,
  ResourceAlreadyExists,
  Output,
  MemoryStateBackend,
  MemoryLockBackend,
  Group,
  Future,
  FileStateBackend,
  FileLockBackend,
  DynamoLockBackend,
  AppError,
  App
};
