'use client';

export type DockMode = 'tile' | 'tab' | 'stack';
export type PinbarDock = 'top' | 'bottom' | 'left' | 'right';

export type DockSplitDirection = 'horizontal' | 'vertical';
export type DockInsertMode = 'tab' | 'split-horizontal' | 'split-vertical';

export interface DockTabsNode {
  id: string;
  type: 'tabs';
  tabs: number[];
  activeTab: number;
}

export interface DockSplitNode {
  id: string;
  type: 'split';
  direction: DockSplitDirection;
  sizes: [number, number];
  children: [DockNode, DockNode];
}

export type DockNode = DockTabsNode | DockSplitNode;

export interface DockLayoutState {
  mode: DockMode;
  columns: number;
  floatingPanels: number[];
  focusFullscreen: boolean;
  pinbarVisible: boolean;
  pinbarDock: PinbarDock;
  navtreeVisible: boolean;
  root: DockNode;
  secondaryRoot: DockNode | null;
  twoUpMode: boolean;
  activeWorkspace: 'left' | 'right';
  highDensityMode: boolean;
  highDensityLiveMode: boolean;
}

const KEY = 'vantage-dock-layout-v1';

let nextNodeSeq = 1;
const makeNodeId = (prefix: string) => `${prefix}-${nextNodeSeq++}`;

function makeTabsNode(tabs: number[], activeTab?: number): DockTabsNode {
  const clean = Array.from(new Set(tabs)).sort((a, b) => a - b);
  return {
    id: makeNodeId('tabs'),
    type: 'tabs',
    tabs: clean,
    activeTab: activeTab ?? clean[0] ?? 0,
  };
}

function makeSplitNode(direction: DockSplitDirection, left: DockNode, right: DockNode, sizes: [number, number] = [50, 50]): DockSplitNode {
  return {
    id: makeNodeId('split'),
    type: 'split',
    direction,
    sizes,
    children: [left, right],
  };
}

function collectTabs(node: DockNode): number[] {
  if (node.type === 'tabs') return [...node.tabs];
  return [...collectTabs(node.children[0]), ...collectTabs(node.children[1])];
}

function buildDefaultRoot(panelIds: number[]): DockNode {
  const ids = Array.from(new Set(panelIds)).sort((a, b) => a - b);
  if (ids.length <= 1) return makeTabsNode(ids.length ? ids : [0]);
  if (ids.length === 2) return makeSplitNode('horizontal', makeTabsNode([ids[0]!]), makeTabsNode([ids[1]!]));
  if (ids.length === 3) {
    return makeSplitNode(
      'horizontal',
      makeSplitNode('vertical', makeTabsNode([ids[0]!]), makeTabsNode([ids[2]!])),
      makeTabsNode([ids[1]!]),
    );
  }
  const firstFour = ids.slice(0, 4);
  const left = makeSplitNode('vertical', makeTabsNode([firstFour[0]!]), makeTabsNode([firstFour[2]!]));
  const right = makeSplitNode('vertical', makeTabsNode([firstFour[1]!]), makeTabsNode([firstFour[3]!]));
  let root: DockNode = makeSplitNode('horizontal', left, right);
  if (ids.length > 4) {
    const extra = ids.slice(4);
    root = makeSplitNode('horizontal', root, makeTabsNode(extra));
  }
  return root;
}

function normalizeTree(node: DockNode): DockNode | null {
  if (node.type === 'tabs') {
    const tabs = Array.from(new Set(node.tabs)).sort((a, b) => a - b);
    if (tabs.length === 0) return null;
    const active = tabs.includes(node.activeTab) ? node.activeTab : tabs[0]!;
    return { ...node, tabs, activeTab: active };
  }
  const a = normalizeTree(node.children[0]);
  const b = normalizeTree(node.children[1]);
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return {
    ...node,
    sizes: node.sizes,
    children: [a, b],
  };
}

function mapNode(node: DockNode, fn: (n: DockNode) => DockNode): DockNode {
  if (node.type === 'split') {
    const next: DockNode = {
      ...node,
      children: [
        mapNode(node.children[0], fn),
        mapNode(node.children[1], fn),
      ],
    };
    return fn(next);
  }
  return fn(node);
}

function findTabsNodeIdByPane(node: DockNode, paneIdx: number): string | null {
  if (node.type === 'tabs') return node.tabs.includes(paneIdx) ? node.id : null;
  return findTabsNodeIdByPane(node.children[0], paneIdx) ?? findTabsNodeIdByPane(node.children[1], paneIdx);
}

