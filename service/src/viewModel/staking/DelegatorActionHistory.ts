import { ApiProperty } from "@nestjs/swagger";
import { NominatorActionHistory } from "src/common/entity/StakingModule/NominatorActionHistory.entity";
import { PageResponse } from "../base/pageResponse";
import { StakingPageRequest } from "./StakingRequest";

export class DelegatorActionHistoryRequest extends StakingPageRequest {
  @ApiProperty({ description: "Delegator account" })
  delegatorAccount: string;
  
  @ApiProperty({ required: false })
  actionType: string;
}
export class DelegatorActionHistoryResponse extends PageResponse {
  @ApiProperty()
  list: NominatorActionHistory[];
}
