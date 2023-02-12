<template>
  <a-spin style="width: 100%" :loading="loading">
    <div class="table-wrap">
      <el-table
        :data="tableData"
        ref="table"
        @expand-change="handleExpand"
        @sort-change="tableSortChange"
      >
        <el-table-column type="expand" fixed width="24">
          <template #default="scope">
            <!-- <p>State: {{ scope.row.state }}</p> -->
            <div class="expand-content">
              <div class="chart-wrap">
                <div class="title">
                  <div class="icon"></div>
                  <span class="text">Rewards (last 10 rounds)</span>
                </div>
                <v-chart class="chart" :option="getRowChartOption(scope.row)" />
              </div>
              <div class="rank-wrap">
                <div class="title">
                  <div class="icon"></div>
                  <span class="text">Top3 Delegators (staked amount%)</span>
                </div>
                <div
                  v-if="top3DelegatorDataMap[scope.row.collator]"
                  class="rank"
                >
                  <div
                    v-for="(v, i) in top3DelegatorDataMap[scope.row.collator]"
                    :key="i"
                    class="item"
                  >
                    <div class="rank-img-wrap">
                      <img
                        v-if="i == 0"
                        src="@/assets/images/home/Group1.png"
                        alt=""
                      />
                      <img
                        v-if="i == 1"
                        src="@/assets/images/home/Group1(1).png"
                        alt=""
                      />
                      <img
                        v-if="i == 2"
                        src="@/assets/images/home/Group1(2).png"
                        alt=""
                      />
                    </div>
                    <IdentityWrap :address="v.delegator">
                      <template #default="{ identity }">
                        <div class="head-icon">
                          <IdentityIcon
                            class="hover-item"
                            @click="goToDelegatorDetail(v.delegator)"
                            :identity="identity"
                            :address="v.delegator"
                            :iconSize="40"
                          ></IdentityIcon>
                        </div>
                        <a-tooltip :content="v.delegator" placement="top">
                          <div
                            class="address hover-primary"
                            @click="goToDelegatorDetail(v.delegator)"
                          >
                            {{
                              identity.display
                                ? identity.display
                                : $utils.shorterAddress(v.delegator)
                            }}
                          </div>
                        </a-tooltip>
                      </template>
                    </IdentityWrap>
                    <div class="percent">
                      {{ figureStakePercent(v, scope.row) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="Collator" fixed width="220">
          <template #header>
            <div class="flex-center">
              <span class="text">Collator </span>
              <a-tooltip content="Rank by total stake">
                <img
                  style="width: 16px"
                  src="@/assets/images/moonbeam/Group_47.png"
                  alt=""
                />
              </a-tooltip>
            </div>
          </template>
          <template #default="scope">
            <div class="table-collector">
              <span class="text" :class="'color' + scope.row.totalStakeRank">{{
                getIndex(scope.row.totalStakeRank)
              }}</span>
              <IdentityWrap :address="scope.row.collator">
                <template #default="{ identity }">
                  <IdentityIcon
                    class="icon hover-item"
                    @click="goToCollatorDetail(scope.row.collator)"
                    :identity="identity"
                    :address="scope.row.collator"
                    :iconSize="32"
                  ></IdentityIcon>
                  <div class="right">
                    <a-tooltip :content="scope.row.collator" placement="top">
                      <div
                        class="top hover-primary"
                        @click="goToCollatorDetail(scope.row.collator)"
                      >
                        {{
                          identity.display
                            ? identity.display
                            : $utils.shorterAddress(scope.row.collator)
                        }}
                      </div>
                    </a-tooltip>
                    <div class="bottom">
                      <span :class="getSafeStatus(scope.row)">{{
                        getSafeStatus(scope.row)
                      }}</span>
                      <span v-if="ifStaked(scope.row)" class="delegated"
                        >Delegated</span
                      >
                    </div>
                  </div>
                </template>
              </IdentityWrap>
            </div>
          </template>
        </el-table-column>

        <template v-for="(v, i) in selectColumns" :key="i">
          <el-table-column
            v-if="v.name == 'APR'"
            sortable="custom"
            :prop="v.prop"
            :label="v.name"
            :width="v.width"
            :min-width="v['min-width']"
          >
            <template #default="scope">
              <span class="text"
                >{{ $utils.roundNumber(scope.row[v.prop]) }}%</span
              >
            </template>
          </el-table-column>

          <el-table-column
            v-else-if="v.tip"
            :prop="v.prop"
            :label="v.name"
            :width="v.width"
            sortable="custom"
            :min-width="v['min-width']"
          >
            <template #header>
              <div class="flex-center">
                <span class="text">{{ v.name }}</span>
                <a-tooltip>
                  <template #content>
                    <div v-if="v.name == 'Avg Blocks'">
                      number of blocks which has been rewarded in past 10
                      rounds( round {{ startRoundIndex }} -
                      {{ endRoundIndex }} ).
                    </div>
                    <div v-else-if="v.name == 'Current Blocks'">
                      Blocks produced in the current round
                      {{ endRoundIndex }}.
                    </div>
                    <div v-else v-html="v.tip"></div>
                  </template>
                  <img
                    style="width: 16px"
                    src="@/assets/images/moonbeam/Group_47.png"
                    alt=""
                  />
                </a-tooltip>
              </div>
            </template>
            <template #default="scope">
              <span class="text">{{
                scope.row[v.prop] === null || scope.row[v.prop] === undefined
                  ? "-"
                  : $utils.roundNumber(scope.row[v.prop])
              }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else
            sortable="custom"
            :prop="v.prop"
            :label="v.name"
            :width="v.width"
            :min-width="v['min-width']"
          >
            <template #default="scope">
              <span class="text">{{
                scope.row[v.prop] === null
                  ? ""
                  : $utils.roundNumber(scope.row[v.prop])
              }}</span>
            </template>
          </el-table-column>
        </template>

        <el-table-column prop="Action" label="Action" width="150" fixed="right">
          <template #header>
            <div class="flex-center" style="flex: 1">
              <span class="text">Action</span>
              <a-popover
                v-model:popup-visible="popoverShow"
                trigger="click"
                position="br"
              >
                <img
                  @click="clickPopover"
                  class="table-option-icon"
                  src="@/assets/images/moonbeam/Frame_67.png"
                  alt=""
                />
                <template #content>
                  <div class="table-option-content">
                    <div class="title">Select Incidators</div>
                    <div class="sort-list">
                      <a-checkbox-group v-model="checkboxList">
                        <draggable
                          tag="ul"
                          :list="draggableList"
                          class="list-group"
                          handle=".handle"
                          item-key="name"
                        >
                          <template #item="{ element, index }">
                            <li class="list-group-item">
                              <img
                                class="icon handle"
                                src="@/assets/images/moonbeam/Glyph_move.png"
                                alt=""
                              />
                              <a-checkbox
                                :disabled="ifCheckboxDisabled(element)"
                                :value="element.name"
                                >{{ element.name }}</a-checkbox
                              >
                            </li>
                          </template>
                        </draggable>
                      </a-checkbox-group>
                    </div>
                    <div class="btn-wrap">
                      <a-button type="outline" @click="comfirmSort()"
                        >Confirm</a-button
                      >
                    </div>
                  </div>
                </template>
              </a-popover>
            </div>
          </template>
          <template #default="scope">
            <span class="common-table-option" @click="openDrawer(scope.row)"
              >Simulate</span
            >
            <span @click="handleDelegate(scope.row)" class="common-table-option"
              >Delegate</span
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <a-pagination
          @change="getTableData"
          :total="totalCount"
          v-model:current="pageIndex"
          v-model:page-size="pageSize"
          show-total
          show-jumper
        />
      </div>
      <a-drawer
        :width="720"
        :closable="false"
        :header="false"
        :footer="false"
        :visible="drawerVisible"
        @cancel="drawerVisible = false"
        unmountOnClose
      >
        <div class="drawer-content">
          <div class="drawer-title">
            <span class="title">Simulate</span>
            <img
              class="hover-item"
              @click="drawerVisible = false"
              src="@/assets/images/moonbeam/Vector1.png"
              alt=""
            />
          </div>
          <a-spin
            style="width: 100%; min-height: 300px"
            :loading="!currentRow.collator"
          >
            <div v-if="currentRow.collator" class="drawer-main">
              <div class="info-wrap">
                <div class="collector">
                  <IdentityWrap :address="currentRow.collator">
                    <template #default="{ identity }">
                      <IdentityIcon
                        :identity="identity"
                        :address="currentRow.collator"
                        :iconSize="56"
                      ></IdentityIcon>
                      <div class="right">
                        <div class="title">Collator</div>
                        <a-tooltip
                          :content="currentRow.collator"
                          placement="top"
                        >
                          <div class="value">
                            {{
                              identity.display
                                ? identity.display
                                : $utils.shorterAddress(currentRow.collator)
                            }}
                          </div>
                        </a-tooltip>
                      </div>
                    </template>
                  </IdentityWrap>
                </div>
                <div class="rank">
                  <div class="title">Collator Rank</div>
                  <div class="value">{{ currentRow.totalStakeRank }}</div>
                </div>
                <div class="state">
                  <span class="tag" :class="getSafeStatus(currentRow)">{{
                    getSafeStatus(currentRow)
                  }}</span>
                  <div v-if="ifStaked(currentRow)" class="tag yellow">
                    Delegated
                  </div>
                </div>
              </div>
              <div class="head">
                <div class="icon"></div>
                <span>Stake</span>
              </div>
              <div class="input-wrap">
                <a-input-number
                  hide-button
                  class="input"
                  v-model="inputValue"
                  :min="0"
                >
                  <template #suffix>
                    <span class="input-unit">{{
                      $store.state.global.currentChain.symbols[0]
                    }}</span>
                  </template>
                </a-input-number>
              </div>
              <div class="slider-wrap">
                <div class="split-wrap">
                  <div v-for="v in 4" :key="v" class="split"></div>
                </div>
                <div class="gray-line">
                  <div
                    class="blue-line"
                    :style="{
                      width: getSumulatePercent(currentRow),
                    }"
                  ></div>
                  <div
                    class="g-split"
                    :style="{ left: getSumulatePercent(currentRow) }"
                  ></div>
                  <div
                    class="popover"
                    :style="{ left: getSumulatePercent(currentRow) }"
                  >
                    <img src="@/assets/images/home/Subtract.png" alt="" />
                    <div class="center">
                      <div class="nowrap">
                        Rank {{ getSimulateRank(currentRow) }}
                      </div>
                      <div>Stake {{ inputValue }}</div>
                    </div>
                  </div>
                </div>
                <div class="mark-wrap">
                  <div class="mark-item">
                    <div class="rank">Rank {{ maxNominator }}</div>
                    <div class="stake">
                      Stake
                      {{
                        getSingleNominatorStakeByRank(currentRow, maxNominator)
                      }}
                    </div>
                  </div>
                  <div class="mark-item">
                    <div class="rank">
                      Rank {{ parseInt(maxNominator * 0.9) }}
                    </div>
                    <div class="stake">
                      Stake
                      {{
                        getSingleNominatorStakeByRank(
                          currentRow,
                          parseInt(maxNominator * 0.9)
                        )
                      }}
                    </div>
                  </div>
                  <div class="mark-item">
                    <div class="rank">
                      Rank {{ parseInt(maxNominator * 0.5) }}
                    </div>
                    <div class="stake">
                      Stake
                      {{
                        getSingleNominatorStakeByRank(
                          currentRow,
                          parseInt(maxNominator * 0.5)
                        )
                      }}
                    </div>
                  </div>
                  <div class="mark-item">
                    <div class="rank">Rank 1</div>
                    <div class="stake">
                      Stake
                      {{ getSingleNominatorStakeByRank(currentRow, 1) }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="head">
                <div class="icon"></div>
                <span>Reward next round </span>
              </div>
              <div class="range">
                <div class="left">
                  <div class="top">
                    <span class="num">{{
                      getBoundaryReward1(currentRow)
                    }}</span>
                    <span class="unit">{{
                      $store.state.global.currentChain.symbols[0]
                    }}</span>
                  </div>
                  <div class="bottom">Min Estimate Reward</div>
                </div>
                <div class="split">~</div>
                <div class="right">
                  <div class="top">
                    <span class="num">{{
                      getBoundaryReward2(currentRow)
                    }}</span>
                    <span class="unit">{{
                      $store.state.global.currentChain.symbols[0]
                    }}</span>
                  </div>
                  <div class="bottom">Max Estimate Reward</div>
                </div>
              </div>
              <div class="btn-wrap">
                <a-button @click="goToDelegate" class="btn" type="primary"
                  >Go to delegate</a-button
                >
              </div>
            </div>
          </a-spin>
        </div>
      </a-drawer>
      <DelegateDrawer @success="delegateSuccess" ref="DelegateDrawerRef" />
    </div>
  </a-spin>
</template>

<script>
import { BigNumber } from "bignumber.js";
import {
  collatorStatistics,
  getCurrentRoundInfo,
  getCollatorReward,
  delegatorStatistics,
  getMaxNominatorsPerCollator,
} from "@/api/staking";
import IdentityWrap from "@/components/IdentityWrap";
import IdentityIcon from "@/components/IdentityIcon";
import draggable from "vuedraggable";
import DelegateDrawer from "@/components/DelegateDrawer";

export default {
  props: ["getSafeStatus", "ifStaked"],
  components: {
    draggable,
    DelegateDrawer,
    IdentityWrap,
    IdentityIcon,
  },
  data() {
    const defaultDraggableList = [
      {
        name: "Min Bond",
        prop: "minBond",
        "min-width": "140",
        tip: "minimum amount of tokens to delegate candidates once a user is in the set of delegators",
      },
      { name: "Total Stake", prop: "totalStake", "min-width": "140" },
      { name: "Delegator Stake", prop: "delegatorStake", "min-width": "160" },
      { name: "Self Stake", prop: "selfStake", "min-width": "140" },
      {
        name: "My Stake",
        prop: "myStake",
        "min-width": "140",
        tip: "my staked amount for this round",
      },
      {
        name: "Avg Blocks",
        prop: "avgBlockIn10R",
        "min-width": "140",
        tip: "number of blocks which has been rewarded in past 10 rounds( round 65907 - 65916 ). number in the parenthesis is changed as per round.",
      },
      {
        name: "Current Blocks",
        prop: "currentBlock",
        "min-width": "180",
        tip: "Blocks produced in the current round 65927. number in the parenthesis is changed as per round.",
      },
      { name: "APR", prop: "apr", "min-width": "140" },
      { name: "Total Rewards", prop: "totalReward", "min-width": "140" },
      { name: "Latest Rewards", prop: "latestReward", "min-width": "160" },
      {
        name: "Avg RPS",
        prop: "avgRps",
        "min-width": "140",
        tip: "Average rewards per stake.<br/>1. Use data of latest 10 rounds,<br/>2. Get a list of RPS: total rewards of each round / total stake of each round<br/>3. Calculate mean of the list to get Avg RPS",
      },
      {
        name: "Min RPS",
        prop: "minRps",
        "min-width": "140",
        tip: "Minimum rewards per stake.<br/>1. Use data of latest 10 rounds,<br/> 2. Get a list of RPS: total rewards of each round / total stake of each round<br/>3. Find the minium of the list",
      },
      {
        name: "Max RPS",
        prop: "maxRps",
        "min-width": "140",
        tip: "Maximum rewards per stake.<br/>1. Use data of latest 10 rounds,<br/>2. Get a list of RPS: total rewards of each round / total stake of each round<br/>3. Find the maximum of the list",
      },
      {
        name: "RPS Volatility Score",
        prop: "rpsScore",
        "min-width": "220",
        tip: "The volatility of rewards. The less the volatility is, the rewards from this collator are relatively stable.<br/>1. Use data of latest 10 rounds,<br/>2. Get a list of RPS: total rewards of each round / total stake of each round<br/>3. Find the standard deviation of the list",
      },
    ];
    const defaultCheckboxList = [
      "Total Stake",
      "Avg Blocks",
      "APR",
      "Total Rewards",
      "Latest Rewards",
      "RPS Volatility Score",
    ];
    const leadboardCheckboxList = localStorage.getItem("leadboardCheckboxList");
    const leadboardSavedDragColumns = localStorage.getItem(
      "leadboardSavedDragColumns"
    );
    const leadboardSelectColumns = localStorage.getItem(
      "leadboardSelectColumns"
    );
    return {
      maxNominator: 50,
      loading: false,
      orderBys: [{ sort: "totalStake", order: "DESC" }],
      collatorRewardDataMap: {},
      top3DelegatorDataMap: {},
      roundInfo: {
        current: null,
        first: null,
        length: null,
        totalIssuance: null,
      },
      pageIndex: 1,
      pageSize: 10,
      totalCount: 0,
      inputValue: 0,
      drawerVisible: false,
      popoverShow: false,
      currentRow: {},
      tableData: [],
      draggableList: JSON.parse(JSON.stringify(defaultDraggableList)),
      checkboxList: leadboardCheckboxList
        ? JSON.parse(leadboardCheckboxList)
        : defaultCheckboxList,
      savedDragColumns: leadboardSavedDragColumns
        ? JSON.parse(leadboardSavedDragColumns)
        : JSON.parse(JSON.stringify(defaultDraggableList)),
      selectColumns: leadboardSelectColumns
        ? JSON.parse(leadboardSelectColumns)
        : JSON.parse(JSON.stringify(defaultDraggableList)),
    };
  },
  created() {
    this.comfirmSort();
    this.initPage();
  },
  watch: {
    "$store.state.global.currentChain"() {
      this.initPage();
    },
    "$store.state.global.metamaskWallet"() {
      this.getTableData();
    },
    "$store.state.global.polkadotWallet"() {
      this.getTableData();
    },
  },
  computed: {
    startRoundIndex() {
      return this.roundInfo.current - 11;
    },
    endRoundIndex() {
      return this.roundInfo.current - 2;
    },
  },
  methods: {
    getSumulatePercent(row) {
      const rank = this.getSimulateRank(row);
      const percent = BigNumber(this.maxNominator - rank)
        .dividedBy(this.maxNominator)
        .multipliedBy(100);
      return percent.toFixed(2) + "%";
    },
    getSingleNominatorStakeByRank(row, rank) {
      if (!row.allNominators[rank - 1]) {
        return BigNumber(0);
      }
      const stake = row.allNominators[rank - 1].stake;
      return this.$utils.roundNumber(stake);
    },
    getSimulateRank(row) {
      if (!row.allNominators.length) {
        return 1;
      }
      const index = row.allNominators.findIndex((v) => {
        const result =
          BigNumber(this.inputValue || 0).toNumber() >
          BigNumber(v.stake).toNumber();
        return result;
      });
      if (index == -1) {
        return row.allNominators.length + 1;
      }
      return index + 1;
    },
    getBoundaryReward1(row) {
      let topSum = BigNumber(0);
      row.rpsHis.forEach((v) => {
        topSum = topSum.plus(
          BigNumber(v.rps).minus(row.avgRps).exponentiatedBy(2)
        );
      });
      const standardDeviation = topSum.dividedBy(row.rpsHis.length).sqrt();
      const min = BigNumber(this.inputValue || 0).multipliedBy(
        new BigNumber(row.avgRps).minus(standardDeviation)
      );
      return min.toFormat(5);
    },
    getBoundaryReward2(row) {
      let topSum = BigNumber(0);
      row.rpsHis.forEach((v) => {
        topSum = topSum.plus(
          BigNumber(v.rps).minus(row.avgRps).exponentiatedBy(2)
        );
      });
      const standardDeviation = topSum.dividedBy(row.rpsHis.length).sqrt();
      const max = BigNumber(this.inputValue || 0).multipliedBy(
        new BigNumber(row.avgRps).plus(standardDeviation)
      );
      return max.toFormat(5);
    },
    delegateSuccess() {
      this.getTableData();
      this.$emit("updateMyStakeList");
    },
    initPage() {
      this.getMaxNominatorsPerCollator();
      this.getRoundInfo();
      this.getTableData();
    },
    getMaxNominatorsPerCollator() {
      getMaxNominatorsPerCollator({
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        this.maxNominator = d;
      });
    },
    tableSortChange({ prop, order }) {
      if (!order) {
        this.orderBys = [{ sort: "totalStake", order: "DESC" }];
      } else {
        this.orderBys = [
          { sort: prop, order: order == "ascending" ? "ASC" : "DESC" },
        ];
      }
      this.getTableData();
    },
    figureStakePercent(sv, v) {
      const result = new BigNumber(sv.stake)
        .div(new BigNumber(v.delegatorStake))
        .multipliedBy(100)
        .toFormat(2);
      return result;
    },
    getRowChartOption(row) {
      const rewardHistoryList = this.collatorRewardDataMap[row.collator] || [];
      const option = {
        textStyle: {
          fontFamily: "DM Sans",
        },
        xAxis: {
          type: "category",
          data: rewardHistoryList.map((v) => "Round " + v.roundIndex),
        },
        grid: {
          left: 0,
          top: 5,
          right: 20,
          bottom: 0,
        },
        yAxis: {
          type: "value",
          show: false,
        },
        tooltip: {
          confine: true,
          formatter: (params) => {
            return `
            <div>
              <div style="font-weight: 500;font-size: 12px;line-height: 20px;letter-spacing: -0.02em;color: #A3AED0;">${
                params.name
              }</div>
              <div style="font-weight: 500;font-size: 20px;line-height: 28px;color: #1B2559;margin-top:1px;">${this.$utils.roundNumber(
                params.value
              )}</div>
            </div>
            `;
          },
        },
        series: [
          {
            itemStyle: {
              color: "#9374FF",
              borderRadius: 4,
            },
            data: rewardHistoryList.map((v) => v.reward.toNumber()),
            type: "bar",
            // barWidth: 24,
          },
          {
            itemStyle: {
              color: "#FF844B",
            },
            lineStyle: {
              color: "#FF844B",
              width: 3,
            },
            data: rewardHistoryList.map((v) => v.reward.toNumber()),
            type: "line",
          },
        ],
      };
      return option;
    },
    handleExpand(row) {
      this.getCollatorReward(row);
      this.getTop3DelegatorStatistics(row);
    },
    getTop3DelegatorStatistics(row) {
      delegatorStatistics({
        pageSize: 3,
        pageIndex: 1,
        orderBys: [{ sort: "stake", order: "DESC" }],
        chainId: this.$store.state.global.currentChain.id,
        collator: row.collator,
      }).then((d) => {
        this.top3DelegatorDataMap[row.collator] = d.list;
      });
    },
    getCollatorReward(row) {
      getCollatorReward({
        chainId: this.$store.state.global.currentChain.id,
        startRoundIndex: this.startRoundIndex,
        endRoundIndex: this.endRoundIndex,
        accounts: [row.collator],
      }).then((d) => {
        const arr = [];
        for (let i = this.startRoundIndex; i <= this.endRoundIndex; i++) {
          const find = d.rewards.find(
            (sv) =>
              sv.account.toLowerCase() == row.collator.toLowerCase() &&
              Number(sv.roundIndex) == i
          );
          if (find) {
            arr.push({
              roundIndex: i,
              reward: BigNumber(find.reward),
            });
          } else {
            arr.push({
              roundIndex: i,
              reward: BigNumber(0),
            });
          }
        }
        this.collatorRewardDataMap[row.collator] = arr;
      });
    },
    getRoundInfo() {
      getCurrentRoundInfo({
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        this.roundInfo = d;
      });
    },
    goToCollatorDetail(address) {
      localStorage.setItem("routeParamsAddress", address);
      this.$router.push({
        name: "collatorDetail",
      });
    },
    goToDelegatorDetail(address) {
      localStorage.setItem("routeParamsAddress", address);
      this.$router.push({
        name: "delegatorDetail",
      });
    },
    getTableData() {
      this.loading = true;
      collatorStatistics({
        myAccount: this.$store.getters.currentChainWalletAddress,
        pageIndex: this.pageIndex,
        pageSize: this.pageSize,
        orderBys: this.orderBys,
        needTotal: true,
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        this.loading = false;
        this.tableData = d.list;
        this.totalCount = d.totalCount;
      });
    },
    handleDelegate(row) {
      // 未登录或者钱包与网络不匹配
      if (
        !this.$store.getters.ifLogin ||
        (this.$utils.ifSupportPolkadot(
          this.$store.state.global.currentChain.network
        ) &&
          !this.$store.getters.polkadotWalletTransformAddress) ||
        (!this.$utils.ifSupportPolkadot(
          this.$store.state.global.currentChain.network
        ) &&
          !this.$store.state.global.metamaskWallet.address)
      ) {
        this.$eventBus.emit("goSignIn");
        return;
      }
      this.currentRow = row;
      this.goToDelegate();
    },
    goToDelegate() {
      this.$refs.DelegateDrawerRef.init(this.currentRow.collator);
    },
    ifCheckboxDisabled(v) {
      if (v.name == "My Stake" && !this.$store.getters.ifLogin) {
        return true;
      }
      return false;
    },
    openDrawer(row) {
      this.drawerVisible = true;
      this.inputValue = 0;
      this.currentRow = {};
      delegatorStatistics({
        pageSize: 9999999999,
        pageIndex: 1,
        orderBys: [{ sort: "stake", order: "DESC" }],
        chainId: this.$store.state.global.currentChain.id,
        collator: row.collator,
      }).then((d) => {
        this.currentRow = { ...row, allNominators: d.list };
      });
    },
    getIndex(index) {
      if (index < 10) {
        return "0" + index;
      }
      return index;
    },
    clickPopover() {
      this.draggableList = JSON.parse(JSON.stringify(this.savedDragColumns));
      // 若未登录，去掉myStake选项
      const myStakeIndex = this.checkboxList.findIndex((v) => v == "My Stake");
      if (myStakeIndex !== -1 && !this.$store.getters.ifLogin) {
        this.checkboxList.splice(myStakeIndex, 1);
        localStorage.setItem(
          "leadboardCheckboxList",
          JSON.stringify(this.checkboxList)
        );
        this.selectColumns = JSON.parse(
          JSON.stringify(this.savedDragColumns)
        ).filter((v) => {
          return this.checkboxList.find((sv) => sv == v.name);
        });
        localStorage.setItem(
          "leadboardSelectColumns",
          JSON.stringify(this.selectColumns)
        );
      }
    },
    comfirmSort() {
      this.popoverShow = false;
      this.savedDragColumns = JSON.parse(JSON.stringify(this.draggableList));
      this.selectColumns = JSON.parse(
        JSON.stringify(this.savedDragColumns)
      ).filter((v) => {
        return this.checkboxList.find((sv) => sv == v.name);
      });
      localStorage.setItem(
        "leadboardCheckboxList",
        JSON.stringify(this.checkboxList)
      );
      localStorage.setItem(
        "leadboardSavedDragColumns",
        JSON.stringify(this.savedDragColumns)
      );
      localStorage.setItem(
        "leadboardSelectColumns",
        JSON.stringify(this.selectColumns)
      );
      // 若宽度不够，防止表格变窄
      // this.$nextTick(() => {
      //   const table = this.$refs.table;
      //   if (this.selectColumns.find((v) => !v.width)) {
      //     return;
      //   }
      //   let totalWidth = 0;
      //   this.selectColumns.forEach((v) => {
      //     totalWidth += Number(v.width);
      //   });
      //   if (
      //     totalWidth +
      //       table.layout.fixedWidth.value +
      //       table.layout.rightFixedWidth.value <
      //     table.layout.bodyWidth.value
      //   ) {
      //     // // 最后一列宽度放开
      //     this.selectColumns[this.selectColumns.length - 1].width = undefined;
      //   }
      // });
    },
  },
};
</script>
<style lang="less" scoped>
.table-wrap {
  margin-top: 50px;
}
.flex-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .text {
    margin-top: 1px;
    margin-right: 4px;
  }
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.table-collector {
  display: flex;
  align-items: center;
  .text {
    white-space: nowrap;
    width: 22px;
    font-weight: 700;
    font-size: 16px;
    color: #b0bbd5;
    &.color1 {
      color: #ffa800;
    }
    &.color2 {
      color: #707eae;
    }
    &.color3 {
      color: #cf8080;
    }
  }
  .icon {
    margin-left: 10px;
    margin-right: 8px;
    width: 32px;
    height: 32px;
  }
  .right {
    .top {
      font-weight: 400;
      font-size: 14px;
      line-height: 24px;
      letter-spacing: -0.02em;
      color: #2b3674;
    }
    .bottom {
      margin-top: -2px;
      font-weight: 400;
      font-size: 12px;
      line-height: 20px;
      letter-spacing: -0.02em;
      color: #05cd99;
      .Risk {
        color: #e31a1a;
      }
      .Safe {
        color: #05cd99;
      }
      .Pending {
        color: #10a7e4;
      }
      .delegated {
        color: #ffa800;
        margin-left: 6px;
      }
    }
  }
}
.table-option-content {
  .title {
    text-align: center;
    font-weight: 700;
    font-size: 16px;
    color: #000000;
  }
  .sort-list {
    margin-top: 15px;
    .list-group {
      .list-group-item {
        padding: 6px 10px;
        display: flex;
        align-items: center;
        &.sortable-chosen:not(.sortable-ghost) {
          background: #e9e3ff;
          border-radius: 10px;
        }
        .icon {
          margin-right: 12px;
          width: 16px;
          cursor: move;
        }
        /deep/ .arco-checkbox-label {
          font-size: 13px;
          color: #8f9bba;
        }
      }
    }
  }
  .btn-wrap {
    text-align: center;
    margin-top: 18px;
    :deep(.arco-btn) {
      width: 110px;
    }
  }
}
.expand-content {
  padding: 12px 31px;
  background: #f4f7fe;
  border-radius: 10px;
  left: 0;
  right: 0;
  position: sticky;
  width: calc(100vw - 404px);
  display: flex;

  .title {
    display: flex;
    align-items: center;
    .icon {
      margin-right: 4px;
      width: 3px;
      height: 10px;
      background: #7551ff;
      border-radius: 2px;
    }
    .text {
      font-weight: 400;
      font-size: 14px;
      line-height: 22px;
      letter-spacing: -0.02em;
      color: #47548c;
    }
  }
  .chart-wrap {
    margin-right: 20px;
    flex: 4;
    .chart {
      padding-top: 31px;
      height: 110px;
    }
  }
  .rank-wrap {
    flex: 3;
    .rank {
      margin-top: 12px;
      display: flex;
      align-items: center;
      .item {
        width: 132px;
        height: 138px;
        box-sizing: border-box;
        border-radius: 10px;
        & + .item {
          margin-left: 20px;
        }
        &:nth-child(1) {
          background: rgba(83, 79, 254, 0.9);
        }
        &:nth-child(2) {
          background: rgba(83, 79, 254, 0.7);
        }
        &:nth-child(3) {
          background: rgba(83, 79, 254, 0.5);
        }
        .rank-img-wrap {
          display: flex;
          justify-content: center;
          img {
            display: block;
            width: 76px;
          }
        }
        .head-icon {
          display: flex;
          justify-content: center;
          margin-top: 12px;
          img {
            display: block;
            width: 40px;
            height: 40px;
          }
        }
        .address {
          text-align: center;
          margin-top: 4px;
          font-weight: 400;
          font-size: 14px;
          line-height: 22px;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .percent {
          text-align: center;
          font-weight: 700;
          font-size: 20px;
          line-height: 28px;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
      }
    }
  }
}
.drawer-content {
  letter-spacing: -0.02em;
  padding: 10px 14px;
  .drawer-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-weight: 700;
      font-size: 34px;
      color: #2b3674;
    }
    img {
      width: 15px;
      height: 15px;
    }
  }
  .drawer-main {
    .info-wrap {
      margin-top: 26px;
      display: flex;
      .collector {
        flex: 3;
        border-right: 1px dashed #e0e5f2;
        display: flex;
        align-items: center;
        .identity-icon {
          margin-right: 11px;
          width: 56px;
          height: 56px;
        }
        .right {
          .title {
            font-size: 14px;
            color: #8f9bba;
          }
          .value {
            font-weight: 700;
            font-size: 24px;
            color: #1b2559;
          }
        }
      }
      .rank {
        flex: 2;
        border-right: 1px dashed #e0e5f2;
        padding-left: 20px;
        .title {
          font-size: 14px;
          color: #8f9bba;
        }
        .value {
          font-weight: 700;
          font-size: 24px;
          color: #1b2559;
        }
      }
      .state {
        flex: 2;
        display: flex;
        align-items: center;
        padding-left: 20px;
        .tag {
          width: 79px;
          height: 36px;
          background: rgba(5, 205, 153, 0.1);
          border-radius: 7px;
          font-weight: 400;
          font-size: 12px;
          line-height: 20px;
          letter-spacing: -0.02em;
          color: #05cd99;
          display: flex;
          align-items: center;
          justify-content: center;
          &.Risk {
            color: #e31a1a;
            background: rgba(227, 26, 26, 0.1);
            margin-left: 8px;
          }
          &.Safe {
            color: #05cd99;
            background: rgba(5, 205, 153, 0.1);
            margin-left: 8px;
          }
          &.Pending {
            color: #10a7e4;
            background: rgba(16, 167, 228, 0.1);
            margin-left: 8px;
          }
          &.yellow {
            background: rgba(255, 168, 0, 0.1);
            color: #ffa800;
            margin-left: 8px;
          }
        }
      }
    }
    .head {
      margin-top: 60px;
      display: flex;
      align-items: center;
      .icon {
        width: 4px;
        height: 16px;
        background: #7551ff;
        border-radius: 2px;
        margin-right: 4px;
      }
      span {
        font-weight: 700;
        font-size: 24px;
        color: #2b3674;
      }
    }
    .input-unit {
      font-weight: 400;
      font-size: 18px;
      line-height: 30px;
      letter-spacing: -0.02em;
      color: #b0bbd5;
    }
    .input-wrap {
      margin-top: 16px;
      /deep/ .arco-input {
        color: #1b2559;
        font-weight: 700;
        font-size: 34px;
      }
      .input {
        padding-left: 20px;
        padding-right: 20px;
        width: 100%;
        height: 100px;
        background: #f4f7fe;
        border-radius: 10px;
      }
      /deep/ .arco-input-focus {
        background: white;
      }
    }
    .slider-wrap {
      position: relative;
      margin-top: 60px;
      .split-wrap {
        top: -3px;
        left: 0;
        right: 0;
        position: absolute;
        display: flex;
        justify-content: space-between;
        .split {
          width: 3px;
          height: 12px;
          background: #e0e5f2;
          border-radius: 2px;
        }
      }
      .gray-line {
        background: #e9edf7;
        height: 6px;
        position: relative;
        .blue-line {
          transition: all 0.4s;
          height: 100%;
          background: linear-gradient(
            270deg,
            #4318ff 5.56%,
            rgba(67, 24, 255, 0) 100%
          );
        }
        .g-split {
          position: absolute;
          width: 3px;
          height: 12px;
          background: #4318ff;
          border-radius: 2px;
          top: -3px;
        }
        .popover {
          font-weight: 500;
          font-size: 12px;
          line-height: 100%;
          color: white;
          padding: 0 12px;
          min-height: 30px;
          border-radius: 38px;
          position: absolute;
          top: -45px;
          transform: translateX(-50%);
          background: #4318ff;
          display: flex;
          align-items: center;
          .nowrap {
            white-space: nowrap;
          }
          img {
            height: 5px;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: -4px;
          }
        }
      }
      .mark-wrap {
        display: flex;
        align-items: center;
        justify-content: space-between;
        .mark-item {
          margin-top: 16px;
          font-weight: 500;
          font-size: 12px;
          line-height: 20px;
          letter-spacing: -0.02em;
          color: #707eae;
          .rank {
          }
          .stake {
          }
        }
      }
    }
    .range {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 42px;
      color: #2200b7;
      .left {
        text-align: left;
        .top {
          display: flex;
          align-items: center;
          .unit {
            margin-left: 7px;
            margin-top: 21px;
            font-size: 14px;
            font-weight: 500;
          }
        }
        .bottom {
          font-weight: 500;
          font-size: 14px;
          color: #8f9bba;
        }
      }
      .split {
      }
      .right {
        text-align: right;
        .top {
          display: flex;
          align-items: center;
          .unit {
            margin-left: 7px;
            margin-top: 21px;
            font-size: 14px;
            font-weight: 500;
          }
        }
        .bottom {
          text-align: left;
          font-weight: 500;
          font-size: 14px;
          color: #8f9bba;
        }
      }
    }
    .btn-wrap {
      margin-top: 80px;
      text-align: center;
      .btn {
        width: 375px;
        height: 46px;
      }
    }
  }
}
</style>