function findFirstTabsNodeId(node: DockNode): string {
  if (node.type === 'tabs') return node.id;
  return findFirstTabsNodeId(node.children[0]);
}

function insertPaneAtNode(node: DockNode, tabsNodeId: string, newPaneIdx: number, mode: DockInsertMode): DockNode {
  if (node.type === 'tabs') {
    if (node.id !== tabsNodeId) return node;
    if (mode === 'tab') {
      const tabs = Array.from(new Set([...node.tabs, newPaneIdx])).sort((a, b) => a - b);
      return { ...node, tabs, activeTab: newPaneIdx };
    }
    const direction: DockSplitDirection = mode === 'split-horizontal' ? 'horizontal' : 'vertical';
    return makeSplitNode(direction, node, makeTabsNode([newPaneIdx], newPaneIdx));
  }
  return {
    ...node,
    children: [
      insertPaneAtNode(node.children[0], tabsNodeId, newPaneIdx, mode),
      insertPaneAtNode(node.children[1], tabsNodeId, newPaneIdx, mode),
    ],
  };
}

function removePane(node: DockNode, paneIdx: number): DockNode | null {
  if (node.type === 'tabs') {
    if (!node.tabs.includes(paneIdx)) return node;
    const tabs = node.tabs.filter((t) => t !== paneIdx);
    if (tabs.length === 0) return null;
    return { ...node, tabs, activeTab: tabs.includes(node.activeTab) ? node.activeTab : tabs[0]! };
  }
  const left = removePane(node.children[0], paneIdx);
  const right = removePane(node.children[1], paneIdx);
  if (!left && !right) return null;
  if (!left) return right;
  if (!right) return left;
  return { ...node, children: [left, right] };
}

function setActiveInTabs(node: DockNode, paneIdx: number): DockNode {
  if (node.type === 'tabs') {
    if (!node.tabs.includes(paneIdx)) return node;
    return { ...node, activeTab: paneIdx };
  }
  return {
    ...node,
    children: [setActiveInTabs(node.children[0], paneIdx), setActiveInTabs(node.children[1], paneIdx)],
  };
}

function setSplitSizes(node: DockNode, nodeId: string, sizes: number[]): DockNode {
  if (node.type === 'tabs') return node;
  const nextSizes: [number, number] = node.id === nodeId
    ? [Math.max(10, Math.min(90, sizes[0] ?? node.sizes[0])), Math.max(10, Math.min(90, sizes[1] ?? node.sizes[1]))]
    : node.sizes;
  return {
    ...node,
    sizes: nextSizes,
    children: [setSplitSizes(node.children[0], nodeId, sizes), setSplitSizes(node.children[1], nodeId, sizes)],
  };
}

const DEFAULT_STATE: DockLayoutState = {
  mode: 'tile',
  columns: 2,
  floatingPanels: [],
  focusFullscreen: false,
  pinbarVisible: true,
  pinbarDock: 'top',
  navtreeVisible: true,
  root: buildDefaultRoot([0, 1, 2, 3]),
  secondaryRoot: null,
  twoUpMode: false,
  activeWorkspace: 'left',
  highDensityMode: false,
  highDensityLiveMode: false,
};

let state: DockLayoutState = DEFAULT_STATE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function save() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadDockLayout() {
  if (typeof window === 'undefined') return state;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return state;
    const parsed = JSON.parse(raw) as Partial<DockLayoutState>;
    const parsedRoot = parsed.root ? normalizeTree(parsed.root) : null;
    state = {
      ...DEFAULT_STATE,
      ...parsed,
      root: parsedRoot ?? DEFAULT_STATE.root,
    };
  } catch {
    state = DEFAULT_STATE;
  }
  return state;
}

export function getDockLayout() {
  return state;
}

export function setDockLayout(next: Partial<DockLayoutState>) {
  state = { ...state, ...next };
  save();
  emit();
}

function removePaneFromRoot(root: DockNode, paneIdx: number): DockNode {
  return normalizeTree(removePane(root, paneIdx) ?? root) ?? buildDefaultRoot([0]);
}

function addPaneToRoot(root: DockNode, paneIdx: number): DockNode {
  if (collectTabs(root).includes(paneIdx)) return root;
  const next = insertPaneAtNode(root, findFirstTabsNodeId(root), paneIdx, 'tab');
  return normalizeTree(next) ?? buildDefaultRoot([paneIdx]);
}

