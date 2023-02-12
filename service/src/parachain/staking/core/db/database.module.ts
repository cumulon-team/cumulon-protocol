import { Module, DynamicModule } from "@nestjs/common";
import { join } from "path";
import { ChainConnector } from "src/common/chain/chain-connector";
import { createConnection } from "typeorm";

import { parachainNetworks } from "../register/chain-network-register";
import { ChainConnectManager } from "../chain/chain-connect-manager";
import { DbManager } from "./db-manager";
import { GO_STAKING_STAT_DB_CONNECT_ALIAS, GO_STAKING_STAT_DB_PROVIDER } from "src/common/orm/database.provider.v2/portal";
import { GoStakingPortalDbRegister } from "./go-staking-portal-db-register";

@Module({
  providers: [GO_STAKING_STAT_DB_PROVIDER, GoStakingPortalDbRegister],
})
export class DatabaseModule {
  private static async resolveConnection({ dbConfig, info: { id } }) {
    let connectionOption: any = {
      ...dbConfig,
      maxQueryExecutionTime: 4000,
      name: id + "-connect",
      entities: [
        join(
          __dirname,
          "../../../../common",
          "entity",
          "StakingModule",
          "*.{js,ts}"
        ),
      ],
    };
    return createConnection(connectionOption);
  }
  static async forRoot(): Promise<DynamicModule> {
    const providers = [];
    for (let index = 0; index < parachainNetworks.length; index++) {
      const chain = parachainNetworks[index];
      const conn = await DatabaseModule.resolveConnection(chain);

      providers.push({
        provide: chain.info.id + "-connection",
        useValue: conn,
      });
      DbManager.register(chain.info.id, conn);
      // ChainConnectManager.register(chain.info.id, new ChainConnector(chain.info, chain.defaultValues));
    }

    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
