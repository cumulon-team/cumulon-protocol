<template>
  <div class="tab-content">
    <div class="charts">
      <div class="line-chart">
        <div class="title">
          <span class="text"> Trend of My Rewards </span>
        </div>
        <a-spin style="width: 100%; height: 310px" :loading="loading">
          <v-chart
            v-if="chart1Arr.length"
            class="chart"
            :option="lineChartOption"
          />
        </a-spin>
      </div>

      <div class="bar-chart">
        <div class="title">
          <span class="text"> Rewards from My Delegated Collators </span>
        </div>
        <a-spin style="width: 100%; height: 310px" :loading="loading">
          <v-chart
            v-if="chart2Arr.length"
            class="chart"
            :option="barChartOption"
          />
        </a-spin>
      </div>
    </div>
    <div class="table-title">
      <div class="tab-wrap">
        <div
          class="tab-item"
          :class="{ active: currentTab == 1 }"
          @click="changeTab(1)"
        >
          Staking History
        </div>
        <div
          class="tab-item"
          :class="{ active: currentTab == 2 }"
          @click="changeTab(2)"
        >
          Reward History
        </div>
      </div>
      <div class="select-wrap">
        <a-select
          v-model="selectCollator"
          allow-clear
          placeholder="Select Collator"
        >
          <a-option v-for="(v, i) in collatorList" :key="i" :value="v.value">{{
            v.label
          }}</a-option>
        </a-select>
        <a-select v-model="selectRound" allow-clear placeholder="Select Round">
          <a-option v-for="(v, i) in roundList" :key="i" :value="v">{{
            v
          }}</a-option>
        </a-select>
      </div>
    </div>
    <StakingTable
      :selectCollator="selectCollator"
      :selectRound="selectRound"
      v-if="currentTab == 1"
    />
    <RewardTable
      :selectCollator="selectCollator"
      :selectRound="selectRound"
      v-if="currentTab == 2"
    />
  </div>
</template>

