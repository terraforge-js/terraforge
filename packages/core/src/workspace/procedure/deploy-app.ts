import { App } from '../../app.ts'
import { createDebugger } from '../../debug.ts'
import { resolveInputs } from '../../input.ts'
import { getMeta, isDataSource, isResource, type Node } from '../../node.ts'
import { findProvider } from '../../provider.ts'
import { Stack } from '../../stack.ts'
import { URN } from '../../urn.ts'
import { createConcurrencyQueue } from '../concurrency.ts'
import {
	allowsDependentReplace,
	DependencyGraph,
	dependentsOn,
	findDependencyPaths,
	getAtPath,
	stripDependencyInputs,
} from '../dependency.ts'
import { entries } from '../entries.ts'
import { AppError, ResourceError } from '../error.ts'
import { withOnExit } from '../exit.ts'
import { requiresReplacement } from '../replacement.ts'
import { compareState, NodeState, removeEmptyStackStates, StackState } from '../state.ts'
import { migrateAppState } from '../state/migrate.ts'
import { ProcedureOptions, WorkSpaceOptions } from '../workspace.ts'
import { createResource } from './create-resource.ts'
import { deleteResource } from './delete-resource.ts'
import { getDataSource } from './get-data-source.ts'
import { importResource } from './import-resource.ts'
import { replaceResource } from './replace-resource.ts'
import { updateResource } from './update-resource.ts'

const debug = createDebugger('Deploy App')

