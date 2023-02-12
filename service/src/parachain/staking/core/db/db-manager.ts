import { Connection, Repository } from "typeorm";

// ----------------- ENTITIES ---------------
import { NominatorActionHistory } from "src/common/entity/StakingModule/NominatorActionHistory.entity";
import { NominatorRewardDetailHistory } from "src/common/entity/StakingModule/NominatorRewardDetailHistory.entity";
import { CollatorPointHistory } from "src/common/entity/StakingModule/CollatorPointHistory.entity";
import { CollatorActionHistory } from "src/common/entity/StakingModule/CollatorActionHistory.entity";
import { ChainState } from "src/common/entity/StakingModule/ChainState.entity";
import { CollatorNumberHistory } from "src/common/entity/StakingModule/CollatorNumberHistory.entity";
import { RewardHistory } from "src/common/entity/StakingModule/RewardHistory.entity";
import { RoundCollator } from "src/common/entity/StakingModule/RoundCollator.entity";
import {
  StakingPageRequest,
  StakingRequest,
} from "src/viewModel/staking/StakingRequest";
import { StatCollator } from "src/common/entity/StakingPortalStat/StatCollator.entity";
import { StatNetwork } from "src/common/entity/StakingPortalStat/StatNetwork.entity";
import { StatDelegator } from "src/common/entity/StakingPortalStat/StatDelegator.entity";

export class DbManager {
  static readonly instances: Record<string, DbManager> = {};

  static PORTAL: DbManager4Portal;

  constructor(
    readonly dbConnect: Connection,
    readonly chainStateRepository: Repository<ChainState>,
    readonly cnhRepository: Repository<CollatorNumberHistory>,
    readonly cphRepository: Repository<CollatorPointHistory>,
    readonly rhRepository: Repository<RewardHistory>,
    readonly rcRepository: Repository<RoundCollator>,
    readonly cahRepository: Repository<CollatorActionHistory>,
    readonly nahRepository: Repository<NominatorActionHistory>,
    readonly nrdhRepository: Repository<NominatorRewardDetailHistory>
  ) {}

  static register(chainId: string, dbConnect: Connection) {
    let db = this.instances[chainId];
    if (!db) {
      db = new DbManager(
        dbConnect,
        dbConnect.getRepository(ChainState),
        dbConnect.getRepository(CollatorNumberHistory),
        dbConnect.getRepository(CollatorPointHistory),
        dbConnect.getRepository(RewardHistory),
        dbConnect.getRepository(RoundCollator),
        dbConnect.getRepository(CollatorActionHistory),
        dbConnect.getRepository(NominatorActionHistory),
        dbConnect.getRepository(NominatorRewardDetailHistory)
      );
    }
    this.instances[chainId] = db;
  }

  static registerStakingPortal(dbConnect: Connection) {
    this.PORTAL = new DbManager4Portal(
      dbConnect,
      dbConnect.getRepository(StatCollator),
      dbConnect.getRepository(StatNetwork),
      dbConnect.getRepository(StatDelegator)
    );
  }

  static get(req: string | StakingRequest | StakingPageRequest) {
    let chainId = null;
    if (typeof req === "string") {
      chainId = req;
    } else {
      chainId = req.chainId;
    }
    return this.instances[chainId];
  }
}

class DbManager4Portal {
  constructor(
    readonly dbConnect: Connection,
    readonly statCollatorRepository: Repository<StatCollator>,
    readonly statNetworkRepository: Repository<StatNetwork>,
    readonly statDelegatorRepository: Repository<StatDelegator>
  ) {}
}
