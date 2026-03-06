import { useRouter } from 'next/navigation';

export interface CommandResult {
  type: 'NAV' | 'DATA' | 'ERROR' | 'INFO';
  message: string;
  data?: any;
  path?: string;
}

export class TerminalCommandEngine {
  private history: string[] = [];
  
  // OpenBB-style Module Hierarchy
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

    // 1. Navigation Commands
    if (cmd === 'cd' || cmd === 'goto') {
      return { type: 'NAV', message: `Navigating to ${sub}...`, path: `/${sub}` };
    }

    // 2. Module Routing (OpenBB Style)
    if (cmd === 'stocks') {
      if (sub === 'load' && args[0]) {
        window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: args[0].toUpperCase() }));
        return { type: 'DATA', message: `Loaded ${args[0].toUpperCase()} into workspace.` };
      }
      return { type: 'INFO', message: `STOCKS MODULE: ${this.modules.stocks.join(', ')}` };
    }

    if (cmd === 'crypto') {
      if (sub === 'price' && args[0]) {
        window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: args[0].toUpperCase() }));
        return { type: 'DATA', message: `Streaming ${args[0].toUpperCase()} price feed.` };
      }
      return { type: 'INFO', message: `CRYPTO MODULE: ${this.modules.crypto.join(', ')}` };
    }

    // 3. System Commands
    if (cmd === 'clear') {
      return { type: 'INFO', message: 'TERMINAL_BUFFER_CLEARED' };
    }

    if (cmd === 'help') {
      return { 
        type: 'INFO', 
        message: `AVAILABLE MODULES: ${Object.keys(this.modules).join(', ')}. Use 'stocks load AAPL' or 'cd calendar'.` 
      };
    }

    // 4. Fallback: Direct Symbol Lookup
    if (cmd.length <= 5 && !sub) {
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: cmd.toUpperCase() }));
      return { type: 'DATA', message: `Switching context to ${cmd.toUpperCase()}...` };
    }

    return { type: 'ERROR', message: `COMMAND_NOT_FOUND: '${cmd}'. Type 'help' for available modules.` };
  }
}