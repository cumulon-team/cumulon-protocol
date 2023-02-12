import { HttpService, Injectable } from "@nestjs/common";
import BigNumber from "bignumber.js";
import { ChainConnector } from "src/common/chain/chain-connector";
import { StatCollator } from "src/common/entity/StakingPortalStat/StatCollator.entity";
import { StakingBaseService } from "../../base/service/staking-base-service";
import { DbManager } from "../../core/db/db-manager";
import { BaseService } from "./base-service";

@Injectable()
export class CollatorService extends BaseService {
  constructor(private readonly httpService: HttpService) {
    super();
  }

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

  async getStatCollatorsHisBy({ chainId, collator }) {
    let records = await DbManager.PORTAL.statDelegatorRepository.find({
      where: { chainId, collator },
    });
    const dataMap = {};
    records.forEach((it: any) => {
      dataMap[it.delegator] = it;
    });
    return dataMap;
  }

  async getStatCollators(
    chain: ChainConnector,
    baseService: StakingBaseService,
    shareData
  ) {
    const { collatorData } = shareData;

    this.doRank("totalStake", "totalStakeRank", collatorData);
    await this.batchCalStake(chain, shareData);
    await this.batchCalMinBond(chain, shareData);
    await this.batchCalReward4Collators(shareData);
    await this.injectRewards4RealtimeCollatorState(baseService, shareData);
    await this.batchCalRps(baseService, shareData);
    await this.batchCalBlock(baseService, chain, shareData);
    for (const roundSize of [1, 3, 4, 5, 8, 10]) {
      this.doRank(
        `avgBlockIn${roundSize}R`,
        `avgBlockRankIn${roundSize}R`,
        collatorData
      );
    }
    await this.batchCalApr(baseService, chain, shareData);
    this.doRank("apr", "aprRank", collatorData);

    return collatorData;
  }

  // if the Top Delegator List has not been full yet (capacity of the list
  // is an constant defined in parachain.constant.maxTopDelegationsPerCandidate),
  // it would be higher than the last one on the list,
  // or it would be the default value of each network’s.
  private batchCalMinBond(chain: ChainConnector, shareData) {
    const defaultMinBondValue = chain.defaultValues.minBond;
    const { collators, collatorDataMap } = shareData;
    const maxTopDelegationsPerCandidate =
      chain.api.consts.parachainStaking.maxTopDelegationsPerCandidate;
    for (let i = 0; i < collators.length; i++) {
      const collator = collators[i];
      const row = collatorDataMap[collator];

      row.minBond = defaultMinBondValue;

      const tdr = shareData.topDelegators[i];
      if (tdr.delegations < 1) continue;

      const last = tdr.delegations[tdr.delegations.length - 1].amount;
      if (tdr.delegations.length >= maxTopDelegationsPerCandidate) {
        row.minBond = last + 1;
      } else {
        row.minBond = Math.max(defaultMinBondValue, last);
      }
    }
  }

  private async batchCalStake(chain: ChainConnector, shareData) {
    const { collators, collatorDataMap, realtimeCollatorState } = shareData;
    const selfStakeDataMap = {};
    // rawData
    //   .map((it) => it.toJSON())
    realtimeCollatorState.forEach((it: any, i) => {
      selfStakeDataMap[collators[i]] = chain
        .formatWithDecimals(it.bond)
        .toNumber();
    });

    for (const collator of collators) {
      collatorDataMap[collator].selfStake = selfStakeDataMap[collator] || 0;
      collatorDataMap[collator].delegatorStake =
        collatorDataMap[collator].totalStake -
        collatorDataMap[collator].selfStake;
    }
  }

