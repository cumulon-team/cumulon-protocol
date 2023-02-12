import {
  Body,
  CacheTTL,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HttpCacheInterceptor } from "src/common/interceptor/HttpCacheInterceptor";
import { DelegatorInfoRequest } from "src/viewModel/staking/portal/DelegatorInfoRequest";
import { StatDelegatorPageRequest } from "src/viewModel/staking/portal/StatDelegatorPageRequest";
import { ChainConnectManager } from "../../core/chain/chain-connect-manager";
import { StatDelegatorService } from "../service/stat-delegator-service";

@UseInterceptors(HttpCacheInterceptor)
@ApiTags("staking-portal/delegator")
@Controller("parachain/staking/delegator")
export class StatDelegatorController {
  constructor(private delegatorService: StatDelegatorService) {}

  @Post("statistics")
  @CacheTTL(60)
  async listNetworkStat(
    @Body() request: StatDelegatorPageRequest
  ): Promise<any> {
    const data = await this.delegatorService.list(request);
    return {
      list: request.needTotal ? data[0] : data,
      totalCount: request.needTotal ? data[1] : undefined,
    };
  }

  @Get("info")
  @CacheTTL(60)
  async showSummary(@Query() request: DelegatorInfoRequest): Promise<any> {
    const data = await this.delegatorService.summaryDelegator(request);
    return data;
  }

  @Get("timeMachine/rewards/stat")
  @CacheTTL(60)
  async myRewardStat(@Query() request: DelegatorInfoRequest): Promise<any> {
    // const data = await this.delegatorService.summaryDelegator(request);

    const round = await ChainConnectManager.get(request).api.    query.parachainStaking.round();
    let roundInfo: any = round.toJSON();
    const allRewards = await this.delegatorService.listAllMyReward(request, roundInfo.current - 21, roundInfo.current - 2);
    const aggregate = () => {
      const rewardByCollator = [];
      const rewardByRoundIndex = [];
  
      const map1 = {}; 
      const map2 = [];
      allRewards.forEach(it => {
        if (!map1[it.collator]) {
          map1[it.collator] = {collator: it.collator, reward: 0};
          rewardByCollator.push(map1[it.collator]);
        }
        map1[it.collator].reward += it.balance;

        if (!map2[it.realroundindex]) {
          map2[it.realroundindex] = {roundIndex: it.realroundindex, reward: 0};
          rewardByRoundIndex.push(map2[it.realroundindex]);
        }
        map2[it.realroundindex].reward += it.balance;
      });
      rewardByCollator.sort((it, it2) => it.reward - it2.reward);
      rewardByRoundIndex.sort((it, it2) => it.roundIndex - it2.roundIndex);
      return {
        rewardByCollator,
        rewardByRoundIndex,
      };
    }
    return aggregate();
  }


  @Get("timeMachine/staking/his")
  @CacheTTL(60)
  async myStakingHis(@Query() request: DelegatorInfoRequest): Promise<any> {
    return await this.delegatorService.listAllMyStakingHis(request);
  }



  @Get("timeMachine/staking/:type/info")
  @CacheTTL(60)
  @ApiOperation({ summary: 'type:[action, reward]. returning all Collators and Rounds of the corresponding data within a delegator\'s stakes' })
  async listMyStakingsCollatorsAndRounds(@Query() request: DelegatorInfoRequest, @Param('type') type: string) {
    return await this.delegatorService.listMyStakingsCollatorsAndRounds(request, type)
  }

}
