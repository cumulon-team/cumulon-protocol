<template>
  <a-spin style="width: 100%" :loading="loading">
    <el-table
      class="home-table"
      :data="formatTableData"
      :span-method="objectSpanMethod"
      @sort-change="tableSortChange"
      style="width: 100%; margin-top: 20px"
    >
      <el-table-column class-name="first-col" label="Chain" width="180">
        <template #default="scope">
          <div class="chain-cell">
            <div class="rect">
              <img :src="scope.row.icon" alt="" />
            </div>
            <span>{{ scope.row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        class-name="collector-col"
        label="Staked Collator"
        min-width="180"
      >
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <IdentityWrap :address="scope.row.collator">
              <template #default="{ identity }">
                <IdentityIcon
                  class="hover-item"
                  @click="goToCollatorDetail(scope.row)"
                  :network="scope.row.chainId"
                  :iconSize="24"
                  :identity="identity"
                  :address="scope.row.collator"
                ></IdentityIcon>
                <a-tooltip :content="scope.row.collator" placement="top">
                  <span
                    @click="goToCollatorDetail(scope.row)"
                    class="hover-primary"
                    style="margin-left: 8px"
                    >{{
                      identity.display
                        ? identity.display
                        : $utils.shorterAddress(scope.row.collator)
                    }}</span
                  >
                </a-tooltip>
              </template>
            </IdentityWrap>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Staked Amount">
        <template #default="scope">
          <div class="unit-cell">
            <span class="num">{{ $utils.roundNumber(scope.row.myStake) }}</span>
            <span class="unit">{{ scope.row.symbols[0] }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="APR">
        <template #default="scope">
          {{ $utils.roundNumber(scope.row.apr) }}%
        </template>
      </el-table-column>
      <el-table-column sortable="custom" prop="myRank" label="My Rank" />
      <el-table-column
        sortable="custom"
        prop="latestReward"
        label="Latest Rewards"
      >
        <template #default="scope">
          <div class="unit-cell">
            <span class="num">{{
              $utils.roundNumber(scope.row.latestReward, 4)
            }}</span>
            <span class="unit">{{ scope.row.symbols[0] }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        sortable="custom"
        prop="totalReward"
        label="Total Rewards"
      >
        <template #default="scope">
          <div class="unit-cell">
            <span class="num">{{
              $utils.roundNumber(scope.row.totalReward)
            }}</span>
            <span class="unit">{{ scope.row.symbols[0] }}</span>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </a-spin>
</template>

<script>
import { ChainUtils } from "@/utils/chain/chain.utils";
import IdentityWrap from "@/components/IdentityWrap";
import IdentityIcon from "@/components/IdentityIcon";
import { homeMyStake } from "@/api/staking";
export default {
  components: {
    IdentityWrap,
    IdentityIcon,
  },
  data() {
    return {
      loading: false,
      tableData: [],
      savedDefaultTableData: [],
    };
  },
  created() {
    this.getTableData();
  },
  watch: {
    "$store.state.global.metamaskWallet"() {
      this.getTableData();
    },
    "$store.state.global.polkadotWallet"() {
      this.getTableData();
    },
  },
  computed: {
    formatTableData() {
      const arr = this.tableData.map((v) => {
        const find = this.$store.state.global.supportChainList.find(
          (sv) => sv.id == v.chainId
        );
        if (find) {
          return {
            ...v,
            ...find,
          };
        }
      });
      return arr;
    },
  },
  methods: {
    tableSortChange({ prop, order }) {
      if (!order) {
        this.tableData = JSON.parse(JSON.stringify(this.savedDefaultTableData));
        return;
      }
      let chainMapData = {};
      this.tableData.forEach((v) => {
        v.rowSpan = undefined;
        if (!chainMapData[v.chainId]) {
          chainMapData[v.chainId] = [v];
        } else {
          chainMapData[v.chainId].push(v);
        }
      });
      Object.keys(chainMapData).forEach((key) => {
        chainMapData[key] = chainMapData[key].sort((a, b) =>
          order == "ascending" ? a[prop] - b[prop] : b[prop] - a[prop]
        );
      });
      let newArr = [];
      Object.keys(chainMapData).forEach((key) => {
        chainMapData[key][0].rowSpan = chainMapData[key].length;
        newArr = [...newArr, ...chainMapData[key]];
      });
      console.log("111", newArr);
      this.tableData = newArr;
    },
    getTableData() {
      this.tableData = [];
      let requestCount = 0;
      let alreadyRequestCount = 0;
      const addRequestCount = () => {
        alreadyRequestCount++;
        if (alreadyRequestCount == requestCount) {
          this.savedDefaultTableData = JSON.parse(
            JSON.stringify(this.tableData)
          );
          this.loading = false;
        }
      };
      this.loading = true;
      for (const v of this.$store.state.global.supportChainList) {
        if (
          this.$utils.ifSupportPolkadot(v.network) &&
          this.$store.state.global.polkadotWallet.address
        ) {
          requestCount++;
          const transformAddress = ChainUtils.ss58transform_simple(
            this.$store.state.global.polkadotWallet.address,
            v.network
          );
          homeMyStake({
            chainId: v.id,
            accountId: transformAddress,
          }).then((d) => {
            if (d.length) {
              d[0].rowSpan = d.length;
            }
            this.tableData = [...this.tableData, ...d];
            addRequestCount();
          });
        }
        if (
          !this.$utils.ifSupportPolkadot(v.network) &&
          this.$store.state.global.metamaskWallet.address
        ) {
          requestCount++;
          homeMyStake({
            chainId: v.id,
            accountId: this.$store.state.global.metamaskWallet.address,
          }).then((d) => {
            if (d.length) {
              d[0].rowSpan = d.length;
            }
            this.tableData = [...this.tableData, ...d];
            addRequestCount();
          });
        }
      }
    },
    goToCollatorDetail(row) {
      const chain = this.$store.state.global.supportChainList.find(
        (v) => v.id == row.chainId
      );
      this.$store.commit("changeCurrentChain", chain);
      localStorage.setItem("routeParamsAddress", row.collator);
      this.$router.push({
        name: "collatorDetail",
      });
    },
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 0) {
        if (row.rowSpan) {
          return {
            rowspan: row.rowSpan,
            colspan: 1,
          };
        } else {
          return {
            rowspan: 0,
            colspan: 0,
          };
        }
      }
    },
  },
};
</script>

<style lang="less" scoped>
.home-table {
  padding-bottom: 24px;
  :deep(.el-table__inner-wrapper) {
    th,
    tr,
    td {
      background: transparent !important;
    }
    th {
      border-radius: 0 !important;
    }
    .el-table__cell {
      border-color: #e2e8f0 !important;
    }
    .first-col .cell,
    .collector-col .cell {
      padding-left: 24px;
    }
    td.first-col {
      border-right: 1px solid #e2e8f0;
    }
    .chain-cell {
      display: flex;
      align-items: center;
      .rect {
        margin-right: 8px;
        width: 48px;
        height: 48px;
        background: #f4f7fe;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          transform: scale(0.5);
        }
      }
      span {
        font-weight: 500;
        font-size: 16px;
        line-height: 24px;
        display: flex;
        align-items: center;
        letter-spacing: -0.02em;
        color: #2b3674;
      }
    }
    .collector-cell {
      display: flex;
      align-items: center;
      img {
        width: 24px;
        margin-right: 4px;
      }
    }
    .unit-cell {
      .unit {
        font-weight: 400;
        font-size: 12px;
        line-height: 24px;
        letter-spacing: -0.02em;
        color: #707eae;
        margin-left: 4px;
      }
    }
  }
}
</style>