  private async batchCalReward4Collators(shareData) {
    const { chainId, collators, collatorDataMap, taskStartedAt } = shareData;

    collators.forEach((collator) => {
      collatorDataMap[collator].latestReward = 0;
      collatorDataMap[collator].totalReward = 0;
    });

    const existedStatCollators =
      await DbManager.PORTAL.statCollatorRepository.find({
        where: {
          chainId,
        },
      });
    // //TODO TEST
    // const existedStatCollators = [];
    const startTime = existedStatCollators.length
      ? existedStatCollators[0].timestamp
      : null;
    const endTime = taskStartedAt;

    const newCollators = [];
    const oldCollators = [];
    // grouping and padding the previous reward
    for (const collator of collators) {
      const matched = existedStatCollators.filter(
        (it) => it.collator === collator
      )[0];
      const row = collatorDataMap[collator];
      row.totalReward = Number(row.totalReward) || 0;
      if (matched) {
        oldCollators.push(row);
        row.totalReward = matched.totalReward - 0 || 0;
        row.latestReward = matched.latestReward || 0;
      } else {
        newCollators.push(row);
      }
    }
    const process = async (incre, data) => {
      const rewards = await this.getReward4Collators({
        chainId,
        collators: data.map((it) => it.collator),
        startTime: incre ? startTime : null,
        endTime,
      });
      rewards.forEach((reward) => {
        const row = collatorDataMap[reward.collator];
        row.totalReward = reward.reward + (incre ? row.totalReward : 0);
        row.latestReward = reward.latestReward;
      });
    };
    if (newCollators.length) {
      await process(false, newCollators);
    }
    if (oldCollators.length) {
      await process(true, oldCollators);
    }
  }

  // MAYBE array_agg CAN BE OPTIMIZED FURTHUR BY SOME WINDOW FUNCTIONS LIKE FIRST_VAL, LAST_VAL, ETC.
  // https://stackoverflow.com/questions/25170215/get-values-from-first-and-last-row-per-group
  async getReward4Collators({ chainId, collators, startTime, endTime }) {
    if (!collators.length) {
      return [];
    }
    const startTs = this.getTsString(startTime);
    const endTs = this.getTsString(endTime || new Date());

    const query = `SELECT 
  account AS collator,
  sum( balance ) AS reward,
  max(realroundindex) AS max_issueroundindex,
  (array_agg(balance ORDER BY issueblock DESC))[1] AS latest_reward
FROM
  collator_reward_histories 
WHERE account in ( '${collators.toString().replace(/,/g, "','")}')
${startTs ? " AND timestamp >= '" + startTs + "'" : ""} 
AND timestamp < '${endTs}' 
GROUP BY account`;
    //   max(issueblock) AS latest_reward_block,

    let rawData = await DbManager.get(chainId).rhRepository.query(query);
    const result = [];
    if (rawData && rawData.length > 0) {
      for (const row of rawData) {
        result.push({
          collator: row.collator,
          reward: row.reward - 0 || 0,
          // latestRewardBlock: row.latest_reward_block - 0,
          latestReward: row.latest_reward - 0,
        });
      }
    }

    return result;
  }

  async batchCalApr(
    baseService: StakingBaseService,
    cc: ChainConnector,
    shareData
  ) {
    const round = shareData.round;
    const accounts = shareData.collators;
    const mapUser2Row = shareData.collatorDataMap;
    const blockPerRound = round.length;
    const realtimeCollatorState = shareData.realtimeCollatorState;

    if (
      cc.network.network === "moonbeam" ||
      cc.network.network === "moonriver"
    ) {
      let total_supply = Number(round.totalIssuance);

      for (let i = 0; i < realtimeCollatorState.length; i++) {
        let stake = cc
          .formatWithDecimals(realtimeCollatorState[i].totalCounted)
          .toNumber();
        let collator_counted_stake = Number(stake);
        let avg_blocks_per_round =
          mapUser2Row[realtimeCollatorState[i].id].avgBlockIn10R;
        console.log(
          "total_supply:",
          total_supply,
          " collator_counted_stake:",
          collator_counted_stake,
          " avg_blocks_per_round:",
          avg_blocks_per_round
        );

        mapUser2Row[realtimeCollatorState[i].id].apr =
          ((0.00001388888888888889 * total_supply * avg_blocks_per_round) /
            collator_counted_stake) *
          100;
      }
    } else {
      const blockTargetSeconds = await this.getBlockTargetSeconds(
        cc.network.network
      );

      for (let i = 0; i < realtimeCollatorState.length; i++) {
        const rewardInRounds = this.getRewardInRounds(
          realtimeCollatorState[i],
          10
        );
        // const filterNoRewardRoundWhenCalcAPR = false;
        const rounds =
          //   filterNoRewardRoundWhenCalcAPR === true
          //     ? rewardInRounds.roundsHasReward :
          rewardInRounds.rounds;

        let roundPerYear = await this.getRoundPerYear(
          blockTargetSeconds,
          blockPerRound
        );
        let stake = cc
          .formatWithDecimals(realtimeCollatorState[i].totalCounted)
          .toNumber();
        let reward = rewardInRounds.collatorRewardInRounds;
        //let rounds = params.rounds;
        mapUser2Row[realtimeCollatorState[i].id].apr =
          (reward / (rounds || 1) / (stake || 1)) * roundPerYear * 100;
      }
    }
  }

