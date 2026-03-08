import { ModuleContract } from './moduleContract';

class Registry {
  private modules = new Map<string, ModuleContract<any>>();

  register<TModel>(moduleContract: ModuleContract<TModel>) {
    this.modules.set(moduleContract.id, moduleContract);
  }

  get(id: string): ModuleContract<any> | undefined {
    return this.modules.get(id);
  }

  getAll(): ModuleContract<any>[] {
    return Array.from(this.modules.values());
  }
}

export const ModuleRegistry = new Registry();
