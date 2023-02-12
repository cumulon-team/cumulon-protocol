<template>
  <div class="page">
    <div class="search-wrap">
      <div class="input-wrap">
        <a-input
          v-model="inputValue"
          @press-enter="handleSearch"
          @clear="handleClear"
          placeholder="Please input wallet address"
          allow-clear
        />
      </div>
      <a-button class="btn" type="primary" @click="handleSearch">
        <icon-search />
      </a-button>
    </div>

    <div v-if="ifDefault" class="default">
      <div class="title">
        <span> Round {{ roundInfo.current }}-Delegator Leaderboard</span>
        <img
          @click="$router.push({ name: 'leaderBoard' })"
          class="hover-item"
          src="@/assets/images/home/keyboard_arrow_right(1).png"
          alt=""
        />
      </div>
      <a-spin style="width: 100%; min-height: 300px" :loading="rank1Loading">
        <div class="collector-list">
          <div class="collector-item" v-for="(v, i) in aprRankList" :key="i">
            <div class="collector-info">
              <IdentityWrap :address="v.collator">
                <template #default="{ identity }">
                  <IdentityIcon
                    class="headicon hover-item"
                    @click="goToCollatorDetail(v.collator)"
                    :identity="identity"
                    :address="v.collator"
                    :iconSize="90"
                  ></IdentityIcon>
                  <div class="ci-right">
                    <div class="top">
                      <a-tooltip :content="v.collator" placement="top">
                        <span
                          @click="goToCollatorDetail(v.collator)"
                          class="hover-primary address"
                        >
                          {{
                            identity.display
                              ? identity.display
                              : $utils.shorterAddress(v.collator)
                          }}
                        </span>
                      </a-tooltip>
                      <img
                        @click="$utils.copy(v.collator)"
                        class="copy hover-item"
                        src="@/assets/images/home/copy2.png"
                        alt=""
                      />
                    </div>
                    <div class="tag">Collator</div>
                  </div>
                </template>
              </IdentityWrap>
            </div>
            <div class="delegator-box">
              <div class="delegator-title">
                <span>Top3 Delegators </span>
                <span class="small">(Staked Amount%)</span>
              </div>
              <div
                class="delegator-item"
                v-for="(sv, si) in v.children"
                :key="si"
              >
                <img class="rank" :src="rankImgList[si]" alt="" />
                <div class="di-left">
                  <IdentityWrap :address="sv.delegator">
                    <template #default="{ identity }">
                      <IdentityIcon
                        class="headicon hover-item"
                        @click="searchItem(sv.delegator)"
                        :identity="identity"
                        :address="sv.delegator"
                        :iconSize="48"
                      ></IdentityIcon>
                      <a-tooltip :content="sv.delegator" placement="top">
                        <span
                          class="address hover-primary"
                          @click="searchItem(sv.delegator)"
                          >{{
                            identity.display
                              ? identity.display
                              : $utils.shorterAddress(sv.delegator)
                          }}</span
                        >
                      </a-tooltip>
                    </template>
                  </IdentityWrap>
                  <img
                    @click="$utils.copy(sv.delegator)"
                    class="copy hover-item"
                    src="@/assets/images/home/copy2.png"
                    alt=""
                  />
                </div>
                <span class="percent">{{ figureStakePercent(sv, v) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>
    <div
      v-else-if="
        !ifDefault && rewardData.latestReward === undefined && !loading
      "
      class="none"
    >
      <div class="center">
        <div class="img-wrap">
          <img src="@/assets/images/home/image109.png" alt="" />
        </div>
        <div class="text">Sorry, no data found by Cumulon.</div>
        <div class="blue hover-item" @click="ifDefault = true">
          Explore more →
        </div>
      </div>
    </div>
    <div v-else class="has-result">
      <div class="info-wrap">
        <div class="first-item">
          <img class="bg" src="@/assets/images/home/Rectangle612.png" alt="" />
          <IdentityWrap :address="inputValue">
            <template #default="{ identity }">
              <IdentityIcon
                :identity="identity"
                :address="inputValue"
                :iconSize="56"
              ></IdentityIcon>
              <div class="fi-right">
                <span class="name">Delegator</span>
                <div class="fir-bottom">
                  <a-tooltip :content="inputValue" placement="top">
                    <span class="address">{{
                      $utils.shorterAddress(inputValue)
                    }}</span>
                  </a-tooltip>
                  <img
                    class="copy hover-item"
                    @click="$utils.copy(inputValue)"
                    src="@/assets/images/home/copyWhite.png"
                    alt=""
                  />
                </div>
              </div>
            </template>
          </IdentityWrap>
        </div>
        <div class="item">
          <img
            class="left-icon"
            src="@/assets/images/home/Icon(4).png"
            alt=""
          />
          <div class="right">
            <div class="head">
              <span> Total Bonded </span>
            </div>
            <div class="value">
              <span> {{ $utils.roundNumber(totalBonded) }} </span>
              <span class="unit">{{
                $store.state.global.currentChain.symbols[0]
              }}</span>
            </div>
          </div>
        </div>
        <div class="item">
          <img
            class="left-icon"
            src="@/assets/images/home/Icon(5).png"
            alt=""
          />
          <div class="right">
            <div class="head">
              <span> Latest Rewards </span>
            </div>
            <div class="value">
              <span> {{ $utils.roundNumber(rewardData.latestReward) }} </span>
              <span class="unit">{{
                $store.state.global.currentChain.symbols[0]
              }}</span>
            </div>
          </div>
        </div>
        <div class="item">
          <img
            class="left-icon"
            src="@/assets/images/home/Icon(6).png"
            alt=""
          />
          <div class="right">
            <div class="head">
              <span> Total Rewards </span>
            </div>
            <div class="value">
              <span> {{ $utils.roundNumber(rewardData.totalReward) }} </span>
              <span class="unit">{{
                $store.state.global.currentChain.symbols[0]
              }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="main">
        <a-tabs class="tabs" v-model:active-key="tabKey">
          <a-tab-pane :key="1" title="Reward"></a-tab-pane>
          <a-tab-pane :key="2" title="Action"></a-tab-pane>
        </a-tabs>
        <RewardTable v-if="tabKey == 1" :inputValue="inputValue" />
        <ActionTable v-if="tabKey == 2" :inputValue="inputValue" />
      </div>
    </div>
  </div>
</template>

<script>
import BigNumber from "bignumber.js";
import IdentityWrap from "@/components/IdentityWrap";
import IdentityIcon from "@/components/IdentityIcon";
import RewardTable from "./RewardTable";
import ActionTable from "./ActionTable";
import {
  getDelegatorRewardStatistic,
  getSafeStateConfig,
  homeMyStake,
  delegatorStatistics,
  getCurrentRoundInfo,
  collatorStatistics,
  delegatorInfo,
} from "@/api/staking";
export default {
  components: {
    RewardTable,
    ActionTable,
    IdentityWrap,
    IdentityIcon,
  },
  data() {
    return {
      aprRankList: [],
      totalBonded: null,
      roundInfo: {
        current: null,
        first: null,
        length: null,
        totalIssuance: null,
      },
      rewardData: {
        totalReward: 0,
      },
      inputValue: "",
      ifDefault: true,
      tabKey: 1,
      rankImgList: [
        require("@/assets/images/home/Group13.png"),
        require("@/assets/images/home/Group1(6).png"),
        require("@/assets/images/home/Group1(5).png"),
      ],
      rank1Loading: false,
    };
  },
  created() {
    this.initPage();
    const address = localStorage.getItem("routeParamsAddress");
    if (address) {
      localStorage.removeItem("routeParamsAddress");
      this.searchItem(address);
    }
  },
  watch: {
    "$store.state.global.currentChain"() {
      this.initPage();
    },
  },
  methods: {
    initPage() {
      this.ifDefault = true;
      this.inputValue = "";
      this.getRoundInfo();
      this.getAprRankList();
    },
    goToCollatorDetail(address) {
      localStorage.setItem("routeParamsAddress", address);
      this.$router.push({
        name: "collatorDetail",
      });
    },
    searchItem(address) {
      this.inputValue = address;
      this.handleSearch();
    },
    figureStakePercent(sv, v) {
      const result = new BigNumber(sv.stake)
        .div(new BigNumber(v.delegatorStake))
        .multipliedBy(100)
        .toFormat(2);
      return result;
    },
    getRoundInfo() {
      getCurrentRoundInfo({
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        this.roundInfo = d;
      });
    },
    getAprRankList() {
      this.rank1Loading = true;
      collatorStatistics({
        pageSize: 3,
        pageIndex: 1,
        orderBys: [{ sort: "totalStake", order: "DESC" }],
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        let collectorList = d.list;
        const promiseArr = [];
        for (const v of d.list) {
          promiseArr.push(
            delegatorStatistics({
              pageSize: 3,
              pageIndex: 1,
              orderBys: [{ sort: "stake", order: "DESC" }],
              chainId: this.$store.state.global.currentChain.id,
              collator: v.collator,
            })
          );
        }
        Promise.all(promiseArr).then((data) => {
          this.rank1Loading = false;
          collectorList.forEach((v, i) => {
            v.children = data[i].list;
          });
          this.aprRankList = collectorList;
        });
      });
    },
    getBonded() {
      this.$localforage
        .getItem(this.paraChainName + "CollectorSortList")
        .then((str) => {
          let bondSum = 0;
          if (str) {
            const collectorList = JSON.parse(str);
            for (const c of collectorList) {
              for (const n of c.allNominators) {
                if (n.owner === this.address) {
                  bondSum += Number(n.amount);
                }
              }
            }
          }
          this.bonded = bondSum;
        });
    },
    handleSearch() {
      this.ifDefault = false;
      this.rewardData = {
        totalReward: 0,
      };
      this.loading = true;
      getDelegatorRewardStatistic({
        chainId: this.$store.state.global.currentChain.id,
        delegatorAccount: this.inputValue,
      }).then((resp) => {
        this.loading = false;
        this.rewardData = resp;
      });
      delegatorInfo({
        chainId: this.$store.state.global.currentChain.id,
        delegator: this.inputValue,
      }).then((d) => {
        this.totalBonded = d.totalBond;
      });
    },
    handleClear() {
      this.ifDefault = true;
    },
  },
};
</script>

<style lang="less" scoped>
.page {
  .big-title {
    padding: 40px 11px;
    font-size: 34px;
    color: #2b3674;
    font-weight: 700;
  }
  .search-wrap {
    display: flex;
    .input-wrap {
      flex: 1;
      :deep(.arco-input-wrapper) {
        border-radius: 20px;
        background: #ffffff;
        padding: 0;
        .arco-input {
          box-sizing: border-box;
          padding: 10px 24px;
          background: #ffffff;
          border-radius: 20px;
          height: 48px;
          font-weight: 400;
          font-size: 18px;
          line-height: 30px;
          letter-spacing: -0.02em;
          color: #707eae;
        }
        .arco-input-clear-btn {
          margin-right: 16px;
        }
      }
    }
    .btn {
      margin-left: 16px;
      flex: none;
      width: 55px;
      height: 48px;
      box-sizing: border-box;
      box-shadow: 0px 26px 10px rgba(67, 24, 255, 0.01),
        0px 15px 9px rgba(67, 24, 255, 0.05),
        0px 7px 7px rgba(67, 24, 255, 0.09), 0px 2px 4px rgba(67, 24, 255, 0.1),
        0px 0px 0px rgba(67, 24, 255, 0.1);
      border-radius: 20px;
      .arco-icon {
        font-size: 20px;
      }
    }
  }
  .none {
    text-align: center;
    background: #ffffff;
    border-radius: 20px;
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 230px);
    img {
      width: 160px;
    }
    .text {
      margin-top: 16px;
    }
    .blue {
      margin-top: 8px;
      color: #4318ff;
      &:hover {
        text-decoration: underline;
      }
    }
  }
  .default {
    margin-top: 20px;
    background: #ffffff;
    border-radius: 20px;
    padding: 20px 24px 32px;
    .title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 700;
      font-size: 20px;
      line-height: 32px;
      letter-spacing: -0.02em;
      color: #1b2559;
      img {
        width: 24px;
      }
    }
    .collector-list {
      margin-top: 20px;
      display: flex;
      .collector-item {
        border: 1px solid #e9edf7;
        border-radius: 8px;
        flex: 1;
        & + .collector-item {
          margin-left: 20px;
        }
        .collector-info {
          background: #f6f8fd;
          border-radius: 8px 8px 0px 0px;
          height: 130px;
          box-sizing: border-box;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          .headicon {
            margin-right: 20px;
            width: 90px;
            height: 90px;
            border-radius: 10px;
          }
          .ci-right {
            .top {
              .address {
                font-weight: 500;
                font-size: 20px;
                line-height: 32px;
                letter-spacing: -0.02em;
                color: #1b2559;
              }
              .copy {
                width: 16px;
                margin-left: 8px;
              }
            }
            .tag {
              margin-top: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #7551ff;
              border-radius: 4px;
              width: 67px;
              height: 24px;
              font-weight: 500;
              font-size: 14px;
              line-height: 24px;
              letter-spacing: -0.02em;
              color: #ffffff;
            }
          }
        }
        .delegator-box {
          padding: 18px 24px 24px;
          .delegator-title {
            margin-bottom: 14px;
            font-weight: 400;
            font-size: 20px;
            line-height: 32px;
            letter-spacing: -0.02em;
            color: #47548c;
            .small {
              font-size: 12px;
            }
          }
          .delegator-item {
            border: 1px solid #e9edf7;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            padding: 26px 18px;
            & + .delegator-item {
              margin-top: 12px;
            }
            .rank {
              position: absolute;
              left: 0;
              top: 0;
              width: 50px;
            }
            .di-left {
              display: flex;
              align-items: center;
              .headicon {
                width: 48px;
                margin-right: 12px;
              }
              .address {
                margin-right: 8px;
                font-weight: 400;
                font-size: 14px;
                line-height: 24px;
                letter-spacing: -0.02em;
                color: #47548c;
              }
              .copy {
                width: 16px;
              }
            }
            .percent {
              font-weight: 700;
              font-size: 24px;
              line-height: 32px;
              text-align: right;
              letter-spacing: -0.02em;
              color: #4318ff;
            }
          }
        }
      }
    }
  }
  .info-wrap {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    .first-item {
      padding: 19px 16px;
      display: flex;
      align-items: center;
      flex: 1;
      position: relative;
      background: linear-gradient(135deg, #868cff 0%, #4318ff 100%), #ffffff;
      border-radius: 20px;
      .bg {
        pointer-events: none;
        height: 99px;
        position: absolute;
        right: 0;
        top: 0;
      }

      .fi-right {
        margin-left: 12px;
        .name {
          font-weight: 500;
          font-size: 14px;
          line-height: 22px;
          color: #ffffff;
        }
        .fir-bottom {
          .address {
            font-weight: 700;
            font-size: 20px;
            line-height: 28px;
            letter-spacing: -0.02em;
            color: #ffffff;
          }
          .copy {
            margin-left: 4px;
            width: 16px;
          }
        }
      }
    }
    .item {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      padding: 21px 16px;
      background: #ffffff;
      border-radius: 20px;
      flex: 1;
      margin-left: 20px;

      .left-icon {
        width: 28px;
        margin-right: 12px;
      }
      .right {
        .head {
          line-height: 22px;
          display: flex;
          align-items: center;
          font-size: 14px;
          font-weight: 500;
          color: #a3aed0;

          .icon {
            margin-left: 4px;
            width: 16px;
            height: 16px;
          }
        }
        .value {
          margin-top: 5px;
          font-weight: 700;
          font-size: 20px;
          line-height: 28px;
          letter-spacing: -0.02em;
          color: #1b2559;
          .unit {
            margin-left: 4px;
            font-weight: 400;
            font-size: 12px;
            line-height: 20px;
            color: #a3aed0;
          }
        }
      }
    }
  }
  .main {
    background: #ffffff;
    border-radius: 20px;
    padding: 20px 0;
    .main-title {
      font-weight: 700;
      color: #1b2559;
      font-size: 24px;
    }
    :deep(.arco-tabs-nav-tab-list) {
      margin-left: 24px;
    }
  }
}
</style>