  formatWithDecimals(value, divider) {
    return BigNumber(value).dividedBy(divider);
  }

  getStartRoundIndex(roundInfo) {
    return roundInfo.current - 11 - 0;
  }
  getEndRoundIndex(roundInfo) {
    return roundInfo.current - 2 - 0; //Reward延迟2round发放
  }

  async injectRewards4RealtimeCollatorState(
    baseService: StakingBaseService,
    shareData
  ) {
    const { realtimeCollatorState } = shareData;
    const startRoundIndex = this.getStartRoundIndex(shareData.round);
    const endRoundIndex = this.getEndRoundIndex(shareData.round);

    const { collatorReward } = shareData;

    realtimeCollatorState.forEach((v) => {
      const arr = [];
      for (let i = startRoundIndex; i <= endRoundIndex; i++) {
        const find = collatorReward.find(
          (sv) =>
            sv.account.toLowerCase() == v.id.toLowerCase() &&
            Number(sv.roundIndex) == i
        );
        if (find) {
          arr.push({
            roundIndex: i,
            reward: BigNumber(find.reward),
          });
        } else {
          arr.push({
            roundIndex: i,
            reward: BigNumber(0),
          });
        }
      }
      v.historyReward = arr;
    });

    const getNominatorReward = await baseService.getNominatorReward({
      chainId: shareData.chainId,
      startRoundIndex,
      endRoundIndex,
    });

    // 塞入10次NominatortotalReward (坑点：历史数据返回可能缺失某个roundIndex)
    realtimeCollatorState.forEach((v) => {
      const arr = [];
      for (let i = startRoundIndex; i <= endRoundIndex; i++) {
        //按照collator分开reward数据
        const find = getNominatorReward.rewards.find(
          (sv) =>
            Number(sv.roundIndex) == i &&
            sv.collator.toLowerCase() == v.id.toLowerCase()
        );
        if (find) {
          arr.push({
            roundIndex: i,
            reward: BigNumber(find.reward),
          });
        } else {
          arr.push({
            roundIndex: i,
            reward: BigNumber(0),
          });
        }
      }
      v.historyNominatorTotalReward = arr;
    });
  }

  getRewardInRounds(c, rounds) {
    let roundsHasReward = 0;
    let rewardInRounds = 0;
    let startIndex = c.historyReward.length - rounds;
    if (startIndex < 0) {
      startIndex = 0;
    }
    for (let index = startIndex; index < c.historyReward.length; index++) {
      const element = c.historyReward[index];
      let reward = element.reward.toNumber();
      if (reward > 0) {
        roundsHasReward++;
      }
      rewardInRounds += reward;
    }

    startIndex = c.historyNominatorTotalReward.length - rounds;
    if (startIndex < 0) {
      startIndex = 0;
    }
    for (
      let index = startIndex;
      index < c.historyNominatorTotalReward.length;
      index++
    ) {
      const element = c.historyNominatorTotalReward[index];
      rewardInRounds += element.reward.toNumber();
    }

    return {
      collatorRewardInRounds: rewardInRounds,
      rounds,
      roundsHasReward: roundsHasReward,
    };
  }

  getRoundPerYear(blockTargetSeconds, blockPerRound) {
    let roundPerYear = Math.ceil(
      (365 * 24 * 3600) / (blockTargetSeconds * blockPerRound)
    );
    return roundPerYear;
  }

