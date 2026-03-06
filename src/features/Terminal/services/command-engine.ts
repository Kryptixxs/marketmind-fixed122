import {
  BLOOMBERG_FUNCTIONS,
  commandHints,
  dispatchFunctionCode,
  dispatchSymbol,
  dispatchWorkspace,
  resolveBloombergFunction,
  resolveRouteAlias,
  resolveSymbolFunction,
  resolveWorkspaceAlias,
  WORKSPACE_FUNCTIONS,
} from './command-registry';

export interface CommandResult {
  type: 'NAV' | 'DATA' | 'ERROR' | 'INFO';
  message: string;
  data?: any;
  path?: string;
}

export class TerminalCommandEngine {
  private history: string[] = [];
  private hints = commandHints();

  private modules = {
    'stocks': ['load', 'quote', 'options', 'insider', 'financials'],
    'crypto': ['price', 'onchain', 'defi'],
    'forex': ['price', 'calendar'],
    'economy': ['gdp', 'cpi', 'rates'],
    'fixedincome': ['yields', 'spreads'],
    'terminal': ['settings', 'clear', 'exit']
  };

  public parse(input: string): CommandResult {
    const parts = input.toLowerCase().trim().split(' ');
    const cmd = parts[0];
    const sub = parts[1];
    const args = parts.slice(2);

    this.history.push(input);

    if (cmd === 'cd' || cmd === 'goto') {
      const route = resolveRouteAlias(sub);
      if (route) return { type: 'NAV', message: `→ ${sub}`, path: route };
      return { type: 'NAV', message: `→ ${sub}`, path: `/${sub}` };
    }

    // Bloomberg-style: "go <function>" where function can be route, workspace, or symbol.
    if (cmd === 'go') {
      if (!sub) return { type: 'INFO', message: 'Usage: GO <function|symbol>' };
      const workspace = resolveWorkspaceAlias(sub);
      if (workspace) {
        dispatchWorkspace(workspace);
        return { type: 'INFO', message: `Workspace ${workspace} loaded` };
      }
      const bloombergFn = resolveBloombergFunction(sub);
      if (bloombergFn) {
        dispatchFunctionCode(bloombergFn.code);
        return { type: 'NAV', message: `${bloombergFn.code} — ${bloombergFn.label}`, path: bloombergFn.path };
      }
      const route = resolveRouteAlias(sub);
      if (route) return { type: 'NAV', message: `→ ${sub.toUpperCase()}`, path: route };
      if (sub.length <= 8) {
        dispatchSymbol(sub);
        return { type: 'DATA', message: `Loaded ${sub.toUpperCase()} monitor` };
      }
    }

    // Symbol-function pattern: "<symbol> <fn>" e.g. "aapl gp"
    if (cmd.length <= 8 && sub) {
      const symbol = cmd.toUpperCase();
      const symbolFn = resolveSymbolFunction(sub);
      if (symbolFn) {
        dispatchSymbol(symbol);
        return { type: 'NAV', message: `${symbol} ${symbolFn.label}`, path: symbolFn.path };
      }
    }

    if (cmd === 'stocks') {
      if (sub === 'load' && args[0]) {
        dispatchSymbol(args[0]);
        return { type: 'DATA', message: `Loaded ${args[0].toUpperCase()}` };
      }
      return { type: 'INFO', message: `STOCKS: ${this.modules.stocks.join(', ')}` };
    }

    if (cmd === 'crypto') {
      if (sub === 'price' && args[0]) {
        dispatchSymbol(args[0]);
        return { type: 'DATA', message: `Streaming ${args[0].toUpperCase()}` };
      }
      return { type: 'INFO', message: `CRYPTO: ${this.modules.crypto.join(', ')}` };
    }

    if (cmd === 'clear') return { type: 'INFO', message: 'Buffer cleared' };

    if (cmd === 'help' || cmd === '?') {
      return {
        type: 'INFO',
        message: `GO <route|symbol|workspace|fn> | <symbol> GP/NEWS/OPT/FA | Workspaces: ${WORKSPACE_FUNCTIONS.map((w) => w.code).join('/')} | Fn: ${BLOOMBERG_FUNCTIONS.map((f) => f.code).join('/')}`
      };
    }

    const route = resolveRouteAlias(cmd);
    if (route) return { type: 'NAV', message: `→ ${cmd}`, path: route };

    const bloombergFn = resolveBloombergFunction(cmd);
    if (bloombergFn) {
      dispatchFunctionCode(bloombergFn.code);
      return { type: 'NAV', message: `${bloombergFn.code} — ${bloombergFn.label}`, path: bloombergFn.path };
    }

    if (cmd.length <= 6 && !sub) {
      dispatchSymbol(cmd);
      return { type: 'DATA', message: `→ ${cmd.toUpperCase()}` };
    }

    return { type: 'ERROR', message: `Unknown: '${cmd}'. Type 'help' for commands.` };
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public suggest(input: string): string | null {
    const q = input.trim().toLowerCase();
    if (!q) return null;
    const hit = this.hints.find((h) => h.toLowerCase().startsWith(q));
    return hit ?? null;
  }
}
