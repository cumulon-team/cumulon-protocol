import { Injectable } from "@nestjs/common";
import { MoonbeamStakingBaseService } from "./moonbeam-staking-base-service";


// BASED on the current service naming convension (if a service is expected to be loaded as a chain-network-specific service), 
// you should name it as {XXX}StakingBaseService or will on be loaded StakingBaseService for their service
@Injectable()
export class MoonriverStakingBaseService extends MoonbeamStakingBaseService {

}
