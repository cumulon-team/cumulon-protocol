import { CacheModule, Module } from "@nestjs/common";

import { StakingBaseController } from "./controller/staking-base-controller";
import { BifrostStakingBaseService } from "./service/bifrost-staking-base-service";
import { MoonbeamStakingBaseService } from "./service/moonbeam-staking-base-service";
import { MoonriverStakingBaseService } from "./service/moonriver-staking-base-service";
import { StakingBaseService } from "./service/staking-base-service";

@Module({
    imports: [CacheModule.register({
        max: 200
      }),],
  controllers: [StakingBaseController],
  providers: [StakingBaseService, BifrostStakingBaseService, MoonbeamStakingBaseService, MoonriverStakingBaseService],
  exports: [StakingBaseService, BifrostStakingBaseService, MoonbeamStakingBaseService, MoonriverStakingBaseService],
})
export class StakingBase2Module {}
