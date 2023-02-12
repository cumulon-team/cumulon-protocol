<template>
  <a-spin style="width: 100%" :loading="loading">
    <div class="table-wrap">
      <el-table :data="tableData">
        <el-table-column prop="date" label="Collator" fixed width="220">
          <template #default="scope">
            <div class="table-collector">
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
                    </div>
                  </div>
                </template>
              </IdentityWrap>
            </div>
          </template>
        </el-table-column>
        <template v-for="(v, i) in selectColumns" :key="i">
          <el-table-column
            sortable
            :prop="v.prop"
            :label="v.name"
            :width="v.width"
            :min-width="v['min-width']"
          >
            <template #default="scope">
              <span class="text" v-if="v.name == 'My Share'"
                >{{ scope.row[v.prop] }}%</span
              >
              <span
                class="text"
                v-else-if="v.name == 'Collator\'s Rank' || v.name == 'My Rank'"
                >{{ scope.row[v.prop] }}</span
              >
              <span v-else class="text">{{
                $utils.roundNumber(scope.row[v.prop])
              }}</span>
            </template>
          </el-table-column>
        </template>

        <el-table-column prop="Action" label="Action" width="200" fixed="right">
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
                              <a-checkbox :value="element.name">{{
                                element.name
                              }}</a-checkbox>
                            </li>
                          </template>
                        </draggable>
                      </a-checkbox-group>
                    </div>
                    <div class="btn-wrap">
                      <a-button type="outline" @click="comfirmSort"
                        >Confirm</a-button
                      >
                    </div>
                  </div>
                </template>
              </a-popover>
            </div>
          </template>
          <template #default="scope">
            <span
              v-if="scope.row.status == 'TO_REVOKE'"
              class="common-table-option"
              @click="handleDelegate(scope.row)"
              >Delegate</span
            >
            <span
              v-if="scope.row.status == 'TO_REVOKE'"
              @click="handleUnstake(scope.row)"
              class="common-table-option"
              >Unstake</span
            >

            <span
              v-else-if="scope.row.status == 'TO_EXECUTE'"
              class="common-table-option Exceute"
            >
              <span @click="handleExceute(scope.row)"> Exceute </span>
              <a-dropdown
                style="width: 69px"
                @select="handleCancelUnstake(scope.row)"
              >
                <div class="dropdown-btn">
                  <img
                    src="@/assets/images/home/keyboard_arrow_down.png"
                    alt=""
                  />
                </div>
                <template #content>
                  <a-doption>Cancel</a-doption>
                </template>
              </a-dropdown>
            </span>
            <a-popover
              v-else
              position="left"
              class="my-stake-time-popover"
              trigger="click"
            >
              <div class="common-table-option popover-btn">
                <img
                  src="@/assets/images/home/keyboard_arrow_down.png"
                  alt=""
                />
                <span class="text" v-if="rowTimeFormatMap[scope.row.collator]">
                  <span class="num">{{
                    rowTimeFormatMap[scope.row.collator].days
                  }}</span>
                  <span class="unit">d</span>
                  <span class="num">{{
                    rowTimeFormatMap[scope.row.collator].hours
                  }}</span>
                  <span class="unit">h</span>
                  <span class="num">{{
                    rowTimeFormatMap[scope.row.collator].minutes
                  }}</span>
                  <span class="unit">m</span>
                </span>
              </div>
              <template #content>
                <div class="popover-content">
                  <div class="title">When you can manually unstake</div>
                  <div class="form-item">
                    <span class="label">Round Index: </span>
                    <span class="value">{{
                      scope.row.whenExecutableRoundIndex
                    }}</span>
                  </div>
                  <div class="form-item">
                    <span class="label">Estimated time:</span>
                    <span
                      class="value"
                      v-if="rowTimeFormatMap[scope.row.collator]"
                      >{{
                        rowTimeFormatMap[scope.row.collator].estimatedTime
                      }}</span
                    >
                  </div>
                  <div class="form-item">
                    <span class="label"> Estimated time left:</span>
                    <span
                      class="value"
                      v-if="rowTimeFormatMap[scope.row.collator]"
                      >{{ rowTimeFormatMap[scope.row.collator].timeLeft }}</span
                    >
                  </div>
                  <div class="split">
                    <div class="line"></div>
                    <span>or</span>
                    <div class="line"></div>
                  </div>
                  <div class="btn-wrap">
                    <a-button
                      class="btn"
                      type="outline"
                      @click="handleCancelUnstake(scope.row)"
                      >Cancel request</a-button
                    >
                  </div>
                </div>
              </template>
            </a-popover>
          </template>
        </el-table-column>
      </el-table>
      <DelegateDrawer ref="DelegateDrawerRef" @success="delegateSuccess" />
    </div>
  </a-spin>
