import { Injectable } from "@nestjs/common";
import { NominatorActionHistory } from "src/common/entity/StakingModule/NominatorActionHistory.entity";
import { NominatorRewardDetailHistory } from "src/common/entity/StakingModule/NominatorRewardDetailHistory.entity";
import { PageRequest } from "src/viewModel/base/pageRequest";
import { DelegatorInfoRequest } from "src/viewModel/staking/portal/DelegatorInfoRequest";
import { StatDelegatorPageRequest } from "src/viewModel/staking/portal/StatDelegatorPageRequest";
import { Between, In } from "typeorm";
import { ChainConnectManager } from "../../core/chain/chain-connect-manager";
import { DbManager } from "../../core/db/db-manager";

@Injectable()
export class StatDelegatorService {
  async list(request: StatDelegatorPageRequest): Promise<any> {
    let order = undefined;
    request.orderBys &&
      request.orderBys.forEach((it) => {
        if (it.sort) {
          order = order || {};
          order[it.sort] = it.order;
        }
      });
    const method = request.needTotal ? "findAndCount" : "find";
    return await DbManager.PORTAL.statDelegatorRepository[method]({
      where: {
        chainId: request.chainId,
        collator: request.collator,
      },
      order,
      skip: PageRequest.getSkip(request),
      take: PageRequest.getTake(request),
    });
  }

  async summaryDelegator(request: DelegatorInfoRequest) {
    const result = {
      latestReward: 0,
      latestRewardBlock: "",
      totalBond: 0,
      totalReward: 0,
      stakedCollators: 0,
    };
    const dbr = DbManager.PORTAL.statDelegatorRepository;

    let raw = await dbr.query(
      `SELECT latest_reward, latest_reward_block from stat_delegator WHERE chain_id='${request.chainId}' AND delegator='${request.delegator}' ORDER BY latest_reward_block DESC limit 1`
    );
    if (raw && raw.length) {
      result.latestReward = raw[0].latest_reward;
      result.latestRewardBlock = raw[0].latest_reward_block;
    } else {
      return result;
    }

    raw = await dbr.query(
      `SELECT sum(stake) as total_bond, sum(reward) as total_reward from stat_delegator WHERE chain_id='${request.chainId}' AND delegator='${request.delegator}'`
    );
    if (raw && raw.length) {
      // result.totalBond = raw[0].total_bond;
      result.totalReward = raw[0].total_reward;
      // result.stakedCollators = raw[0].stakedCollators; // , count(delegator) as staked_count
    }

    const chain = ChainConnectManager.get(request);
    const myStakeChainData =
      await chain.api.query.parachainStaking.delegatorState(request.delegator);
    if (!myStakeChainData || myStakeChainData.isEmpty) {
      return result;
    }
    (myStakeChainData.toJSON() as any).delegations.forEach((it) => {
      result.totalBond += chain.formatWithDecimals(it.amount).toNumber();
      result.stakedCollators++;
    });

    return result;
  }

  async listAllMyReward(
    request: DelegatorInfoRequest,
    startRound: number,
    endRound: number,
  ): Promise<NominatorRewardDetailHistory[]> {
    return await DbManager.get(request).nrdhRepository.find({
      where: {
        account: request.delegator,
        realroundindex: Between(startRound, endRound)
      },
      order: {
        realroundindex: "DESC",
      },
    });
  }

  async listAllMyStakingHis(
    request: DelegatorInfoRequest
  ): Promise<NominatorActionHistory[]> {
    return await DbManager.get(request).nahRepository.find({
      where: {
        account: request.delegator,
        actiontype: In(["add", "increase", "left"]),
      },
      order: {
        timestamp: "DESC",
      },
    });
  }

  async listMyStakingsCollatorsAndRounds(
    request: DelegatorInfoRequest,
    type: string
  ): Promise<any> {
    const isAction = type === "action";
    const repository = isAction
      ? DbManager.get(request).nahRepository
      : DbManager.get(request).nrdhRepository;

    const sql = `SELECT 
	DISTINCT collator,
	${isAction ? "roundindex" : "issueroundindex"} AS round_index 
FROM 
	${isAction ? "nominator_action_histories" : "nominator_reward_detail_histories"} 
WHERE account = $1 
  ${isAction ? "AND actiontype in ('add', 'increase', 'left')" : ''}`;
    const rawData = await repository.query(sql, [request.delegator]);
    const collators = [];
    const rounds = [];

    if (rawData && rawData.length > 0) {
      const map = {};  // because the round will never be conflict with the collator, we share a same map
      rawData.forEach(it => {
        const collator = it.collator;
        const round = it.round_index;
        if (!map[collator]) {
          map[collator] = 1;
          collators.push(collator);
        }
        if (!map[round]) {
          map[round] = 1;
          rounds.push(round);
        }
      });
      rounds.sort();
    }
    return {
      collators,
      rounds,
    }

  }
}
