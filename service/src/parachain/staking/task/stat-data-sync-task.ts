import { Controller, Get, Injectable, Query } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ChainConnector } from "src/common/chain/chain-connector";
import { ParachainNetwork } from "src/common/chain/chain-network";
import { StatCollator } from "src/common/entity/StakingPortalStat/StatCollator.entity";
import { StatDelegator } from "src/common/entity/StakingPortalStat/StatDelegator.entity";
import { StatNetwork } from "src/common/entity/StakingPortalStat/StatNetwork.entity";
import { W3Logger } from "src/common/log/logger.service";
import { StatNetworkRequest } from "src/viewModel/staking/portal/StatNetworkRequest";
import { StakingBaseService } from "../base/service/staking-base-service";
import { ChainConnectManager } from "../core/chain/chain-connect-manager";
import { DbManager } from "../core/db/db-manager";

import { parachainNetworks } from "../core/register/chain-network-register";
import { ServiceManager } from "../core/service/service-manager";
import { CollatorService } from "./service/collator-service";
import { StatDelegatorService } from "./service/delegator-service";

@Injectable()
export class StatDataSyncTask {
  private pending = false;
  private taskStartedAt;

  private logger: W3Logger;

  constructor(
    private serviceManager: ServiceManager,
    private collatorService: CollatorService,
    private delegatorService: StatDelegatorService
  ) {
    this.logger = new W3Logger("StatDataSyncTask");
  }

  getElapsedTimeInSec(date = this.taskStartedAt) {
    if (!date) return -1;
    const now = new Date().getTime();
    return Number((now - date.getTime()) / 1000);
  }

  @Cron("0 */5 * * * *")
  async doCal(chainId: string, force=false) {
    // skip cron task if running in my local env.
    try {
      if (
        !force && 
        process.env.USER === "klaus" &&
        process.env.TERM_PROGRAM === "vscode"
      ) {
        return;
      }
    } catch (e) {}

    if (this.pending) {
      this.logger.warn(
        `last task started ${this.getElapsedTimeInSec()}s ago and yet to be done.`
      );
      return;
    }
    this.taskStartedAt = new Date();
    this.pending = true;

    try {
      for (const network of parachainNetworks) {
        if (chainId && network.info.id !== chainId) {
          continue;
        }
        await this.doSyncByNetwork(network);
      }
    } catch (e) {
      this.logger.warn(
        `task quited unexpectly, task consumed ${this.getElapsedTimeInSec()}s`,
        e
      );
    } finally {
      this.pending = false;
      console.warn(`the task finished in ${this.getElapsedTimeInSec()}s.`);
    }
    // parachainNetworks.forEach((network) => {});
  }

  private async doSyncByNetwork(network: ParachainNetwork) {
    const startTime = new Date();
    try {
      const chain = ChainConnectManager.get(network.info.id);
      const baseService: StakingBaseService = this.serviceManager.getService(
        { chainId: chain.network.id },
        StakingBaseService.name
      );

      const shareData = await this.buildCollatorsAndSharedData(
        chain,
        baseService
      );
      const collators = await this.collatorService.getStatCollators(
        chain,
        baseService,
        shareData
      );
      const statNetwork = this.getStatNetwork(network, collators);
      const delegators = await this.delegatorService.getStatDelegator(
        network,
        shareData
      );

      // https://docs.nestjs.com/v7/techniques/database#transactions
      await this.doSave(network, StatNetwork, "stat_network", [statNetwork]);
      await this.doSave(network, StatCollator, "stat_collator", collators);
      await this.doSave(network, StatDelegator, "stat_delegator", delegators);
    } catch (e) {
      this.logger.warn(
        `task stat-sync  for ${
          network.info.id
        } quited unexpectly, task consumed ${this.getElapsedTimeInSec()}s`,
        e
      );
    } finally {
      this.logger.debug(
        `task stat-sync for ${
          network.info.id
        } done: cost ${this.getElapsedTimeInSec(startTime)}s`
      );
    }
  }

