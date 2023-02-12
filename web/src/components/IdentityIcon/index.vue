<template>
  <div class="identity-icon">
    <img
      v-if="identity && identity.judgement == 'Reasonable'"
      class="identify"
      src="@/assets/images/home/identity.png"
      alt=""
    />
    <div v-if="ifSupportPolkadot">
      <Identicon :size="iconSize" :theme="'polkadot'" :value="address" />
    </div>
    <div v-else>
      <img
        class="eth-icon"
        v-bind:style="{ width: iconSize + 'px' }"
        :src="makeBlockie(address)"
        alt=""
      />
    </div>
  </div>
</template>

<script>
import Identicon from "vue3-polkadot-vue-identicon";
import makeBlockie from "ethereum-blockies-base64";
export default {
  components: { Identicon },
  name: "Identity-Icon",
  props: {
    network: {
      type: String,
    },
    identity: {
      type: Object,
    },
    address: {
      type: String,
    },
    iconSize: {
      type: Number,
      default: 32,
    },
  },
  computed: {
    ifSupportPolkadot() {
      const network =
        this.network || this.$store.state.global.currentChain.network;
      return this.$utils.ifSupportPolkadot(network);
    },
  },
  data() {
    return {
      makeBlockie,
    };
  },
  created() {},
  methods: {},
};
</script>

<style lang="less" scoped>
.identity-icon {
  position: relative;
  display: inline-block;
  svg {
    display: block;
  }
  .identify {
    position: absolute;
    width: 13px;
    right: -4px;
    bottom: 0;
  }
  .eth-icon {
    border-radius: 50%;
  }
}
</style>
