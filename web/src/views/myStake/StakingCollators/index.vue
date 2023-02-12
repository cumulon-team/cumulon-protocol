<template>
  <div class="tab-content">
    <div class="main-info">
      <div class="info-list">
        <div class="item">
          <div class="head">
            <div class="icon"></div>
            <span>Current Round</span>
          </div>
          <div class="num">{{ roundInfo.current }}</div>
        </div>
        <div class="item">
          <div class="head">
            <div class="icon"></div>
            <span>Block Number</span>
          </div>
          <div class="num">{{ $utils.roundNumber(latestBlockNumber, 0) }}</div>
        </div>
        <div class="item">
          <div class="head">
            <div class="icon"></div>
            <span>Round Progress</span>
          </div>
          <div class="num">
            <span class="color">{{ latestBlockNumber - roundInfo.first }}</span
            >/{{ roundInfo.length }}
          </div>
        </div>
      </div>
    </div>
    <Table
      :refreshTopPage="refreshTopPage"
      :roundInfo="roundInfo"
      :latestBlockNumber="latestBlockNumber"
    />
  </div>
</template>

<script>
import { getCurrentRoundInfo, getLatestBlockNumber } from "@/api/staking";
import Table from "./Table";
export default {
  components: {
    Table,
  },
  props: ["refreshTopPage"],
  data() {
    return {
      latestBlockNumber: null,
      roundInfo: {
        current: null,
        first: null,
        length: null,
        totalIssuance: null,
      },
    };
  },
  created() {
    this.initPage();
  },
  watch: {
    "$store.state.global.currentChain"() {
      this.initPage();
    },
  },
  methods: {
    initPage() {
      this.getLatestBlockNumber();
      this.getRoundInfo();
    },
    getLatestBlockNumber() {
      getLatestBlockNumber({
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        this.latestBlockNumber = d;
      });
    },
    getRoundInfo() {
      getCurrentRoundInfo({
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        this.roundInfo = d;
      });
    },
  },
};
</script>

<style lang="less" scoped>
.tab-content {
  padding: 0 24px;
}
.main-info {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  .info-list {
    display: flex;
    .item {
      margin-right: 93px;
      .head {
        display: flex;
        align-items: center;
        .icon {
          width: 3px;
          height: 8px;
          background: #7551ff;
          border-radius: 2px;
          margin-right: 4px;
        }
        span {
          font-size: 12px;
          color: #a3aed0;
        }
      }
      .num {
        margin-top: 5px;
        font-weight: 700;
        font-size: 24px;
        color: #1b2559;
      }
      .color {
        color: #4318ff;
      }
    }
  }
  .search-wrap {
    .input {
      width: 341px;
      height: 46px;
      /deep/ .arco-input {
        font-size: 12px;
        line-height: 12px;
      }
    }
  }
}
.rank-wrap {
  display: flex;
  margin-top: 24px;
  .rank {
    background: #ffffff;
    box-shadow: 0px 50px 309px rgba(210, 208, 225, 0.24),
      0px 20px 129.093px rgba(210, 208, 225, 0.172525),
      0px 10px 69.0192px rgba(210, 208, 225, 0.143066),
      0px 6px 38.6916px rgba(210, 208, 225, 0.12),
      0px 3px 20.5488px rgba(210, 208, 225, 0.0969343),
      0px 1px 8.55082px rgba(210, 208, 225, 0.0674749);
    border-radius: 20px;
    padding: 20px 24px;
    flex: 1;
    margin-right: 20px;
    &.right {
      .first {
        background: linear-gradient(
          91.25deg,
          #0495fe -5.01%,
          #365ff3 103.03%
        ) !important;
      }
    }
    &:last-child {
      margin-right: 0;
    }
    .rank-title {
      font-weight: 700;
      font-size: 18px;
      color: #2b3674;
    }
    .rank-item {
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      &:last-child {
        margin-bottom: 0;
      }
      &.first {
        margin-bottom: 26px;
        margin-top: 16px;
        background: linear-gradient(135deg, #868cff 0%, #4318ff 100%);
        border-radius: 10px;
        padding: 12px 22px;
        .r-left {
          .num {
            font-weight: 700;
            font-size: 18px;
            color: #ffffff;
          }
          .num2 {
            color: #ffffff;
          }
          .num3 {
            color: #ffffff;
          }
          .icon {
            width: 48px;
            height: 48px;
            margin: 0 12px;
          }
          .middle {
            .mt {
              font-weight: 700;
              font-size: 16px;
              color: #ffffff;
            }
            .mb {
              font-size: 12px;
              color: #ffffff;
            }
          }
        }
        .percent {
          font-weight: 700;
          font-size: 34px;
          color: #ffffff;
          background: transparent;
          width: auto;
          height: auto;
          line-height: inherit;
        }
      }
      .r-left {
        display: flex;
        align-items: center;
        .num {
          font-weight: 700;
          font-size: 16px;
          color: #b0bbd5;
        }
        .num2 {
          color: #707eae;
        }
        .num3 {
          color: #cf8080;
        }
        .icon {
          width: 32px;
          height: 32px;
          margin: 0 8px;
        }
        .middle {
          .mt {
            font-weight: 700;
            font-size: 16px;
            color: #707eae;
          }
          .mb {
            font-size: 12px;
            color: #05cd99;
          }
        }
      }
      .percent {
        width: 80px;
        height: 36px;
        line-height: 36px;
        background: #f7f5ff;
        border-radius: 46px;
        font-weight: 700;
        font-size: 16px;
        color: #4318ff;
        text-align: center;
      }
    }
  }
}
</style>