  private async doSave(
    network: ParachainNetwork,
    entityClzRef,
    tableName,
    data: Array<any>
  ) {
    const queryRunner = DbManager.PORTAL.dbConnect.createQueryRunner();
    try {
      if (!data || data.length < 1) return;
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // truncate enjoyed the high performance but also sacrifice the transaction
      queryRunner.manager.query(
        `delete from ${tableName} where chain_id='${network.info.id}'`
      );
      this.logger.debug(
        `finished cleaning old data in ${tableName}...total: ${data.length} network: ${network.info.id}`
      );

      this.logger.debug(
        `starting save data...${tableName} total: ${data.length} network: ${network.info.id}`
      );

      const pageSize = 2000;
      if (data.length > pageSize) {
        const paginate = (array, pageSize, pageNumber) => {
          return array.slice(
            (pageNumber - 1) * pageSize,
            pageNumber * pageSize
          );
        };
        let page = 1;
        let realData = null;
        while ((realData = paginate(data, pageSize, page++)).length) {
          await queryRunner.manager.insert(entityClzRef, realData);
          this.logger.debug(
            `saving data...${tableName} process: ${Math.min(
              (page - 1) * pageSize,
              data.length
            )}/${data.length} network: ${network.info.id}`
          );
        }
      } else {
        await queryRunner.manager.insert(entityClzRef, data);
      }
      this.logger.debug(
        `save finished: ${data.length} records network: ${
          network.info.id
        }, whole task spent ${this.getElapsedTimeInSec()}s`
      );

      //console.info('commiting..');
      await queryRunner.commitTransaction();
    } catch (err) {
      //console.error(err);
      this.logger.error(
        `task encounted DB errors, network: ${
          network.info.id
        }, task elapsed ${this.getElapsedTimeInSec()}s`,
        err
      );
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  private async buildCollatorsAndSharedData(
    chain: ChainConnector,
    baseService: StakingBaseService
  ) {
    const chainId = chain.network.id;

    const candidatePool = (
      await chain.api.query.parachainStaking.candidatePool()
    ).toJSON() as any;
    const collators = [];
    const collatorDataMap = {};
    const collatorData = [] as Array<StatCollator>;
    if (candidatePool) {
      for (const it of candidatePool) {
        const c = new StatCollator();
        c.chainId = chainId;
        c.collator = chain.formatAccountAddr(it.owner);
        c.totalStake = chain.formatWithDecimals(it.amount).toNumber();
        c.selfStake = 0;
        c.latestReward = 0;
        c.totalReward = 0;
        c.timestamp = this.taskStartedAt;
        collators.push(c.collator);
        collatorData.push(c);
        collatorDataMap[c.collator] = c;
      }
    }

    const round = (await baseService.getCurrentRoundInfo(chainId)) as {
      current;
      first;
      length;
      totalIssuance;
    };

    // todo seems unused
    const collatorReward = (
      await baseService.getCollatorReward({
        chainId,
        startRoundIndex: round.current - 11 - 0,
        endRoundIndex: round.current - 1 - 0,
        accounts: collators,
      })
    ).rewards;

    const shareData = {
      taskStartedAt: this.taskStartedAt,
      chainId,
      collators,
      collatorData,
      collatorDataMap,
      topDelegators: null,
      bottomDelegators: null,
      collatorReward,
      realtimeCollatorState: await chain.getRealtimeCollatorState(collators),
      round,
    };
    await this.loadDelegators(chain, shareData, chain.network);
    return shareData;
  }

  private getStatNetwork(network: ParachainNetwork, collators: StatCollator[]) {
    const stat = new StatNetwork();
    stat.chainId = network.info.id;
    stat.token = network.info.symbols[0];
    stat.collatorCount = collators.length;
    stat.highestApr = 0;
    stat.delegatorCount = 0;
    stat.totalStake = 0;
    stat.totalReward = 0;
    stat.timestamp = this.taskStartedAt;
    collators.forEach((collator) => {
      stat.highestApr = Math.max(stat.highestApr, collator.apr);
      stat.delegatorCount = stat.delegatorCount + collator.delegatorCount;
      stat.totalStake = stat.totalStake + collator.totalStake;
      stat.totalReward = stat.totalReward + collator.totalReward;
    });
    return stat;
  }

  private async loadDelegators(
    chain,
    shareData,
    network: ChainConnector["network"]
  ) {
    const multiData2JSON = (arr) => {
      const res = [];
      for (const it of arr) {
        const d = it.toJSON();
        res.push(d);
        d.delegations &&
          d.delegations.forEach((delegator) => {
            delegator.owner = chain.formatAccountAddr(delegator.owner);
            delegator.amount = chain
              .formatWithDecimals(delegator.amount)
              .toNumber();
          });
      }
      return res;
    };

    shareData.topDelegators = multiData2JSON(
      await chain.api.query.parachainStaking.topDelegations.multi(
        shareData.collators
      )
    );
    shareData.bottomDelegators = multiData2JSON(
      await chain.api.query.parachainStaking.bottomDelegations.multi(
        shareData.collators
      )
    );
    // update delegatorCount
    shareData.collators.forEach((collator, i) => {
      shareData.collatorDataMap[collator].delegatorCount =
        shareData.topDelegators[i].delegations.length +
        shareData.bottomDelegators[i].delegations.length;
    });
  }
}

// todo  test codes
@Controller("/")
export class DelegatorsScheduleTestController {
  constructor(private cron: StatDataSyncTask) {}

  @Get("/test/cron")
  async test(@Query() request: StatNetworkRequest) {
    await this.cron.doCal(request.chainId, true);
    return `task is running ${this.cron.getElapsedTimeInSec()}s ago`;
  }
}
