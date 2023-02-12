import { HttpService, Injectable } from "@nestjs/common";
import { In } from "typeorm";
import { StakingBaseService } from "../../base/service/staking-base-service";
import { ChainConnectManager } from "../../core/chain/chain-connect-manager";
import { DbManager } from "../../core/db/db-manager";
import { ServiceManager } from "../../core/service/service-manager";
import { MyStakeRequest } from "../model/MyStakeRequest";
import { MyStake } from "../model/MyStakeResponse";

@Injectable()
export class MyStakeListService {
  constructor(
    readonly httpService: HttpService,
    readonly serviceManager: ServiceManager
  ) {}

  async getCollatorLatestReward({ collator, chainId }): Promise<any> {
    let result: any = {};
    result.collators = [];
    result.totalCount = 0;
    let query = `SELECT balance  AS latestReward  FROM collator_reward_histories where 
    account = '${collator}' order by realroundindex desc limit 1`;

    let rawData = await DbManager.get(chainId).rhRepository.query(query);
    if (rawData && rawData.length > 0) {
      return rawData[0].latestreward;
    }
    return 0;
  }

  async listMyStake(request: MyStakeRequest): Promise<Array<MyStake>> {
    const cc = ChainConnectManager.get(request);

    const myStakeChainData = await cc.api.query.parachainStaking.delegatorState(
      request.accountId
    );
    if (!myStakeChainData || myStakeChainData.isEmpty) {
      return [];
    }

    const mapUser2Row = {};
    const result = (myStakeChainData.toJSON() as any).delegations.map((it) => {
      let myStake = cc.formatWithDecimals(it.amount.toString()).toNumber();
      const collator = cc.formatAccountAddr(it.owner);
      return (mapUser2Row[collator] = {
        chainId: request.chainId,
        collator,
        myStake,
        totalReward: 0,
        latestReward: 0,
        rank: 0,

        selfStake: 0,
        nominatorStake: 0,
        totalStake: 0,

        myRank: 0,
        myShare: 0,
      });
    });

    const collators = result.map((it) => it.collator);

    const realtimeCollatorState = await cc.getRealtimeCollatorState(collators);

    this.processStakeAndRank(
      realtimeCollatorState,
      cc,
      result,
      request.accountId
    );

    const collatorStats = await DbManager.PORTAL.statCollatorRepository.find({
      where: { chainId: request.chainId, collator: In(collators) },
    });
    const delegatorStats = await DbManager.PORTAL.statDelegatorRepository.find({
      where: { chainId: request.chainId, collator: In(collators), delegator: request.accountId },
    });
    for (const it of collatorStats) {
      if (collators.indexOf(it.collator) < 0) continue;
      const row = mapUser2Row[it.collator];
      row.apr = it.apr;
      row.rank = it.totalStakeRank;

      const matched = delegatorStats.filter(delegator => delegator.collator === it.collator)[0];
      if (matched) {
        row.totalReward = matched.reward;
        row.latestReward = matched.latestReward;
      }
      // row.totalReward = it.totalReward;
      // row.latestReward = await this.getCollatorLatestReward({
      //   collator: it.collator,
      //   chainId: request.chainId,
      // });
    }

    return result;
  }

  private async processStakeAndRank(
    realtimeCollatorState,
    chain,
    data,
    delegator
  ) {
    const getRank = (delegationGroup, delegator) => {
      let i = 0;
      for (const group of delegationGroup) {
        for (const delegations of group) {
          i++;
          if (delegations.owner === delegator) {
            return i;
          }
        }
      }
      return null;
    };

    data.forEach((row) => {
      for (let rank = 1; rank <= realtimeCollatorState.length; rank++) {
        const matched = realtimeCollatorState[rank - 1];
        if (matched.id !== row.collator) continue;
        row.myRank = getRank(
          [matched.topDelegations, matched.bottomDelegations],
          delegator
        );
        //row.rank = rank;
        row.selfStake = chain.formatWithDecimals(matched.bond).toNumber();
        row.totalStake = chain
          .formatWithDecimals(matched.totalCounted)
          .toNumber();
        row.nominatorStake = row.totalStake - row.selfStake;
        const myShare: any = (
          ((row.myStake / (row.nominatorStake || 1)) * 100) as number
        ).toFixed(2);
        row.myShare = myShare - 0 || 0;
      }
    });
  }

  async fillReward(
    request: MyStakeRequest,
    baseService: StakingBaseService,
    collators,
    mapUser2Row
  ) {
    const rs = await baseService.getCollatorTotalReward({
      chainId: request.chainId,
      collators,
    });
    if (rs && rs.collators && rs.collators.length)
      for (let i = 0; i < rs.collators.length; i++) {
        const v = rs.collators[i];
        mapUser2Row[v.account].totalReward = v.reward;
        mapUser2Row[v.account].latestReward =
          await this.getCollatorLatestReward({
            collator: v.account,
            chainId: request.chainId,
          });
      }
  }
}
