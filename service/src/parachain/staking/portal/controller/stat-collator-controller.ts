import {
  Body,
  CacheTTL,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StatCollator } from "src/common/entity/StakingPortalStat/StatCollator.entity";
import { HttpCacheInterceptor } from "src/common/interceptor/HttpCacheInterceptor";
import { StatCollatorPageRequest } from "src/viewModel/staking/portal/StatCollatorPageRequest";
import { StakingRequest } from "src/viewModel/staking/StakingRequest";
import { ChainConnectManager } from "../../core/chain/chain-connect-manager";
import { StatCollatorStatService } from "../service/stat-collator-service";

@UseInterceptors(HttpCacheInterceptor)
@ApiTags("staking-portal/collator")
@Controller("parachain/staking/collator")
export class StatCollatorController {
  constructor(private collatorService: StatCollatorStatService) {}

  @Get("getSafeStateConfig")
  @CacheTTL(60)
  async getSafeStateConfig(@Query() request: StakingRequest): Promise<any> {
    return this.collatorService.getSafeStateConfig(request);
  }

  @Post("statistics")
  @CacheTTL(60)
  async listNetworkStat(
    @Body() request: StatCollatorPageRequest
  ): Promise<any> {
    // GET DATA
    const data = await this.collatorService.list(request);
    const result = {
      list: request.needTotal ? data[0] : data,
      totalCount: request.needTotal ? data[1] : undefined,
    };

    // FORMATING THE RPS_HIS DATA
    result.list &&
      result.list.forEach((it: StatCollator) => {
        if (it.rpsHis && it.rpsHis.length) {
          try {
            it.rpsHis = JSON.parse(it.rpsHis);
          } catch (e) {
            // mute exception for the text format error.
          }
        }
      });

    // EXTRA PROCEESDURES FOR MY-STAKE & ITS ORDERING
    if (
      result.list.length &&
      request.myAccount &&
      (request.myAccount = request.myAccount.trim()).length > 0
    ) {
      const chain = ChainConnectManager.get(request);
      const myStakeChainData =
        await chain.api.query.parachainStaking.delegatorState(
          request.myAccount
        );
      if (!myStakeChainData || myStakeChainData.isEmpty) {
        return result;
      }
      (myStakeChainData.toJSON() as any).delegations.forEach((stakeRecord) => {
        let myStake = chain.formatWithDecimals(stakeRecord.amount).toNumber();
        const collator = chain.formatAccountAddr(stakeRecord.owner);
        result.list.forEach((row) => {
          row.myStake = null;
          if (row.collator === collator) {
            row.myStake = myStake;
          }
        });
      });
      let sortMyStakeAsc = null;
      request.orderBys.forEach((it) => {
        if (it.sort === "myStake") {
          sortMyStakeAsc = it.order === "DESC";
        }
      });
      if (sortMyStakeAsc != null) {
        result.list.sort(
          (i, ii) =>
            ((i.myStake || 0) - (ii.myStake || 0)) * (sortMyStakeAsc ? -1 : 1)
        );
      }
    }
    return result;
  }

  //
}
