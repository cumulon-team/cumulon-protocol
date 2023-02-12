import { Module, DynamicModule } from "@nestjs/common";
import { ChainConnector } from "src/common/chain/chain-connector";

import { parachainNetworks } from "../register/chain-network-register";
import { ChainConnectManager } from "./chain-connect-manager";
import { MoonriverChainConnector } from "./connector/moonriver-chain-connector";

@Module({
  providers: [],
})
export class ChainConnectModule {
  static async forRoot(): Promise<DynamicModule> {
    const providers = [];
    parachainNetworks.forEach(({ info, defaultValues }) => {
      const conn = ((chainId) => {
        if (chainId === 'moonbeam' || chainId === 'moonriver') {
          return new MoonriverChainConnector(info, defaultValues);
        }
        return new ChainConnector(info, defaultValues);
      })(info.id);

    //   providers.push({
    //     provide: info.id + "-chain-connect",
    //     useValue: conn,
    //   });
      ChainConnectManager.register(info.id, conn);
    });
    return {
      module: ChainConnectModule,
      providers: providers,
      exports: providers,
    };
  }
}
