// import { ChainServiceInitialble } from "./chain-service-initiable";
/**
 * ParachainNetwork class definition
 */
export class ParachainNetwork {
    //id: string;
    info: {
      id: string; // lit
      decimals: Array<number>; // [12];
      displayName: string; // 'Litentry Rococo Network';
      network: string; // 'Litentry-rococo';
      prefix: number; // 131;
      standardAccount: string; // '*25519';
      symbols: Array<string>; // ['LIT'],
      website: string; // 'https://litentry.com/',
      // external= false(default) is indicating that it can be exposed to the frontend
      wssEndpoints: Array<{external:Boolean, url: string}|string>;
      //genesisHash: string; // '0x6940b1852737722c0aa768710e20105ab8c6a80b63a0339cb99892ffdce38283'
    };
    defaultValues: {
      minBond: number;
      collatorSafeStateThreshold: number
    };
    // service: ChainServiceInitialble ;
    dbConfig = {
      type: "postgres",
      host: "",
      port: 5432,
      username: "postgres",
      password: "",
      synchronize: false,
      logging: false,
      database: "",
    };
  }