<script>
import {
  timeMachineRewardsStat,
  timeMachineActionSelect,
  timeMachineRewardSelect,
} from "@/api/staking";
import StakingTable from "./StakingTable";
import RewardTable from "./RewardTable";
export default {
  components: {
    StakingTable,
    RewardTable,
  },
  data() {
    return {
      loading: false,
      selectCollator: "",
      selectRound: "",
      collatorList: [],
      roundList: [],
      chart1Arr: [],
      chart2Arr: [],
      currentTab: 1,
    };
  },
  created() {
    this.initPage();
  },
  watch: {
    "$store.state.global.currentChain"() {
      this.initPage();
    },
    "$store.state.global.metamaskWallet"() {
      this.initPage();
    },
    "$store.state.global.polkadotWallet"() {
      this.initPage();
    },
  },
  computed: {
    lineChartOption() {
      return {
        textStyle: {
          fontFamily: "DM Sans",
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: this.chart1Arr.map((v) => "Round" + v.roundIndex),
          axisLine: {
            lineStyle: {
              color: "#E0E5F2",
            },
          },
          axisLabel: {
            color: "#A3AED0",
          },
          axisTick: {
            show: false,
          },
        },
        yAxis: {
          type: "value",
          splitLine: {
            lineStyle: {
              type: "dotted",
            },
          },
          axisLine: {
            lineStyle: {
              color: "#E0E5F2",
            },
          },
          axisLabel: {
            color: "#A3AED0",
          },
        },
        grid: {
          left: 5,
          top: 30,
          right: 20,
          bottom: 10,
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            lineStyle: {
              color: "#E0E5F2",
            },
          },
          formatter: (params) => {
            return `
            <div>
              <div style="font-weight: 500;font-size: 12px;line-height: 20px;letter-spacing: -0.02em;color: #A3AED0;">${
                params[0].name
              }</div>
              <div style="font-weight: 500;font-size: 20px;line-height: 28px;color: #1B2559;margin-top:1px;">${this.$utils.roundNumber(
                params[0].value,
                4
              )}</div>
            </div>
            `;
          },
        },
        series: {
          type: "line",
          symbol: "none",
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(49, 0, 243, 0.3)", // 0% 处的颜色
                },
                {
                  offset: 1,
                  color: "rgba(255, 255, 255, 0)", // 100% 处的颜色
                },
              ],
              global: false, // 缺省为 false
            },
          },
          lineStyle: {
            color: "#4318ff",
            width: 3,
          },
          data: this.chart1Arr.map((v) => v.reward),
          smooth: true,
        },
      };
    },
    barChartOption() {
      return {
        textStyle: {
          fontFamily: "DM Sans",
        },
        xAxis: {
          type: "value",
          axisLabel: {
            color: "#A3AED0",
          },
          splitLine: {
            lineStyle: {
              type: "dotted",
            },
          },
        },
        yAxis: {
          type: "category",
          data: this.chart2Arr.map((v) => v.display),
          axisTick: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: "#E0E5F2",
            },
          },
          axisLabel: {
            color: "#A3AED0",
          },
        },
        grid: {
          left: 5,
          top: 30,
          right: 20,
          bottom: 10,
          containLabel: true,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            return `
            <div>
              <div style="font-weight: 500;font-size: 12px;line-height: 20px;letter-spacing: -0.02em;color: #A3AED0;">${
                params[0].name
              }</div>
              <div style="font-weight: 500;font-size: 20px;line-height: 28px;color: #1B2559;margin-top:1px;">${this.$utils.roundNumber(
                params[0].value,
                4
              )}</div>
            </div>
            `;
          },
        },
        series: {
          itemStyle: {
            color: "#9374FF",
            borderRadius: 2,
          },
          data: this.chart2Arr.map((v) => v.reward),
          type: "bar",
        },
      };
    },
  },
  methods: {
    changeTab(tabIndex) {
      this.currentTab = tabIndex;
      this.selectCollator = "";
      this.selectRound = "";
      this.getSelectData();
    },
    getSelectData() {
      this.collatorList = [];
      this.roundList = [];
      let request;
      if (this.currentTab == 1) {
        request = timeMachineActionSelect;
      } else {
        request = timeMachineRewardSelect;
      }
      request({
        chainId: this.$store.state.global.currentChain.id,
        delegator: this.$store.getters.currentChainWalletAddress,
      }).then(async (d) => {
        const _collatorList = d.collators;
        const collatorList = [];
        for (const v of _collatorList) {
          const { identity } = await this.$utils.loadAddressIdentityAsync(v);
          const label = identity.display
            ? identity.display
            : this.$utils.shorterAddress(v);
          collatorList.push({
            value: v,
            label,
          });
        }
        this.collatorList = collatorList;
        this.roundList = d.rounds;
      });
    },
    getChartData() {
      this.loading = true;
      timeMachineRewardsStat({
        chainId: this.$store.state.global.currentChain.id,
        delegator: this.$store.getters.currentChainWalletAddress,
      }).then(async (d) => {
        this.chart1Arr = d.rewardByRoundIndex;
        for (const v of d.rewardByCollator) {
          const { identity } = await this.$utils.loadAddressIdentityAsync(
            v.collator
          );
          v.display = identity.display
            ? identity.display
            : this.$utils.shorterAddress(v.collator);
        }
        this.chart2Arr = d.rewardByCollator;
        this.loading = false;
      });
    },
    initPage() {
      this.getChartData();
      this.getSelectData();
    },
  },
};
</script>

<style lang="less" scoped>
.tab-content {
  padding: 0 24px;
}
.charts {
  margin-top: 10px;
  display: flex;
  :deep(.arco-spin-mask) {
    background: transparent;
  }
  .line-chart {
    box-sizing: border-box;
    min-height: 374px;
    flex: 1;
    margin-right: 20px;
    background: #f4f7fe;
    border-radius: 12px;
    padding: 20px;
    .title {
      font-weight: 700;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: -0.02em;
      color: #47548c;
      display: flex;
      align-items: center;
      .text {
        margin-right: 4px;
      }
      .icon {
        width: 16px;
      }
    }
    .chart {
      height: 310px;
    }
  }
  .bar-chart {
    box-sizing: border-box;
    min-height: 374px;
    margin-left: 10px;
    flex: 1;
    background: #f4f7fe;
    border-radius: 12px;
    padding: 20px;
    .title {
      font-weight: 700;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: -0.02em;
      color: #47548c;
      display: flex;
      align-items: center;
      .text {
        margin-right: 4px;
      }
      .icon {
        width: 16px;
      }
    }
    .chart {
      height: 100%;
    }
  }
}
.table-title {
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .tab-wrap {
    display: flex;
    align-items: center;
    .tab-item {
      cursor: pointer;
      margin-right: 20px;
      font-weight: 400;
      font-size: 20px;
      line-height: 32px;
      letter-spacing: -0.02em;
      color: #a3aed0;
      padding: 7px 12px;
      &:hover {
        color: #4318ff;
      }
      &.active {
        color: #4318ff;
        background: #e9e3ff;
        border-radius: 10px;
      }
    }
  }
  .select-wrap {
    /deep/ .arco-select {
      width: 194px;
      .arco-select-view-input {
        font-weight: 700;
        font-size: 16px;
        letter-spacing: -0.02em;
      }
      & + .arco-select {
        margin-left: 12px;
      }
    }
  }
}
</style>