export const deployApp = async (app: App, opt: WorkSpaceOptions & ProcedureOptions) => {
	debug(app.name, 'start')

	const stackNameByNodeUrn = new Map<URN, string>()

	// -------------------------------------------------------
	// Add a deploy log

	await opt.backend.activityLog?.log(app.urn, {
		action: 'deploy',
		filters: opt.filters,
	})

	// -------------------------------------------------------
	// Get latest state

	const latestState = await opt.backend.state.get(app.urn)

	// -------------------------------------------------------
	// Migrate the state file to the latest version

	const appState = migrateAppState(
		latestState ?? {
			name: app.name,
			stacks: {},
		}
	)

	// -------------------------------------------------------
	// Save state on process graceful exit. The listener is
	// released on every path, including throws.

	return withOnExit(
		async () => {
			await opt.backend.state.update(app.urn, appState)
		},
		async () => {
			// -------------------------------------------------------
			// Set the idempotent token when no token exists.

			if (opt.idempotentToken || !appState.idempotentToken) {
				appState.idempotentToken = opt.idempotentToken ?? crypto.randomUUID()

				await opt.backend.state.update(app.urn, appState)
			}

			// -------------------------------------------------------
			// Filter only the selected stacks

			let stacks = app.stacks
			let filteredOutStacks: Stack[] = []

			if (opt.filters && opt.filters.length > 0) {
				stacks = app.stacks.filter(stack => opt.filters!.includes(stack.name))
				filteredOutStacks = app.stacks.filter(stack => !opt.filters!.includes(stack.name))
			}

			// -------------------------------------------------------------------
			// Cache nodes and stack state for dependent planning inside replace.

			const nodeByUrn = new Map<URN, Node>()
			const stackStates = new Map<URN, StackState>()
			const plannedDependents = new Set<URN>()
			const forcedUpdateDependents = new Set<URN>()

			for (const stack of stacks) {
				const stackState = (appState.stacks[stack.urn] =
					appState.stacks[stack.urn] ??
					({
						name: stack.name,
						nodes: {},
					} satisfies StackState))

				stackStates.set(stack.urn, stackState)

				for (const node of stack.nodes) {
					nodeByUrn.set(getMeta(node).urn, node)
				}
			}

			// -------------------------------------------------------
			// Build deployment graph

			const queue = createConcurrencyQueue(opt.concurrency ?? 10)
			const graph = new DependencyGraph()

			// -------------------------------------------------------

			const allNodes: Record<URN, NodeState> = {}

			for (const stackState of Object.values(appState.stacks)) {
				for (const [urn, nodeState] of entries(stackState.nodes)) {
					allNodes[urn] = nodeState
					stackNameByNodeUrn.set(urn, stackState.name)
				}
			}

			// -------------------------------------------------------
			// First hydrate the resources that we won't deploy

			for (const stack of filteredOutStacks) {
				const stackState = appState.stacks[stack.urn]

				if (stackState) {
					for (const node of stack.nodes) {
						const meta = getMeta(node)
						const nodeState = stackState.nodes[meta.urn]

						if (nodeState && nodeState.output) {
							graph.add(meta.urn, [], async () => {
								debug('hydrate', meta.urn)
								meta.resolve(nodeState.output)
							})
						}
					}
				}
			}

			// -------------------------------------------------------
			// Delete the resources from stacks that have been removed

			for (const [urn, stackState] of entries(appState.stacks)) {
				const found = app.stacks.find(stack => {
					return stack.urn === urn
				})

				const isFilteredIn = !opt.filters?.length || opt.filters.includes(stackState.name)

				if (!found && isFilteredIn) {
					for (const [urn, nodeState] of entries(stackState.nodes)) {
						graph.add(urn, dependentsOn(allNodes, urn), async () => {
							if (nodeState.tag === 'resource') {
								await queue(() =>
									deleteResource(
										//
										appState.idempotentToken!,
										urn,
										nodeState,
										opt
									)
								)
							}

							delete stackState.nodes[urn]
						})
					}
				}
			}

			// -------------------------------------------------------
			// Sync the stacks that still exist

			for (const stack of stacks) {
				const stackState = stackStates.get(stack.urn)!

				// -------------------------------------------------------------------
				// Delete resources that no longer exist in the stack

				for (const [urn, nodeState] of entries(stackState.nodes)) {
					const resource = stack.nodes.find(r => getMeta(r).urn === urn)

					if (!resource) {
						graph.add(urn, dependentsOn(allNodes, urn), async () => {
							if (nodeState.tag === 'resource') {
								await queue(() =>
									deleteResource(
										//
										appState.idempotentToken!,
										urn,
										nodeState,
										opt
									)
								)
							}

							delete stackState.nodes[urn]
						})
					}
				}

				// -------------------------------------------------------------------
				// Create or update resources

				for (const node of stack.nodes) {
					const meta = getMeta(node)
					const dependencies: URN[] = [...meta.dependencies]

					const partialNewResourceState = {
						dependencies,
						lifecycle: isResource(node)
							? {
									// deleteAfterCreate: meta.config?.deleteAfterCreate,
									retainOnDelete: getMeta(node).config?.retainOnDelete,
								}
							: undefined,
					}

					graph.add(meta.urn, dependencies, () => {
						return queue(async () => {
							let nodeState = stackState.nodes[meta.urn]

							let input
							try {
								input = await resolveInputs(meta.input)
							} catch (error) {
								throw ResourceError.wrap(
									//
									meta.urn,
									meta.type,
									'resolve',
									error
								)
							}

							// --------------------------------------------------
							// Data Source
							// --------------------------------------------------

							if (isDataSource(node)) {
								const meta = getMeta(node)
								if (!nodeState) {
									// NEW
									const dataSourceState = await getDataSource(meta, input, opt)
									nodeState = stackState.nodes[meta.urn] = {
										...dataSourceState,
										drifted: undefined,
										...partialNewResourceState,
									}
								} else if (!compareState(nodeState.input, input) || nodeState.drifted) {
									// UPDATE
									const dataSourceState = await getDataSource(meta, input, opt)
									Object.assign(nodeState, {
										...dataSourceState,
										drifted: undefined,
										...partialNewResourceState,
									})
								} else {
									Object.assign(nodeState, partialNewResourceState)
								}
							}

							// --------------------------------------------------
							// Resource
							// --------------------------------------------------

							if (isResource(node)) {
								const meta = getMeta(node)
								// --------------------------------------------------
								// New resource

								if (!nodeState) {
									// --------------------------------------------------
									// Import resource if needed

									if (meta.config?.import) {
										const importedState = await importResource(node, input, opt)
										const newResourceState = await updateResource(
											node,
											appState.idempotentToken!,
											importedState.input,
											importedState.output,
											input,
											opt
										)

										nodeState = stackState.nodes[meta.urn] = {
											...importedState,
											...newResourceState,
											...partialNewResourceState,
										}
									} else {
										// --------------------------------------------------
										// Create resource

										const newResourceState = await createResource(
											node,
											appState.idempotentToken!,
											input,
											opt
										)

										nodeState = stackState.nodes[meta.urn] = {
											...newResourceState,
											...partialNewResourceState,
										}
									}
								} else {
									const inputChanged = !compareState(nodeState.input, input)
									const hasDrift = !!nodeState.drifted

									if (!inputChanged && !hasDrift) {
										Object.assign(nodeState, partialNewResourceState)
									} else {
										let newResourceState

										// Dependent updates may be forced to detach/reattach during replacements.
										const ignoreReplace = forcedUpdateDependents.has(meta.urn)

										if (
											!ignoreReplace &&
											requiresReplacement(
												nodeState.input,
												input,
												meta.config?.replaceOnChanges ?? []
											)
										) {
											// --------------------------------------------------
											// Replace resource (optionally create before delete).

											if (meta.config?.createBeforeReplace) {
												// Validate dependents can handle the replacement before creating new resource.
												meta.resolve(input)

												try {
													for (const [dependentUrn, dependentNode] of nodeByUrn.entries()) {
														if (!isResource(dependentNode)) {
															continue
														}

														const dependentMeta = getMeta(dependentNode)
														if (!dependentMeta.dependencies.has(meta.urn)) {
															continue
														}

														const dependentStackState = stackStates.get(
															dependentMeta.stack.urn
														)
														const dependentState = dependentStackState?.nodes[dependentUrn]
														if (!dependentStackState || !dependentState) {
															continue
														}

														const dependencyPaths = findDependencyPaths(
															dependentMeta.input,
															meta.urn
														)
														if (dependencyPaths.length === 0) {
															continue
														}

														const dependentProvider = findProvider(
															opt.providers,
															dependentMeta.provider
														)
														if (dependentProvider.planResourceChange) {
															// Unrelated dependencies may not have resolved yet.
															// Their proposed value is "unchanged", so fall back
															// to the dependent's prior input from state.
															const dependentProposedInput = await resolveInputs(
																dependentMeta.input,
																path => getAtPath(dependentState.input, path)
															)

															const dependentPlan =
																await dependentProvider.planResourceChange({
																	type: dependentMeta.type,
																	priorState: dependentState.output,
																	proposedState: dependentProposedInput,
																})

															if (dependentPlan.requiresReplacement) {
																if (
																	!allowsDependentReplace(
																		dependentMeta.config?.replaceOnChanges,
																		dependencyPaths
																	)
																) {
																	throw ResourceError.wrap(
																		dependentMeta.urn,
																		dependentMeta.type,
																		'update',
																		new Error(
																			`Replacing ${meta.urn} requires ${dependentMeta.urn} to set replaceOnChanges for its dependency fields.`
																		)
																	)
																}
															}
														}
													}
												} finally {
													meta.resolve(nodeState.output)
												}

												// Create new output first; delete old output after dependents update.
												const priorState = { ...nodeState }
												newResourceState = await createResource(
													node,
													appState.idempotentToken!,
													input,
													opt
												)

												// Resolve immediately so dependents can access the new output
												if (newResourceState.output) {
													meta.resolve(newResourceState.output)
												}

												if (!meta.config?.retainOnDelete) {
													appState.pendingDeletes ??= {}
													appState.pendingDeletes[meta.urn] = priorState
												}
											} else {
												// Replace resource while safely detaching dependents first.
												for (const [dependentUrn, dependentNode] of nodeByUrn.entries()) {
													if (!isResource(dependentNode)) {
														continue
													}

													const dependentMeta = getMeta(dependentNode)
													if (!dependentMeta.dependencies.has(meta.urn)) {
														continue
													}

													if (plannedDependents.has(dependentUrn)) {
														continue
													}

													const dependentStackState = stackStates.get(dependentMeta.stack.urn)
													const dependentState = dependentStackState?.nodes[dependentUrn]
													if (!dependentStackState || !dependentState) {
														continue
													}

													// Only operate on inputs that actually reference this dependency.
													const dependencyPaths = findDependencyPaths(
														dependentMeta.input,
														meta.urn
													)
													if (dependencyPaths.length === 0) {
														continue
													}

													// Detach dependency references before deleting the old dependency.
													const detachedInput = stripDependencyInputs(
														dependentState.input,
														dependentMeta.input,
														meta.urn
													)

													if (compareState(dependentState.input, detachedInput)) {
														continue
													}

													plannedDependents.add(dependentUrn)

													let dependentRequiresReplacement = false
													const dependentProvider = findProvider(
														opt.providers,
														dependentMeta.provider
													)
													if (dependentProvider.planResourceChange) {
														try {
															const dependentPlan =
																await dependentProvider.planResourceChange({
																	type: dependentMeta.type,
																	priorState: dependentState.output,
																	proposedState: detachedInput,
																})
															dependentRequiresReplacement =
																dependentPlan.requiresReplacement
														} catch (error) {
															throw ResourceError.wrap(
																dependentMeta.urn,
																dependentMeta.type,
																'update',
																error
															)
														}
													}

													if (dependentRequiresReplacement) {
														// If a dependent can't be updated, it must be deleted/recreated.
														if (
															!allowsDependentReplace(
																dependentMeta.config?.replaceOnChanges,
																dependencyPaths
															)
														) {
															throw ResourceError.wrap(
																dependentMeta.urn,
																dependentMeta.type,
																'update',
																new Error(
																	`Replacing ${meta.urn} requires ${dependentMeta.urn} to set replaceOnChanges for its dependency fields.`
																)
															)
														}

														await deleteResource(
															appState.idempotentToken!,
															dependentUrn,
															dependentState,
															opt
														)
														delete dependentStackState.nodes[dependentUrn]
													} else {
														// Update dependents to detach now and reattach later.
														const updated = await updateResource(
															dependentNode,
															appState.idempotentToken!,
															dependentState.input,
															dependentState.output,
															detachedInput,
															opt
														)

														Object.assign(dependentState, {
															input: detachedInput,
															...updated,
														})

														forcedUpdateDependents.add(dependentUrn)
													}
												}

												newResourceState = await replaceResource(
													node,
													appState.idempotentToken!,
													nodeState.input,
													nodeState.output,
													input,
													opt
												)

												// Resolve immediately so dependents can access the new output
												if (newResourceState.output) {
													meta.resolve(newResourceState.output)
												}
											}
										} else {
											// --------------------------------------------------
											// Update resource

											newResourceState = await updateResource(
												node,
												appState.idempotentToken!,
												nodeState.input,
												nodeState.output,
												input,
												opt
											)

											if (ignoreReplace) {
												forcedUpdateDependents.delete(meta.urn)
											}
										}

										Object.assign(nodeState, {
											input,
											drifted: undefined,
											...newResourceState,
											...partialNewResourceState,
										})
									}
								}
							}

							// --------------------------------------------------
							// Hydrate node

							if (nodeState?.output) {
								meta.resolve(nodeState.output)
							}
						})
					})
				}
			}

			// -------------------------------------------------------------------
			// Execute deployment graph

			const errors = await graph.run()

			if (errors.length === 0 && appState.pendingDeletes) {
				for (const [urn, nodeState] of entries(appState.pendingDeletes)) {
					const stackName = stackNameByNodeUrn.get(urn)
					if (opt.filters?.length && (!stackName || !opt.filters.includes(stackName))) {
						continue
					}

					try {
						await deleteResource(appState.idempotentToken!, urn, nodeState, opt)
						delete appState.pendingDeletes[urn]
					} catch (error) {
						if (error instanceof Error) {
							errors.push(error)
						} else {
							errors.push(new Error(`${error}`))
						}
					}
				}

				if (Object.keys(appState.pendingDeletes).length === 0) {
					delete appState.pendingDeletes
				}
			}

			// -------------------------------------------------------------------
			// Remove empty stacks from app state

			removeEmptyStackStates(appState)

			// -------------------------------------------------------------------
			// Delete the idempotent token only when the deployment succeeded.
			// A retry after a failure must reuse the same token so provider-side
			// idempotency can dedupe half-finished operations.

			if (errors.length === 0) {
				delete appState.idempotentToken
			}

			// -------------------------------------------------------------------
			// Save state

			await opt.backend.state.update(app.urn, appState)

			debug(app.name, 'done')

			// -------------------------------------------------------------------

			if (errors.length > 0) {
				throw new AppError(app.name, [...new Set(errors)], 'Deploying app failed.')
			}

			// -------------------------------------------------------
			// If no errors happened we can safely delete the app
			// state when all the stacks have been deleted — unless
			// pending deletes still reference orphaned resources.

			if (
				Object.keys(appState.stacks).length === 0 &&
				Object.keys(appState.pendingDeletes ?? {}).length === 0
			) {
				await opt.backend.state.delete(app.urn)
			}

			return appState
		}
	)
}
