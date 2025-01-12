import * as t from "io-ts";

export const PhaseDecode = t.union([
    t.literal(1),
    t.literal(2),
    t.literal(3),
    t.literal(4),
    t.literal(5),
    t.literal(6),
    t.literal(7),
    t.literal(8),
    t.literal(9),
    t.literal(10),
]);

export const NewsItemDecode = t.type({
    newsText: t.string,
    date: t.string,
    turn: t.number,
    phase: PhaseDecode,
});

export const DefconStatusDecode = t.union([
    t.literal("hidden"),
    t.literal(3),
    t.literal(2),
    t.literal(1),
]);

export const DefconDecode = t.type({
    China: DefconStatusDecode,
    France: DefconStatusDecode,
    Russia: DefconStatusDecode,
    UnitedStates: DefconStatusDecode,
    UnitedKingdom: DefconStatusDecode,
    Pakistan: DefconStatusDecode,
    India: DefconStatusDecode,
    Israel: DefconStatusDecode,
});

export const ApiResponseDecode = t.type({
    turnNumber: t.number,
    phase: PhaseDecode,
    breakingNews: t.array(NewsItemDecode),
    active: t.boolean,
    phaseEnd: t.number,
    defcon: DefconDecode,
});

export const SetBreakingNewsDecode = t.type({
    breakingNews: t.string,
});

export const ControlAPIDecode = t.type({
    action: t.union([
        t.literal("pause"),
        t.literal("play"),
        t.literal("back-turn"),
        t.literal("back-phase"),
        t.literal("forward-phase"),
        t.literal("forward-turn"),
    ]),
});

export const TurnDecode = t.type({
    _id: t.string,
    turnNumber: t.number,
    phase: PhaseDecode,
    phaseEnd: t.string,
    breakingNews: t.array(NewsItemDecode),
    active: t.boolean,
    defcon: DefconDecode,
    frozenTurn: t.union([t.null, ApiResponseDecode]),
});

export const DefconAPIBodyDecode = t.type({
    stateName: t.keyof(DefconDecode.props),
    newStatus: DefconStatusDecode,
});
``;
