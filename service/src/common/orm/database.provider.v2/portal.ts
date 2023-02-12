import { createConnection, Repository } from 'typeorm';
import { join } from 'path';
// import { RepositoryConsts } from '../repositoryConsts';
import { PORTAL_DB_CONFIG } from '../../setting/appConfig';




import { Module, DynamicModule } from "@nestjs/common";
import { ChainConnector } from "src/common/chain/chain-connector";
import { StatCollator } from 'src/common/entity/StakingPortalStat/StatCollator.entity';
import { StatNetwork } from 'src/common/entity/StakingPortalStat/StatNetwork.entity';
import { StatDelegator } from 'src/common/entity/StakingPortalStat/StatDelegator.entity';

export const GO_STAKING_STAT_DB_CONNECT_ALIAS = 'GO_STAKING_DB_CONNECT';

export const GO_STAKING_STAT_DB_PROVIDER = 
    {
      provide: GO_STAKING_STAT_DB_CONNECT_ALIAS,
      useFactory: async () => {
        let connectionOption: any = {
            name: "staking-portal-connect",
            ...PORTAL_DB_CONFIG,
            entities: [
              join(__dirname,   "../../",
              'entity', 'StakingPortalStat', '*.{js,ts}'),
            ],
          };
          return await createConnection(connectionOption);
          },
    }
;

// @Module({
//   providers: [],
// })
// export class DatabaseModule {
//   private static async buildConnection() {
//     let connectionOption: any = {
//         name: "staking-portal-connect",
//         ...PORTAL_DB_CONFIG,
//         entities: [
//           join(__dirname,   "../../../../common",
//           'entity', 'StakingPortalStat', '*.{js,ts}'),
//         ],
//       };
//       return await createConnection(connectionOption);

//   }
//   static async forRoot(): Promise<DynamicModule> {
//     const dbConnect = await DatabaseModule.buildConnection()
//     //   providers.push({
//     //     provide: chain.info.id + "-connection",
//     //     useValue: dbConnect,
//     //   });

//     // const statCollatorRepository: Repository<StatCollator>  =      dbConnect.getRepository(StatCollator)
//     // const statNetworkRepository: Repository<StatNetwork>   =    dbConnect.getRepository(StatNetwork)
//     // const statDelegatorRepository: Repository<StatDelegator>    =    dbConnect.getRepository(StatDelegator);

      
//     //   DbManager.register(chain.info.id, conn);
//       // ChainConnectManager.register(chain.info.id, new ChainConnector(chain.info, chain.defaultValues));
//     // }

//     return {
//       module: DatabaseModule,
//       providers: [dbConnect],
//       exports: [dbConnect],
//     };
//   }
// }