function getWorkspaceRoot(workspace: 'left' | 'right'): DockNode {
  if (workspace === 'right') return state.secondaryRoot ?? buildDefaultRoot([0]);
  return state.root;
}

function setWorkspaceRoot(workspace: 'left' | 'right', root: DockNode) {
  if (workspace === 'right') state = { ...state, secondaryRoot: root };
  else state = { ...state, root };
}

export function setPanelFloating(panelIdx: number, floating: boolean) {
  const set = new Set(state.floatingPanels);
  if (floating) set.add(panelIdx);
  else set.delete(panelIdx);
  state = { ...state, floatingPanels: Array.from(set).sort((a, b) => a - b) };
  if (floating) {
    state.root = removePaneFromRoot(state.root, panelIdx);
    if (state.secondaryRoot) state.secondaryRoot = removePaneFromRoot(state.secondaryRoot, panelIdx);
  } else {
    if (state.activeWorkspace === 'right' && state.secondaryRoot) state.secondaryRoot = addPaneToRoot(state.secondaryRoot, panelIdx);
    else state.root = addPaneToRoot(state.root, panelIdx);
  }
  save();
  emit();
}

export function getDockPaneOrder(workspace: 'left' | 'right' | 'all' = 'all'): number[] {
  const from = workspace === 'left'
    ? collectTabs(state.root)
    : workspace === 'right'
      ? collectTabs(state.secondaryRoot ?? buildDefaultRoot([]))
      : [...collectTabs(state.root), ...collectTabs(state.secondaryRoot ?? buildDefaultRoot([]))];
  return Array.from(new Set(from)).sort((a, b) => a - b);
}

export function getNextDockPane(currentPaneIdx: number, workspace: 'left' | 'right' | 'all' = 'all'): number | null {
  const order = getDockPaneOrder(workspace);
  if (order.length === 0) return null;
  const at = order.indexOf(currentPaneIdx);
  if (at < 0) return order[0] ?? null;
  return order[at + 1] ?? null;
}

export function ensurePaneInDock(paneIdx: number, workspace: 'left' | 'right' = state.activeWorkspace) {
  if (getDockPaneOrder(workspace).includes(paneIdx)) return;
  const root = getWorkspaceRoot(workspace);
  const next = insertPaneAtNode(root, findFirstTabsNodeId(root), paneIdx, 'tab');
  setWorkspaceRoot(workspace, normalizeTree(next) ?? buildDefaultRoot([paneIdx]));
  save();
  emit();
}

export function setActiveDockTab(paneIdx: number, workspace: 'left' | 'right' = state.activeWorkspace) {
  const root = getWorkspaceRoot(workspace);
  const next = setActiveInTabs(root, paneIdx);
  setWorkspaceRoot(workspace, next);
  save();
  emit();
}

export function insertPaneRelative(targetPaneIdx: number, newPaneIdx: number, mode: DockInsertMode = 'tab', workspace: 'left' | 'right' = state.activeWorkspace) {
  const root = getWorkspaceRoot(workspace);
  const targetTabsNodeId = findTabsNodeIdByPane(root, targetPaneIdx);
  if (!targetTabsNodeId) {
    ensurePaneInDock(newPaneIdx, workspace);
    return;
  }
  const next = insertPaneAtNode(root, targetTabsNodeId, newPaneIdx, mode);
  setWorkspaceRoot(workspace, normalizeTree(next) ?? buildDefaultRoot([targetPaneIdx, newPaneIdx]));
  save();
  emit();
}

export function closePaneInDock(paneIdx: number, workspace: 'left' | 'right' = state.activeWorkspace) {
  const root = getWorkspaceRoot(workspace);
  const nextRoot = normalizeTree(removePane(root, paneIdx) ?? root) ?? buildDefaultRoot([0]);
  setWorkspaceRoot(workspace, nextRoot);
  save();
  emit();
}

export function setSplitNodeSizes(nodeId: string, sizes: number[]) {
  state = { ...state, root: setSplitSizes(state.root, nodeId, sizes) };
  save();
  emit();
}

export function replaceDockRoot(root: DockNode) {
  state = { ...state, root: normalizeTree(root) ?? state.root };
  save();
  emit();
}

export function replaceSecondaryDockRoot(root: DockNode | null) {
  state = { ...state, secondaryRoot: root ? (normalizeTree(root) ?? state.secondaryRoot) : null };
  save();
  emit();
}

export function setActiveWorkspace(workspace: 'left' | 'right') {
  state = { ...state, activeWorkspace: workspace };
  save();
  emit();
}

export function subscribeDockLayout(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