  async getBlockTargetSeconds(network) {
    let key = "averageBlockTime" + network;
    if (this[key]) {
      return this[key];
    } else {
      if (network === "bifrost") {
        let url = "https://api.bifrost.app/api/dapp/averageBlockTime";

        let response: any = await this.httpService.get(url).toPromise();
        // console.log("getBlockTargetSeconds response:", response);
        if (response) {
          let time = response.data.result.main;
          this[key] = time;
          return time;
        }
      }
    }
    return 12;
  }

  async batchCalBlock(
    baseService: StakingBaseService,
    cc: ChainConnector,
    shareData
  ) {
    const { chainId, round, collators, collatorDataMap } = shareData;
    const endRoundIndex = round.current - 1;

    const blocks = (
      await baseService.getCollatorProducedBlocks({
        chainId,
        startRoundIndex: round.current - 11,
        endRoundIndex,
        accounts: collators,
      })
    ).blocks;

    collators.forEach((collator) => {
      // current block
      const findCurrent = blocks.find(
        (sv) =>
          sv.account === collator && Number(sv.roundIndex) === round.current
      );

      collatorDataMap[collator].currentBlock = findCurrent
        ? findCurrent.blocks_count - 0
        : 0;

      // avg block
      for (const roundSize of [1, 3, 4, 5, 8, 10]) {
        let totalBlocks = 0;
        let activeRound = 0;

        blocks &&
          blocks
            .filter(
              (bi) =>
                bi.account === collator &&
                Number(bi.roundIndex) >= round.current - 1 - roundSize &&
                Number(bi.roundIndex) <= endRoundIndex
            )
            .forEach((bi) => {
              activeRound++;
              totalBlocks += Number(bi.blocks_count);
            });
        collatorDataMap[collator][`avgBlockIn${roundSize}R`] =
          activeRound > 0 ? Number(totalBlocks / activeRound) : 0;
      }
    });
  }

  async batchCalRps(baseService: StakingBaseService, shareData) {
    const { chainId, collatorDataMap, realtimeCollatorState, round } =
      shareData;
    const startRoundIndex = round.current - 11 - 0;
    const endRoundIndex = round.current - 1;
    const stakeRecords = (
      await baseService.atStake({
        chainId,
        startRoundIndex,
        endRoundIndex,
        collatorAccount: null,
      })
    ).stakes;
    for (const v of realtimeCollatorState) {
      const historyRps = [];
      for (let i = startRoundIndex; i <= endRoundIndex; i++) {
        //debugger;
        const findTop = v.historyNominatorTotalReward.find(
          (sv) => Number(sv.roundIndex) == i
        );
        const findBottom = stakeRecords.find(
          (sv) => Number(sv.roundIndex) == i
        );

        let rps = new BigNumber(0);
        if (findTop && findBottom) {
          const top = findTop.reward as BigNumber;
          const bottom = findBottom.nominatorsStake as number;
          if (bottom > 0 && top.comparedTo(0) > -1) {
            rps = top.dividedBy(bottom);
          }
        }
        historyRps.push({
          roundIndex: i,
          rps,
        });
      }
      const row = collatorDataMap[v.id] as StatCollator;
      row.rpsHis = JSON.stringify(historyRps);
      row.avgRps = historyRps
        .map((i) => i.rps)
        .reduce((i, ii) => i.plus(ii))
        .dividedBy(historyRps.length)
        .toNumber();
      // this.getAverageRPS(historyRps);
      row.minRps = Math.min.apply(
        null,
        historyRps.map((sv) => sv.rps.toNumber())
      );
      row.maxRps = Math.max.apply(
        null,
        historyRps.map((sv) => sv.rps.toNumber())
      );
      // 标准差
      let topSum = BigNumber(0);
      historyRps.forEach((rps) => {
        topSum = topSum.plus(rps.rps.minus(row.avgRps).exponentiatedBy(2));
      });
      row.rpsScore = topSum.dividedBy(10).sqrt().toNumber();
    }
  }
}
