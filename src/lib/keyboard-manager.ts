/**
 * VANTAGE TERMINAL — Keyboard Manager
 * 
 * Context-aware keyboard routing with layered shortcut maps.
 * Global shortcuts persist across all pages; page-specific shortcuts
 * override globals when in context. Focus-aware to prevent conflicts
 * with input fields.
 */

export interface KeyBinding {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    description: string;
    action: () => void;
    /** If true, fires even when an input is focused */
    global?: boolean;
}

type ShortcutLayer = Map<string, KeyBinding>;

class KeyboardManager {
    private globalLayer: ShortcutLayer = new Map();
    private contextLayers: Map<string, ShortcutLayer> = new Map();
    private activeContext: string | null = null;
    private isListening = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.start();
        }
    }

    /**
     * Generate a unique key string for a binding.
     */
    private bindingKey(binding: Partial<KeyBinding>): string {
        const parts: string[] = [];
        if (binding.ctrl) parts.push('ctrl');
        if (binding.shift) parts.push('shift');
        if (binding.alt) parts.push('alt');
        if (binding.meta) parts.push('meta');
        parts.push(binding.key?.toLowerCase() || '');
        return parts.join('+');
    }

    /**
     * Register a global shortcut.
     */
    registerGlobal(binding: KeyBinding): () => void {
        const key = this.bindingKey(binding);
        this.globalLayer.set(key, binding);
        return () => this.globalLayer.delete(key);
    }

    /**
     * Register a context-specific shortcut.
     */
    registerContext(contextId: string, binding: KeyBinding): () => void {
        if (!this.contextLayers.has(contextId)) {
            this.contextLayers.set(contextId, new Map());
        }
        const key = this.bindingKey(binding);
        this.contextLayers.get(contextId)!.set(key, binding);
        return () => this.contextLayers.get(contextId)?.delete(key);
    }

    /**
     * Set the active context for context-specific shortcuts.
     */
    setContext(contextId: string | null): void {
        this.activeContext = contextId;
    }

    /**
     * Get all shortcuts for display purposes.
     */
    getAllShortcuts(): { key: string; description: string; context: string }[] {
        const shortcuts: { key: string; description: string; context: string }[] = [];

        this.globalLayer.forEach((binding, key) => {
            shortcuts.push({ key, description: binding.description, context: 'Global' });
        });

        this.contextLayers.forEach((layer, contextId) => {
            layer.forEach((binding, key) => {
                shortcuts.push({ key, description: binding.description, context: contextId });
            });
        });

        return shortcuts;
    }

    /**
     * Start listening for keyboard events.
     */
    private start(): void {
        if (this.isListening) return;
        this.isListening = true;

        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        const isInput = e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            (e.target instanceof HTMLElement && e.target.contentEditable === 'true');

        const eventKey = this.bindingKey({
            key: e.key,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            meta: e.metaKey,
        });

        // Check context layer first (overrides)
        if (this.activeContext) {
            const contextLayer = this.contextLayers.get(this.activeContext);
            if (contextLayer?.has(eventKey)) {
                const binding = contextLayer.get(eventKey)!;
                if (!isInput || binding.global) {
                    e.preventDefault();
                    e.stopPropagation();
                    binding.action();
                    return;
                }
            }
        }

        // Check global layer
        if (this.globalLayer.has(eventKey)) {
            const binding = this.globalLayer.get(eventKey)!;
            if (!isInput || binding.global) {
                e.preventDefault();
                e.stopPropagation();
                binding.action();
            }
        }
    }

    /**
     * Clean up and stop listening.
     */
    destroy(): void {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        }
        this.isListening = false;
        this.globalLayer.clear();
        this.contextLayers.clear();
    }
}

// ─── Singleton Export ───────────────────────────────────────────
export const keyboardManager = new KeyboardManager();
