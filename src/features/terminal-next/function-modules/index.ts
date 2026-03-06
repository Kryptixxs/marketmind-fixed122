import { desModule } from './desModule';
import { faModule } from './faModule';
import { hpModule } from './hpModule';
import { ovmeModule } from './ovmeModule';
import { portModule } from './portModule';
import { weiModule } from './weiModule';
import { yasModule } from './yasModule';
import { FunctionModuleDefinition } from './moduleTypes';

export const FUNCTION_MODULES: FunctionModuleDefinition[] = [
  desModule,
  faModule,
  weiModule,
  hpModule,
  yasModule,
  ovmeModule,
  portModule,
];
