import { ChainConnector } from "src/common/chain/chain-connector";

export class MoonriverChainConnector extends ChainConnector {

  protected BREAK_CHANGE_SPEC_VERSION = 1200;


  protected NEED_CONVERT_ACCOUNT_ADDR = false;


  async getSelectedCollators4CurrentRound(): Promise<any> {
    await this.checkReady();
    const selectedCandidates =
      await this.api.query.parachainStaking.selectedCandidates();
    let json = selectedCandidates.toJSON();
    this.logger.debug(
      "getSelectedCollators4CurrentRound:" + JSON.stringify(json)
    );
    return json;
  }

  async getRealtimeCollatorCandidatePool(): Promise<any> {
    await this.checkReady();
    const candidatePool = await this.api.query.parachainStaking.candidatePool();
    let json = candidatePool.toJSON();
    // this.logger.debug('getRealtimeCollatorCandidatePool:' + JSON.stringify(json));
    return json;
  }

  async getRealtimeCollatorState(collatorAccounts: string[]): Promise<any> {
    await this.checkReady();
    let result = [];

    let specVersion = this.getSpecVersion();
    if (specVersion < this.BREAK_CHANGE_SPEC_VERSION) {
      const multiStates =
        await this.api.query.parachainStaking.candidateState.multi(
          collatorAccounts
        );
      multiStates.forEach((t) => {
        let json = t.toJSON();
        // console.log((json as any).id);
        result.push(json);
      });
    } else {
      //Break Changes:  https://github.com/PureStake/moonbeam/releases/tag/runtime-1200
      this.logger.verbose(
        "getRealtimeCollatorState found runtime specVersion >=" +
          this.BREAK_CHANGE_SPEC_VERSION
      );
      const multiCandidateInfos =
        await this.api.query.parachainStaking.candidateInfo.multi(
          collatorAccounts
        );

      const multiTopDelegations =
        await this.api.query.parachainStaking.topDelegations.multi(
          collatorAccounts
        );
      const multiBottomDelegations =
        await this.api.query.parachainStaking.bottomDelegations.multi(
          collatorAccounts
        );

      for (let index = 0; index < multiCandidateInfos.length; index++) {
        let candidateInfo = multiCandidateInfos[index].toJSON() as any;
        candidateInfo.id = collatorAccounts[index];
        //this.logger.debug('candidateInfo.id:', candidateInfo.id);

        if (multiTopDelegations.length > index) {
          let topDelegations = multiTopDelegations[index].toJSON() as any;
          //this.logger.debug('topDelegations:', topDelegations);
          if (topDelegations.delegations) {
            candidateInfo.topDelegations = topDelegations.delegations;
          }
        }
        if (multiBottomDelegations.length > index) {
          let bottomDelegations = multiBottomDelegations[index].toJSON() as any;
          //this.logger.debug('bottomDelegations:', bottomDelegations);
          if (bottomDelegations.delegations) {
            candidateInfo.bottomDelegations = bottomDelegations.delegations;
          }
        }
        result.push(candidateInfo);
      }
    }

    return result;
  }

  async getMaxNominatorsPerCollator(): Promise<any> {
    await this.checkReady();
    let json = {};
    let sepcVersion = this.getSpecVersion();
    if (sepcVersion < this.BREAK_CHANGE_SPEC_VERSION) {
      const value = await this.api.consts.parachainStaking
        .maxDelegatorsPerCandidate;
      json = value.toJSON();
    } else {
      const value = await this.api.consts.parachainStaking
        .maxTopDelegationsPerCandidate;
      json = value.toJSON();
    }
    this.logger.debug("maxTopDelegationsPerCandidate:" + JSON.stringify(json));
    return json;
  }
}