</template>

<script>
import aprUtlis from "@/utils/aprUtils";

import IdentityWrap from "@/components/IdentityWrap";
import IdentityIcon from "@/components/IdentityIcon";
import { homeMyStake, getSafeStateConfig } from "@/api/staking";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress, web3Enable } from "@polkadot/extension-dapp";
import { ChainUtils } from "@/utils/chain/chain.utils";
import draggable from "vuedraggable";
import { h } from "vue";
import DelegateDrawer from "@/components/DelegateDrawer";
import { ethers } from "ethers";
import moonbeamContractAbi from "@/utils/moonbeamContractAbi";

export default {
  components: {
    draggable,
    DelegateDrawer,
    IdentityWrap,
    IdentityIcon,
  },
  props: ["roundInfo", "latestBlockNumber", "refreshTopPage"],
  data() {
    const defaultDraggableList = [
      {
        name: "Collator's Rank",
        prop: "rank",
        "min-width": "160",
      },
      { name: "Self Stake", prop: "selfStake", "min-width": "140" },
      { name: "Delegator Stake", prop: "nominatorStake", "min-width": "160" },
      {
        name: "Total Stake",
        prop: "totalStake",
        "min-width": "140",
      },
      {
        name: "My Stake",
        prop: "myStake",
        "min-width": "140",
      },
      {
        name: "My Rank",
        prop: "myRank",
        "min-width": "140",
      },
      {
        name: "My Share",
        prop: "myShare",
        "min-width": "140",
      },
    ];
    const myStakeCheckboxList = localStorage.getItem("myStakeCheckboxList");
    const myStakeSavedDragColumns = localStorage.getItem(
      "myStakeSavedDragColumns"
    );
    const myStakeSelectColumns = localStorage.getItem("myStakeSelectColumns");
    return {
      timerMap: {},
      rowTimeFormatMap: {},
      targetSecondsPerBlock: 12, //seconds
      loading: false,
      safeStateConfig: {},
      leaveDelegatorsDelay: 0,
      popoverShow: false,
      currentRow: {},
      tableData: [],
      draggableList: JSON.parse(JSON.stringify(defaultDraggableList)),
      checkboxList: myStakeCheckboxList
        ? JSON.parse(myStakeCheckboxList)
        : defaultDraggableList.map((v) => v.name),
      savedDragColumns: myStakeSavedDragColumns
        ? JSON.parse(myStakeSavedDragColumns)
        : JSON.parse(JSON.stringify(defaultDraggableList)),
      selectColumns: myStakeSelectColumns
        ? JSON.parse(myStakeSelectColumns)
        : JSON.parse(JSON.stringify(defaultDraggableList)),
      apiPromise: null,
      moonBeamContract: null,
    };
  },
  async created() {
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
  beforeUnmount() {
    Object.keys(this.timerMap).forEach((v) => {
      clearInterval(this.timerMap[v]);
    });
  },
  methods: {
    delegateSuccess() {
      this.getTableData();
      this.refreshTopPage();
    },
    async getMoonBeamContract() {
      if (this.moonBeamContract) {
        return;
      }
      if (this.$store.state.global.currentChain.network == "moonbeam") {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x504",
              chainName: "Moonbeam",
              rpcUrls: ["https://rpc.api.moonbeam.network"],
              nativeCurrency: {
                name: "GLMR",
                symbol: "GLMR",
                decimals: 18,
              },
              blockExplorerUrls: ["https://moonbeam.moonscan.io"],
            },
          ],
        });
      } else if (this.$store.state.global.currentChain.network == "moonriver") {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x505",
              chainName: "Moonriver",
              rpcUrls: ["https://rpc.api.moonriver.moonbeam.network"],
              nativeCurrency: {
                name: "MOVR",
                symbol: "MOVR",
                decimals: 18,
              },
              blockExplorerUrls: ["https://moonriver.moonscan.io"],
            },
          ],
        });
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      console.log("Account:", await signer.getAddress());
      const contract = new ethers.Contract(
        "0x0000000000000000000000000000000000000800",
        moonbeamContractAbi,
        signer
      );
      this.moonBeamContract = contract;
    },
    async initPage() {
      this.loading = true;
      aprUtlis
        .getBlockTargetSeconds(this.$store.state.global.currentChain.id)
        .then((d) => {
          this.targetSecondsPerBlock = d;
        });
      const wsProvider = new WsProvider(
        this.$store.state.global.currentChain.wssEndpoints
      );
      const api = await ApiPromise.create({
        provider: wsProvider,
      });
      this.apiPromise = api;
      await this.getSafeStateConfig();
      this.getTableData();
      this.leaveDelegatorsDelay =
        this.apiPromise.consts.parachainStaking.leaveDelegatorsDelay;
    },
    updateRowStatus(row, status) {
      console.log("111", row, status);
      const findIndex = this.tableData.findIndex(
        (v) => v.collator == row.collator
      );
      if (findIndex !== -1) {
        this.tableData[findIndex].status = status;
      }
    },
    getTableData() {
      if (!this.$store.getters.currentChainWalletAddress) {
        return;
      }
      this.loading = true;
      homeMyStake({
        chainId: this.$store.state.global.currentChain.id,
        accountId: this.$store.getters.currentChainWalletAddress,
      }).then(async (d) => {
        for (const v of d) {
          await this.figureRevokeStatus(v);
        }
        this.tableData = d;
        this.loading = false;
      });
    },
    async figureRevokeStatus(row) {
      let res = [];
      try {
        res = (
          await this.apiPromise.query.parachainStaking.delegationScheduledRequests(
            row.collator
          )
        ).toHuman();
      } catch (e) {
        console.warn("encountered errors while fetching the revoking status");
      }
      const matched = res.filter(
        (it) =>
          it.whenExecutable &&
          it.delegator === this.$store.getters.currentChainWalletAddress
      );
      if (!matched.length) {
        row.status = "TO_REVOKE";
        return;
      }
      const whenExecutableRoundIndex = Number(
        matched[0].whenExecutable.replace(/,/g, "")
      );
      row.whenExecutableRoundIndex = whenExecutableRoundIndex;
      const blocksPerRound = this.roundInfo.length;
      const currentRoundIndex = this.roundInfo.current;
      const blocksFinishedInCurrentRound =
        this.latestBlockNumber - this.roundInfo.first;

      const estBlocksV1 =
        (whenExecutableRoundIndex - currentRoundIndex) * blocksPerRound;
      const estBlocksV2 = estBlocksV1 - blocksFinishedInCurrentRound;
      const estSeconds = estBlocksV2 * this.targetSecondsPerBlock;
      if (estSeconds > 0) {
        // if (new Date().getSeconds() % 5 <= 2) {
        this.doCountdown(row.collator, estSeconds);
        row.status = "TO_WAIT";
      } else {
        this.cleanCountdown(row.collator);
        row.status = "TO_EXECUTE";
      }
    },
    doCountdown(collator, s, startTimestamp) {
      startTimestamp = startTimestamp || new Date().getTime();
      const remainingSeconds =
        s - parseInt((new Date().getTime() - startTimestamp) / 1000);
      const days = Math.floor(remainingSeconds / 86400);
      const hours = Math.floor((remainingSeconds % 86400) / 3600);
      const minutes = Math.ceil((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds - minutes * 60;

      if (hours < 1 && minutes < 1 && seconds < 2) {
        this.cleanCountdown(collator);
        const findIndex = this.tableData.findIndex(
          (v) => v.collator == collator
        );
        const currentRow = this.tableData[findIndex];
        this.figureRevokeStatus(currentRow);
      } else {
        this.rowTimeFormatMap[collator] = {
          estimatedTime: this.$moment()
            .add(s, "seconds")
            .format("YYYY-MM-DD HH:mm"),
          timeLeft: `${days}days ${hours}hours ${minutes}minutes`,
          days,
          hours,
          minutes,
        };
        if (!this.timerMap[collator]) {
          this.timerMap[collator] = setInterval(() => {
            this.doCountdown(collator, s, startTimestamp);
          }, 10000);
        }
      }
    },
    cleanCountdown(collator) {
      if (this.timerMap[collator]) {
        clearInterval(this.timerMap[collator]);
        this.timerMap[collator] = undefined;
      }
    },
    getSafeStateConfig() {
      getSafeStateConfig({
        chainId: this.$store.state.global.currentChain.id,
      }).then((d) => {
        this.safeStateConfig = d;
      });
    },
    getSafeStatus(v) {
      if (
        v.rank <
        this.safeStateConfig.max *
          this.safeStateConfig.collatorSafeStateThreshold
      ) {
        return "Safe";
      } else if (v.rank > this.safeStateConfig.max) {
        return "Pending";
      } else {
        return "Risk";
      }
    },
    goToCollatorDetail(address) {
      localStorage.setItem("routeParamsAddress", address);
      this.$router.push({
        name: "collatorDetail",
      });
    },
    handleUnstake(row) {
      this.currentRow = row;
      const { close } = this.$modal.confirm({
        title: "Unstake",
        okText: "Ok",
        closable: true,
        cancelText: "Cancel",
        modalClass: "common-confirm-modal",
        content: () =>
          h("div", [
            h("div", { class: "confirm-modal-close-icon", onClick: close }),
            h(
              "div",
              "Are you sure you want to revoke your delegation to this collator?"
            ),
            h(
              "div",
              { class: "sub-content" },
              `This action will be scheduled for the next ${this.leaveDelegatorsDelay} rounds and then it will have to be manually executed.`
            ),
          ]),
        onOk: () => {
          this.doRevoke();
        },
      });
    },
    async getSign() {
      await web3Enable(`Go Staking`);
      const injector = await web3FromAddress(
        this.$store.getters.currentChainWalletAddress
      );
      return { signer: injector.signer };
    },
    getTxStatus(events) {
      let flag = { success: false, fail: false };
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
        if (method === "ExtrinsicFailed") {
          flag.fail = true;
        } else if (method === "ExtrinsicSuccess") {
          flag.success = true;
        }
      });
      return flag;
    },
    async doMetamaskRevoke(successFn, failFn) {
      await this.getMoonBeamContract();
      let tx;
      try {
        tx = await this.moonBeamContract.schedule_revoke_delegation(
          this.currentRow.collator
        );
      } catch (error) {
        this.loading = false;
      }
      tx.wait().then((receipt) => {
        if (receipt && receipt.status == 1) {
          successFn();
        } else {
          failFn();
        }
      });
    },
    async doMetamaskExecuteRevoke(successFn, failFn) {
      await this.getMoonBeamContract();
      let tx;
      try {
        tx = await this.moonBeamContract.execute_delegation_request(
          this.$store.getters.currentChainWalletAddress,
          this.currentRow.collator
        );
      } catch (error) {
        this.loading = false;
      }
      tx.wait().then((receipt) => {
        if (receipt && receipt.status == 1) {
          successFn();
        } else {
          failFn();
        }
      });
    },
    async doMetamaskCancelRevoke(successFn, failFn) {
      await this.getMoonBeamContract();
      let tx;
      try {
        tx = await this.moonBeamContract.cancel_delegation_request(
          this.currentRow.collator
        );
      } catch (error) {
        this.loading = false;
      }
      tx.wait().then((receipt) => {
        if (receipt && receipt.status == 1) {
          successFn();
        } else {
          failFn();
        }
      });
    },
    async doRevoke() {
      this.loading = true;
      const successFn = () => {
        this.$message.success("Unstake success");
        const findIndex = this.tableData.findIndex(
          (v) => v.collator == this.currentRow.collator
        );
        const currentRow = this.tableData[findIndex];
        this.figureRevokeStatus(currentRow);
        this.loading = false;
      };
      const failFn = () => {
        this.loading = false;
        this.$message.error("Something is wrong");
      };
      if (
        !this.$utils.ifSupportPolkadot(
          this.$store.state.global.currentChain.network
        )
      ) {
        this.doMetamaskRevoke(successFn, failFn);
        return;
      }
      const unsub = await this.apiPromise.tx.parachainStaking
        .scheduleRevokeDelegation(this.currentRow.collator)
        .signAndSend(
          this.$store.getters.currentChainWalletAddress,
          await this.getSign(),
          ({ events = [], status, txHash }) => {
            // console.log(`Transaction included at blockHash ${status.asFinalized}`);
            txHash && console.log(`Transaction hash ${txHash.toHex()}`);
            console.info(status, ".................");

            if (status && (status.isInBlock || status.isFinalized)) {
              const txStatus = this.getTxStatus(events);
              if (txStatus.success) {
                successFn();
              } else if (txStatus.fail) {
                failFn();
              }
              unsub();
            }
          }
        )
        .catch((error) => {
          this.loading = false;
          this.$message.error("transaction failed" + error);
          // console.log(":( transaction failed", error);
        });
    },
    async doRequestExecuteRevoke() {
      this.loading = true;
      const successFn = () => {
        this.$message.success("Revoke successfully");
        this.$eventBus.emit("updateSupportWalletFreeBalance");
        this.getTableData();
        this.refreshTopPage();
      };
      const failFn = () => {
        this.loading = false;
        this.$message.error("Something is wrong");
      };
      if (
        !this.$utils.ifSupportPolkadot(
          this.$store.state.global.currentChain.network
        )
      ) {
        this.doMetamaskExecuteRevoke(successFn, failFn);
        return;
      }
      const unsub = await this.apiPromise.tx.parachainStaking
        .executeDelegationRequest(
          this.$store.getters.currentChainWalletAddress,
          this.currentRow.collator
        )
        .signAndSend(
          this.$store.getters.currentChainWalletAddress,
          await this.getSign(),
          ({ events = [], status, txHash }) => {
            // console.log(`Transaction included at blockHash ${status.asFinalized}`);
            txHash && console.log(`Transaction hash ${txHash.toHex()}`);
            console.info(status, ".................");

            if (status && (status.isInBlock || status.isFinalized)) {
              const txStatus = this.getTxStatus(events);
              if (txStatus.success) {
                successFn();
              } else if (txStatus.fail) {
                failFn();
              }
              unsub();
            }
          }
        )
        .catch((error) => {
          this.loading = false;
          this.$message.error("transaction failed" + error);
          // console.log(":( transaction failed", error);
        });
    },
    async doRequestCancelRevoke() {
      this.loading = true;
      const successFn = () => {
        this.$message.success("Cancel unstake success");
        const findIndex = this.tableData.findIndex(
          (v) => v.collator == this.currentRow.collator
        );
        if (findIndex !== -1) {
          this.tableData[findIndex].status = "TO_REVOKE";
        }
        this.loading = false;
      };
      const failFn = () => {
        this.loading = false;
        this.$message.error("Something is wrong");
      };
      if (
        !this.$utils.ifSupportPolkadot(
          this.$store.state.global.currentChain.network
        )
      ) {
        this.doMetamaskCancelRevoke(successFn, failFn);
        return;
      }
      const unsub = await this.apiPromise.tx.parachainStaking
        .cancelDelegationRequest(this.currentRow.collator)
        .signAndSend(
          this.$store.getters.currentChainWalletAddress,
          await this.getSign(),
          ({ events = [], status, txHash }) => {
            txHash && console.log(`Transaction hash ${txHash.toHex()}`);
            console.info(status, ".................");
            if (status && (status.isInBlock || status.isFinalized)) {
              const txStatus = this.getTxStatus(events);
              if (txStatus.success) {
                successFn();
              } else if (txStatus.fail) {
                failFn();
              }
              unsub();
            }
          }
        )
        .catch((error) => {
          this.loading = false;
          this.$message.error("transaction failed" + error);
          // console.log(":( transaction failed", error);
        });
    },
    handleDelegate(row) {
      this.currentRow = row;
      this.$refs.DelegateDrawerRef.init(this.currentRow.collator);
    },
    handleExceute(row) {
      this.currentRow = row;
      this.doRequestExecuteRevoke();
    },
    handleCancelUnstake(row) {
      this.currentRow = row;
      const { close } = this.$modal.confirm({
        title: "Cancel Unstake",
        okText: "Ok",
        closable: true,
        cancelText: "Cancel",
        modalClass: "common-confirm-modal",
        content: () =>
          h("div", [
            h("div", { class: "confirm-modal-close-icon", onClick: close }),
            h("div", "Are you sure you want to cancel your unstake request?"),
          ]),
        onOk: () => {
          this.doRequestCancelRevoke();
        },
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
        "myStakeCheckboxList",
        JSON.stringify(this.checkboxList)
      );
      localStorage.setItem(
        "myStakeSavedDragColumns",
        JSON.stringify(this.savedDragColumns)
      );
      localStorage.setItem(
        "myStakeSelectColumns",
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
  margin-top: 40px;
  .dropdown-btn {
    span {
      vertical-align: middle;
    }
    img {
      vertical-align: middle;
      width: 16px;
      margin-left: 4px;
    }
  }
  .popover-btn {
    img {
      vertical-align: middle;
      width: 16px;
      margin-left: 4px;
    }
    .text {
      vertical-align: middle;
      font-weight: 400;
      font-size: 14px;
      line-height: 24px;
      color: #4318ff;
      .num {
      }
      .unit {
        display: inline-block;
        transform: scale(0.7);
        transform-origin: center 70%;
      }
    }
  }
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
.table-collector {
  display: flex;
  align-items: center;
  .text {
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
.Exceute {
  .dropdown-btn {
    display: inline-block;
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
  }
}
.expand-content {
  padding: 12px 31px;
  background: #f4f7fe;
  border-radius: 10px;
  left: 0;
  right: 0;
  position: sticky;
  width: calc(100vw - 395px);
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
      font-size: 14px;
      color: #a3aed0;
    }
  }
  .chart-wrap {
    flex: 4;
    .chart {
      padding-top: 31px;
      height: 110px;
    }
  }
  .rank-wrap {
    flex: 3;
    .rank {
      margin-left: 20px;
      position: relative;
      .account-wrap {
        display: flex;
        width: 271px;
        margin-bottom: -15px;
        margin-top: 35px;
        .account-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          &:nth-child(1) {
            margin-top: -7px;
          }
          &:nth-child(2) {
            margin-top: -20px;
          }
          .img-wrap {
            img {
              width: 24px;
              height: 24px;
            }
          }
          .account {
            font-size: 12px;
            color: #707eae;
          }
          .percent {
            margin-top: 3px;
            width: 53px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            background: #e9e3ff;
            border-radius: 20px;
            color: #9374ff;
            font-size: 14px;
          }
        }
      }
      .rank-bg {
      }
      .absolute1 {
        position: absolute;
        bottom: 7px;
        left: 130px;
        font-size: 34px;
        font-weight: 700;
        color: #ffffff;
      }
      .absolute2 {
        position: absolute;
        bottom: 5px;
        left: 40px;
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
      }
      .absolute3 {
        position: absolute;
        bottom: 5px;
        left: 10px;
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        bottom: 2px;
        left: 221px;
      }
    }
  }
}
.drawer-content {
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
        img {
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
          width: 74px;
          height: 48px;
          line-height: 48px;
          text-align: center;
          background: rgba(5, 205, 153, 0.1);
          border-radius: 7px;
          font-weight: 700;
          font-size: 24px;
          color: #05cd99;
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
      padding: 0 30px;
      margin-top: 60px;
      /deep/ .arco-slider-with-marks {
        padding: 0;
      }
      .slider {
        width: 100%;
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
<style lang="less">
.my-stake-time-popover {
  .arco-popover-popup-content {
    border-radius: 8px;
    padding: 12px;
    .popover-content {
      .title {
        margin-bottom: 4px;
        font-weight: 400;
        font-size: 14px;
        line-height: 22px;
        letter-spacing: -0.02em;
        color: #47548c;
      }
      .form-item {
        font-weight: 400;
        font-size: 12px;
        line-height: 20px;
        letter-spacing: -0.02em;
        color: #a3aed0;
        .label {
        }
        .value {
          margin-left: 4px;
          color: #707eae;
        }
      }
      .split {
        margin-top: 4px;
        display: flex;
        align-items: center;
        .line {
          flex: 1;
          background: #f4f7fe;
          height: 1px;
        }
        span {
          flex: none;
          font-weight: 400;
          font-size: 12px;
          line-height: 20px;
          letter-spacing: -0.02em;
          color: #a3aed0;
        }
      }
      .btn-wrap {
        margin-top: 8px;
        text-align: center;
        .btn {
          width: 130px;
          height: 24px;
        }
      }
    }
  }
}
</style>