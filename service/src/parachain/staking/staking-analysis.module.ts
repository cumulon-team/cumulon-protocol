import { CacheModule, Global, Module, Provider } from "@nestjs/common";

import { StakingRegisterController } from "./core/register/staking-register-controller";

import { ServiceManager } from "./core/service/service-manager";
import { DatabaseModule } from "./core/db/database.module";
import { StakingBase2Module } from "./base/staking-base.module";
import { StakingHome2Module } from "./portal/staking-home.module";
import { StakingTask2Module } from "./task/staking-task.module";
import { ChainConnectModule } from "./core/chain/chain-connect.module";

@Global()
@Module({
  imports: [
    CacheModule.register({
      // max: 500
    }),
    DatabaseModule.forRoot(),
    ChainConnectModule.forRoot(),
    StakingBase2Module,
    StakingHome2Module,
    StakingTask2Module,
  ],
  controllers: [StakingRegisterController],
  providers: [ ServiceManager, ],
  exports: [ ServiceManager],
})
export class StakingAnalysis2Module {}
