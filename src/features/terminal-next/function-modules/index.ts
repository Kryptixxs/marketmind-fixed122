import { calModule } from './calModule';
import { desModule } from './desModule';
import { execModule } from './execModule';
import { faModule } from './faModule';
import { hpModule } from './hpModule';
import { intelModule } from './intelModule';
import { mktModule } from './mktModule';
import { newsModule } from './newsModule';
import { ovmeModule } from './ovmeModule';
import { portModule } from './portModule';
import { secModule } from './secModule';
import { weiModule } from './weiModule';
import { yasModule } from './yasModule';
import { FunctionModuleDefinition } from './moduleTypes';

export const FUNCTION_MODULES: FunctionModuleDefinition[] = [
  execModule,
  desModule,
  faModule,
  weiModule,
  hpModule,
  intelModule,
  yasModule,
  ovmeModule,
  portModule,
  newsModule,
  calModule,
  secModule,
  mktModule,
];
