import { ifSupportPolkadot } from '@/utils';
const defaultMetamaskWallet = localStorage.getItem('metamaskWallet');
const defaultPolkadotWallet = localStorage.getItem('polkadotWallet');
const defaultPolkadotWalletList = localStorage.getItem('polkadotWalletList');
const defaultCurrentChain = sessionStorage.getItem('currentChain');
import { ChainUtils } from "@/utils/chain/chain.utils";

export default {
    state() {
        return {
            metamaskWallet: defaultMetamaskWallet ? JSON.parse(defaultMetamaskWallet) : { meta: {} },
            polkadotWallet: defaultPolkadotWallet ? JSON.parse(defaultPolkadotWallet) : { meta: {} },
            polkadotWalletList: defaultPolkadotWalletList ? JSON.parse(defaultPolkadotWalletList) : [],
            supportChainList: [],
            currentChain: defaultCurrentChain ? JSON.parse(defaultCurrentChain) : {},
        }
    },
    getters: {
        ifLogin(state) {
            if (state.metamaskWallet.address || state.polkadotWallet.address) {
                return true;
            }
            return false;
        },
        ifHasCurrentChainWallet(state, getters) {
            if (
                !getters.ifLogin ||
                (ifSupportPolkadot(
                    state.global.currentChain.network
                ) &&
                    !getters.polkadotWalletTransformAddress) ||
                (!ifSupportPolkadot(
                    state.global.currentChain.network
                ) &&
                    !state.global.metamaskWallet.address)
            ) {
                return true;
            }
            return false;
        },
        polkadotWalletTransformAddress(state) {
            if (state.currentChain.network) {
                const transformAddress = ChainUtils.ss58transform_simple(
                    state.polkadotWallet.address,
                    state.currentChain.network
                );
                return transformAddress;
            }
            return state.polkadotWallet.address;
        },
        currentChainWalletAddress(state, getters) {
            if (ifSupportPolkadot(state.currentChain.network)) {
                return getters.polkadotWalletTransformAddress
            } else {
                return state.metamaskWallet.address
            }
        }
    },
    mutations: {
        changeMetamaskWallet(state, value) {
            localStorage.setItem('metamaskWallet', JSON.stringify(value));
            state.metamaskWallet = value
        },
        changePolkadotWallet(state, value) {
            localStorage.setItem('polkadotWallet', JSON.stringify(value));
            state.polkadotWallet = value
        },
        changePolkadotWalletList(state, value) {
            localStorage.setItem('polkadotWalletList', JSON.stringify(value));
            state.polkadotWalletList = value
        },
        changeSupportChainList(state, value) {
            state.supportChainList = value
        },
        changeCurrentChain(state, value) {
            sessionStorage.setItem('currentChain', JSON.stringify(value));
            state.currentChain = value
        }
    },
    actions: {}
}