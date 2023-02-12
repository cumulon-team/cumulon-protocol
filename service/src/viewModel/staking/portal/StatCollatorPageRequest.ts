import { ApiProperty } from "@nestjs/swagger";
import { StakingPageRequest } from "../StakingRequest";

export class StatCollatorPageRequest extends StakingPageRequest {
  @ApiProperty({
    description:
      "if specified it to the true, data will return the total for pagination",
    default: false
  })
  needTotal = false;

  @ApiProperty({
    required: false,
    description: 'used for search'
  })
  collator: string;

  @ApiProperty({
    required: false,
    description: 'used for search'
  })
  delegator: string;

  @ApiProperty({
    required: false,
    description: 'if required myStake value, this field is compulsory'
  })
  myAccount: string

}
