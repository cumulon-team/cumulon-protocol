import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HttpCacheInterceptor } from "src/common/interceptor/HttpCacheInterceptor";
import { UseInterceptors, Controller, Get, CacheTTL } from "@nestjs/common";
import { ParachainNetwork } from "src/common/chain/chain-network";
import { parachainNetworks } from "./chain-network-register";

/**
 * The controller dedicated for exposure the registered networks
 */
@UseInterceptors(HttpCacheInterceptor)
@ApiTags("parachain-staking-register")
@Controller("parachain/staking")
export class StakingRegisterController {

  private supports;

  @Get("/supports")
  @ApiOperation({
    summary: "list of all suported chain networks;获取支持的链列表",
  })
  
  @ApiOkResponse({ type: Array<ParachainNetwork["info"]> })
  @CacheTTL(60)
  getSupports(): Array<ParachainNetwork["info"]> {
    if (!this.supports) {
      this.supports = parachainNetworks.map((it) => {
        const info = JSON.parse(JSON.stringify(it.info)); // deep copy
        info.wssEndpoints = info.wssEndpoints.filter( it => !it.external);
        return info;
      });
    }
    return this.supports;
  }
}
