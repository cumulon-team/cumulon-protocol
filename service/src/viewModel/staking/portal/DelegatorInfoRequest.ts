import { ApiProperty } from "@nestjs/swagger";
import { StakingPageRequest, StakingRequest } from "../StakingRequest";

export class DelegatorInfoRequest extends StakingRequest {
  @ApiProperty()
  delegator: string;
}
