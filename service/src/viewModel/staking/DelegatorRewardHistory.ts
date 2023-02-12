import { ApiProperty } from "@nestjs/swagger";
import { NominatorRewardDetailHistory } from "src/common/entity/StakingModule/NominatorRewardDetailHistory.entity";
import { PageResponse } from "../base/pageResponse";
import { StakingPageRequest } from "./StakingRequest";

export class DelegatorRewardHistoryRequest extends StakingPageRequest {
  @ApiProperty({ description: "Delegator account" })
  delegatorAccount: string;

  @ApiProperty({
    required: false
  })
  roundindex: number;

  @ApiProperty({
    required: false
  })
  collator: string;

}
export class DelegatorRewardHistoryResponse extends PageResponse {
  @ApiProperty()
  list: NominatorRewardDetailHistory[];
}
