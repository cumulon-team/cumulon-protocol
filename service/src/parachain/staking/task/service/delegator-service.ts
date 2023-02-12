import { ParachainNetwork } from "src/common/chain/chain-network";
import { StatDelegator } from "src/common/entity/StakingPortalStat/StatDelegator.entity";
import { DbManager } from "../../core/db/db-manager";
import { BaseService } from "./base-service";

export class StatDelegatorService  extends BaseService {
  async getStatDelegator(
    network: ParachainNetwork,
    shareData
  ): Promise<StatDelegator[]> {
    const {
      chainId,
      collators,
      topDelegators,
      bottomDelegators,
      taskStartedAt,
    } = shareData;
    const delegators = [] as StatDelegator[];
    const allRecordList = await DbManager.PORTAL.statDelegatorRepository.find({
      where: { chainId },
    });

    for (let i = 0; i < collators.length; i++) {
      const collator = collators[i];
      const tops = topDelegators[i].delegations;
      const bottoms = bottomDelegators[i].delegations;
      if (tops.length < 1) continue;

      let rank = 1;
      for (const groupData of [{ top: true, data: tops }, { data: bottoms }]) {
        if (groupData.data.length < 1) continue;
        const dataMap = {};
        for (const d of groupData.data) {
          const delegator = new StatDelegator();
          delegator.chainId = chainId;
          delegator.collator = collator;
          delegator.delegator = d.owner;
          delegator.stake = d.amount;
          delegator.rank = rank++;
          delegator.isInTop = groupData.top ? 1 : 0;
          delegator.reward = 0;
          delegator.latestReward = 0;
          delegator.latestRewardBlock = 0;
          delegator.timestamp = taskStartedAt;
          delegators.push(delegator);
          dataMap[d.owner] = delegator;
        }
        const existedRecords = {};
        allRecordList
          .filter((it) => it.collator === collator)
          .forEach((it) => {
            existedRecords[it.delegator] = it;
          });
        // new records
        await this.batchCalRewards4StatDelegators({
          chainId: network.info.id,
          dataMap,
          collator,
          existedRecords,
          delegators: groupData.data
            .filter((it) => !existedRecords[it.owner])
            .map((it) => it.owner),
          isIncre: false,
          endTime: taskStartedAt,
        });
        // increment
        await this.batchCalRewards4StatDelegators({
          chainId: network.info.id,
          dataMap,
          collator,
          existedRecords,
          delegators: groupData.data
            .filter((it) => !!existedRecords[it.owner])
            .map((it) => it.owner),
          isIncre: true,
          endTime: taskStartedAt,
        });
      }
    }
    return delegators;
  }

  private async batchCalRewards4StatDelegators({
    chainId,
    existedRecords,
    dataMap,
    collator,
    delegators,
    isIncre,
    endTime,
  }) {
    if (!delegators || !delegators.length) {
      return;
    }
    let startTime = null;
    //let endTime = taskStartedAt;
    if (isIncre) {
      startTime = existedRecords[delegators[0]].timestamp as Date;
      // no matter existed records has further updates, we needs to keep the legacy data
      delegators.forEach((delegator) => {
        dataMap[delegator].reward = existedRecords[delegator].reward - 0;
        dataMap[delegator].latestReward =
          existedRecords[delegator].latestReward;
        dataMap[delegator].latestRewardBlock =
          existedRecords[delegator].latestRewardBlock;
      });
    }
    let rewards = await this.getReward4Delegators({
      chainId,
      collator,
      delegators,
      startTime,
      endTime,
    });
    rewards.forEach((reward) => {
      if (!dataMap[reward.delegator]) {
        // skip the quited delegators
        return;
      }
      dataMap[reward.delegator].reward =
        reward.reward -
        0 +
        (isIncre ? dataMap[reward.delegator].reward - 0 : 0);
      dataMap[reward.delegator].latestReward = reward.latestReward;
      dataMap[reward.delegator].latestRewardBlock = reward.latestRewardBlock;
    });
  }

  async getReward4Delegators({
    chainId,
    collator,
    delegators,
    startTime,
    endTime,
  }) {
    const startTs = this.getTsString(startTime);
    const endTs = this.getTsString(endTime || new Date());

    //   let query = `SELECT a.account, a.collator, a.reward, a.latest_reward_block,
    //   (SELECT sum(balance) FROM nominator_reward_detail_histories
    //     WHERE collator = a.collator AND account = a.account AND issueroundindex=a.max_issueroundindex ) AS latest_reward
    // FROM
    // (SELECT
    //   account,
    //   collator,
    //   sum( balance ) AS reward,
    //   max(issueblock) AS latest_reward_block,
    //   max(issueroundindex) AS max_issueroundindex
    // FROM
    //   nominator_reward_detail_histories
    // WHERE
    // collator = '${collator}'
    // AND account IN ( '${delegators.toString().replace(/,/g, "','")}' )
    // ${startTs ? " AND timestamp >= '" + startTs + "'" : ""}
    // AND timestamp < '${endTs}'
    // GROUP BY collator, account
    // ORDER BY collator, account) a`;
    let query = `SELECT
    account,
    collator,
    sum( balance ) AS reward,
    max(issueblock) AS latest_reward_block,
    (array_agg(balance ORDER BY issueblock DESC))[1] AS latest_reward
  FROM
    nominator_reward_detail_histories 
  WHERE
  collator = '${collator}' 
  ${startTs ? " AND timestamp >= '" + startTs + "'" : ""} 
  AND timestamp < '${endTs}' 
  GROUP BY collator, account`;

    let rawData = await DbManager.get(chainId).rhRepository.query(query);
    const result = [];
    if (rawData && rawData.length > 0) {
      for (const row of rawData) {
        result.push({
          collator: row.collator,
          delegator: row.account,
          reward: row.reward - 0 || 0,
          latestRewardBlock: row.latest_reward_block - 0,
          latestReward: row.latest_reward - 0,
        });
      }
    }

    return result;
  }
}
