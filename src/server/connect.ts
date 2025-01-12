import { Collection, MongoClient, UpdateFilter, UpdateResult } from "mongodb";
import { ControlAction, Defcon, DefconStatus, Turn } from "../types/types";
import {
    backAPhase,
    backATurn,
    nextDate,
    pauseResume,
    tickTurn,
    toApiResponse,
    turnMatches,
} from "./turn";

type DBProps = {
    protocol?: string;
    credentials?: { user: string; password: string };
    dbURL: string;
    dbName: string;
    options?: string;
};

function makeClient({
    protocol,
    credentials,
    dbURL,
    dbName,
    options,
}: DBProps): MongoClient {
    const parts: Array<string> = [];

    parts.push(protocol || "mongodb");
    parts.push("://");

    if (credentials !== undefined) {
        parts.push(credentials.user, ":", credentials.password, "@");
    }

    parts.push(dbURL, "/", dbName);

    if (options !== undefined) {
        parts.push("?", options);
    }

    const uri = parts.join("");

    return new MongoClient(uri);
}

const STATIC_ID = "first-contact-2023";

export default class MongoRepo {
    private readonly mongo: MongoClient;

    constructor(mongo: MongoClient) {
        this.mongo = mongo;
    }

    static MakeInstance(): MongoRepo {
        const dbURL = process.env.MONGO_URL || "localhost";
        const dbName = process.env.MONGO_DB || "wts";
        let credentials: undefined | { user: string; password: string };

        if (
            process.env.MONGO_USERNAME !== undefined &&
            process.env.MONGO_PASSWORD !== undefined
        ) {
            credentials = {
                user: process.env.MONGO_USERNAME,
                password: process.env.MONGO_PASSWORD,
            };
        }

        const dbProps = {
            dbURL,
            dbName,
            credentials,
            options: process.env.MONGO_OPTIONS,
            protocol: process.env.MONGO_PROTOCOL,
        };

        return new MongoRepo(makeClient(dbProps));
    }

    async updateTurn(
        updates: UpdateFilter<Turn> | Partial<Turn>,
        upsert: boolean = false,
        currTurn?: { turnNumber: Turn["turnNumber"]; phase: Turn["phase"] }
    ): Promise<UpdateResult> {
        if (upsert && currTurn !== undefined) {
            throw new Error("Cannot upset with a defined turn");
        }

        return this.mongo
            .connect()
            .then((client) => {
                const filter: Partial<Turn> = { _id: STATIC_ID };
                if (currTurn != undefined) {
                    filter.turnNumber = currTurn.turnNumber;
                    filter.phase = currTurn.phase;
                }
                return client
                    .db()
                    .collection<Turn>("turns")
                    .updateOne(filter, updates, {
                        upsert,
                    });
            })
            .finally(() => this.mongo.close());
    }

    async getCurrentTurn(): Promise<Turn> {
        const collection = this.getCollection();

        return this.mongo
            .connect()
            .then(() => collection.find({ _id: STATIC_ID }).next())
            .then((turn) => {
                if (turn === null) {
                    const defaultTurn: Turn = {
                        _id: STATIC_ID,
                        active: false,
                        phase: 1,
                        turnNumber: 1,
                        phaseEnd: nextDate(1, 1).toString(),
                        breakingNews: [],
                        defcon: {
                            China: 3,
                            France: 3,
                            Russia: 3,
                            UnitedStates: 3,
                            UnitedKingdom: 3,
                            Pakistan: 3,
                            India: 3,
                            Israel: "hidden",
                        },
                        frozenTurn: null,
                    };
                    defaultTurn.frozenTurn = toApiResponse(defaultTurn, true);

                    return this.updateTurn({ $set: defaultTurn }, true).then(
                        () => defaultTurn
                    );
                }

                return turn;
            })
            .catch((err) => {
                console.log(err);
                throw err;
            })
            .finally(() => this.mongo.close());
    }

    private getCollection(): Collection<Turn> {
        const database = this.mongo.db();

        return database.collection<Turn>("turns");
    }

    async setBreakingNews(newBreakingNews: string): Promise<Turn> {
        const turn = await this.getCurrentTurn();

        return this.updateTurn({
            $push: {
                breakingNews: {
                    newsText: newBreakingNews,
                    date: new Date().toISOString(),
                    turn: turn.turnNumber,
                    phase: turn.phase,
                },
            },
        }).then(() => this.getCurrentTurn());
    }

    async nextTurn(current: Turn): Promise<Turn> {
        return this.getCurrentTurn().then((turn) => {
            if (!turnMatches(turn, current)) {
                return turn;
            }

            const newTurn = tickTurn(turn);

            return this.updateTurn({ $set: newTurn }, false, current).then(
                () => newTurn
            );
        });
    }

    async #runControlAction(
        controlAction: (turn: Turn) => Turn
    ): ControlAction {
        return this.getCurrentTurn().then((turn) => {
            const turnAfterAction = controlAction(turn);

            const newTurn = turnAfterAction.active
                ? turnAfterAction
                : pauseResume(pauseResume(turnAfterAction, true), false);

            return this.updateTurn({ $set: newTurn }, false, turn).then(
                (result) => {
                    if (result.matchedCount == 0) {
                        return { _tag: "Left", left: "Failed to get lock" };
                    } else {
                        return { _tag: "Right", right: newTurn };
                    }
                }
            );
        });
    }

    async pauseResume(active: boolean): ControlAction {
        return this.#runControlAction((turn) => pauseResume(turn, active));
    }

    async backTurn(): ControlAction {
        return this.#runControlAction((turn) => backATurn(turn));
    }

    async backPhase(): ControlAction {
        return this.#runControlAction((turn) => backAPhase(turn));
    }

    async forwardPhase(): ControlAction {
        return this.#runControlAction((turn) => tickTurn(turn));
    }

    async forwardTurn(): ControlAction {
        return this.#runControlAction((turn) => {
            const turnNumber = turn.turnNumber;

            let newTurn = tickTurn(turn);

            while (newTurn.turnNumber == turnNumber) {
                newTurn = tickTurn(newTurn);
            }

            return newTurn;
        });
    }

    async updateDefconStatus(
        stateName: keyof Defcon,
        newState: DefconStatus
    ): ControlAction {
        return this.#runControlAction((turn) => {
            turn.defcon[stateName] = newState;

            return turn;
        });
    }
}
