import { Inject } from "@nestjs/common";
import { GO_STAKING_STAT_DB_CONNECT_ALIAS } from "src/common/orm/database.provider.v2/portal";
import { Connection } from "typeorm";
import { DbManager } from "./db-manager";

export class GoStakingPortalDbRegister {
    constructor(
        @Inject(GO_STAKING_STAT_DB_CONNECT_ALIAS)
        private readonly conn: Connection
    ) {
        DbManager.registerStakingPortal(conn);
    }
}