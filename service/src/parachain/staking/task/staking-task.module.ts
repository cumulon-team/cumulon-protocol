import { HttpModule, Module } from "@nestjs/common";

import {
  StatDataSyncTask,
  DelegatorsScheduleTestController,
} from "./stat-data-sync-task";
import { CollatorService } from "./service/collator-service";
import { StatDelegatorService } from "./service/delegator-service";

@Module({
  imports: [HttpModule],
  controllers: [DelegatorsScheduleTestController],
  providers: [CollatorService, StatDelegatorService, StatDataSyncTask],
  // exports: [CollatorService],
})
export class StakingTask2Module {}
