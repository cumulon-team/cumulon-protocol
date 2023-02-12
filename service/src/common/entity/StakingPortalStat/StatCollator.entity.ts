import { ApiProperty } from "@nestjs/swagger";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity({ name: "stat_collator" })
// @Index(['roundindex'])
export class StatCollator {

  @ApiProperty()
  @PrimaryColumn({name: 'chain_id'})
  chainId: string;

  @ApiProperty()
  @PrimaryColumn()
  collator: string;

  @ApiProperty()
  @Column({ default: 0, type: "decimal", precision: 30, scale: 5 })
  apr: number;

  @ApiProperty()
  @Column({ default: 0 })
  aprRank: number;
  // @ApiProperty()
  // rank: number;

  @ApiProperty()
  @Column({ name: "min_bond", type: "float8" })
  minBond: number;

  @ApiProperty()
  @Column({
    name: "delegator_count",
    comment: "how many delegators",
    default: 0,
  })
  delegatorCount: number;

  @ApiProperty()
  @Column({
    name: "self_stake",
    type: "decimal",
    precision: 30,
    scale: 5,
    default: 0,
  })
  selfStake: number;

  @ApiProperty()
  @Column({
    name: "delegator_stake",
    type: "decimal",
    precision: 30,
    scale: 5,
    default: 0,
  })
  delegatorStake: number;

  @ApiProperty()
  @Column({
    name: "total_stake",
    type: "decimal",
    precision: 30,
    scale: 5,
  })
  totalStake: number;

  @ApiProperty()
  @Column({
    name: "total_stake_rank",
  })
  totalStakeRank: number;

  @Column({ name: "current_block", type: "int", default: 0 })
  currentBlock: number;

  @ApiProperty()
  @Column({ name: "avg_block_in_1r", type: "float8" })
  avgBlockIn1R: number;
  @ApiProperty()
  @Column({ name: "avg_block_rank_in_1r", type: "int" })
  avgBlockRankIn1R: number;

  @ApiProperty()
  @Column({ name: "avg_block_in_3r", type: "float8" })
  avgBlockIn3R: number;
  @Column({ name: "avg_block_rank_in_3r", type: "int" })
  avgBlockRankIn3R: number;

  @ApiProperty()
  @Column({ name: "avg_block_in_4r", type: "float8" })
  avgBlockIn4R: number;
  @Column({ name: "avg_block_rank_in_4r", type: "int" })
  avgBlockRankIn4R: number;

  @ApiProperty()
  @Column({ name: "avg_block_in_5r", type: "float8" })
  avgBlockIn5R: number;
  @Column({ name: "avg_block_rank_in_5r", type: "int" })
  avgBlockRankIn5R: number;

  @ApiProperty()
  @Column({ name: "avg_block_in_8r", type: "float8" })
  avgBlockIn8R: number;
  @Column({ name: "avg_block_rank_in_8r" })
  avgBlockRankIn8R: number;

  @ApiProperty()
  @Column({ name: "avg_block_in_10r", type: "float8" })
  avgBlockIn10R: number;
  @Column({ name: "avg_block_rank_in_10r", type: "int" })
  avgBlockRankIn10R: number;

  // @ApiProperty()
  // totalStaked: number;

  @ApiProperty()
  @Column({
    name: "total_reward",
    default: 0,
    type: "decimal",
    precision: 30,
    scale: 5,
  })
  totalReward: number;

  @ApiProperty()
  @Column({
    name: "latest_reward",
    default: 0,
    type: "decimal",
    precision: 30,
    scale: 5,
  })
  latestReward: number;

  @ApiProperty()
  @Column({
    name: "min_rps",
    default: 0,
    type: "float8",
  })
  minRps: number;

  @ApiProperty()
  @Column({
    name: "max_rps",
    default: 0,
    type: "float8",
  })
  maxRps: number;
  
  @ApiProperty()
  @Column({
    name: "avg_rps",
    default: 0,
    type: "float8",
  })
  avgRps: number;
  
  @ApiProperty({
    description: 'rps in last 10rounds, the JSON format is [  {roundIndex: 0, rps: 0} ] '
  })
  @Column({
    name: 'rps_his',
    type: "text",
    default: '{}',
  })
  rpsHis: string;

  @ApiProperty(
    {description: 'RPS Volatility Score'}
  )
  @Column({
    name: "rps_score",
    default: 0,
    type: "float8",
  })
  rpsScore: number;



  @ApiProperty()
  @Column({
    comment: "the timestamp of current action",
    type: "timestamptz",
    default: new Date(),
  })
  timestamp: Date;
}
