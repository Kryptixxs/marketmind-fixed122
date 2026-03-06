export interface CommandResult {
  type: 'NAV' | 'DATA' | 'ERROR' | 'INFO';
  message: string;
  data?: any;
  path?: string;
}

export class TerminalCommandEngine {
  private history: string[] = [];

  private modules = {
    'stocks': ['load', 'quote', 'options', 'insider', 'financials'],
    'crypto': ['price', 'onchain', 'defi'],
    'forex': ['price', 'calendar'],
    'economy': ['gdp', 'cpi', 'rates'],
    'fixedincome': ['yields', 'spreads'],
    'terminal': ['settings', 'clear', 'exit']
  };

  private routes: Record<string, string> = {
    'dashboard': '/dashboard',
    'home': '/dashboard',
    'charts': '/charts',
    'markets': '/charts',
    'screener': '/screener',
    'screen': '/screener',
    'portfolio': '/portfolio',
    'port': '/portfolio',
    'calendar': '/calendar',
    'cal': '/calendar',
    'news': '/news',
    'wire': '/news',
    'confluences': '/confluences',
    'quant': '/confluences',
    'algo': '/algo',
    'backtest': '/algo',
    'tools': '/tools',
    'options': '/tools/options',
    'forex': '/tools/forex',
    'futures': '/tools/futures',
    'settings': '/account',
    'account': '/account',
    'billing': '/billing',
  };

  public parse(input: string): CommandResult {
    const parts = input.toLowerCase().trim().split(' ');
    const cmd = parts[0];
    const sub = parts[1];
    const args = parts.slice(2);

    this.history.push(input);

    if (cmd === 'cd' || cmd === 'goto' || cmd === 'go') {
      const route = this.routes[sub];
      if (route) return { type: 'NAV', message: `→ ${sub}`, path: route };
      return { type: 'NAV', message: `→ ${sub}`, path: `/${sub}` };
    }

    if (cmd === 'stocks') {
      if (sub === 'load' && args[0]) {
        window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: args[0].toUpperCase() }));
        return { type: 'DATA', message: `Loaded ${args[0].toUpperCase()}` };
      }
      return { type: 'INFO', message: `STOCKS: ${this.modules.stocks.join(', ')}` };
    }

    if (cmd === 'crypto') {
      if (sub === 'price' && args[0]) {
        window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: args[0].toUpperCase() }));
        return { type: 'DATA', message: `Streaming ${args[0].toUpperCase()}` };
      }
      return { type: 'INFO', message: `CRYPTO: ${this.modules.crypto.join(', ')}` };
    }

    if (cmd === 'clear') return { type: 'INFO', message: 'Buffer cleared' };

    if (cmd === 'help' || cmd === '?') {
      return {
        type: 'INFO',
        message: `Modules: ${Object.keys(this.modules).join(', ')} | Routes: cd <page> | Direct: <SYMBOL>`
      };
    }

    const route = this.routes[cmd];
    if (route) return { type: 'NAV', message: `→ ${cmd}`, path: route };

    if (cmd.length <= 6 && !sub) {
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: cmd.toUpperCase() }));
      return { type: 'DATA', message: `→ ${cmd.toUpperCase()}` };
    }

    return { type: 'ERROR', message: `Unknown: '${cmd}'. Type 'help' for commands.` };
  }
}
