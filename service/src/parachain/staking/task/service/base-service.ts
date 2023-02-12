export class BaseService {
  getTsString(date) {
    return !date
      ? null
      : date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(date.getDate()).padStart(2, "0") +
          " " +
          String(date.getHours()).padStart(2, "0") +
          ":" +
          String(date.getMinutes()).padStart(2, "0") +
          ":" +
          String(date.getSeconds()).padStart(2, "0");
  }

  doRank(key: string, rankKey: string, data: Array<any>) {
    // const vs = [];
    // const map = {};
    // data.forEach((it) => {
    //   const v = it[key];
    //   const nv = v instanceof BigNumber ? v : new BigNumber(v);
    //   map[v] = nv;
    //   vs.push(nv);
    // });
    // vs.sort((i: BigNumber, ii: BigNumber) => i.comparedTo(ii));
    // data.forEach((it) => ((it as any)[rankKey] = vs.indexOf(map[it[key]]) + 1));

    const vs = [];
    data.forEach((it) => vs.push(it[key]));
    vs.sort((i, ii) => ii - i);
    data.forEach((it) => ((it as any)[rankKey] = vs.indexOf(it[key]) + 1));
  }
}
