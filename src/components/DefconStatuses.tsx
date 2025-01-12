import * as React from "react";
import { Defcon, DefconStatus } from "../types/types";

interface DefconProps {
    defcon: Defcon;
}

interface CountryDefconProps {
    stateName: keyof Defcon;
    status: DefconStatus;
}

function DefconStateInfo({ inner, flex }: { inner: string; flex?: boolean }) {
    return <div className={`pl-4 ${flex ? "flex-1" : ""}`}>{inner}</div>;
}

export const DEFCON_STATE_TO_HUMAN_STATE: Record<
    keyof Defcon,
    React.ReactNode
> = {
    China: (
        <React.Fragment>
            <DefconStateInfo inner="🇨🇳" />
            <DefconStateInfo inner="China" flex={true} />
        </React.Fragment>
    ),
    France: (
        <React.Fragment>
            <DefconStateInfo inner="🇫🇷" />
            <DefconStateInfo inner="France" flex={true} />
        </React.Fragment>
    ),
    Russia: (
        <React.Fragment>
            <DefconStateInfo inner="🇷🇺" />
            <DefconStateInfo inner="Russia" flex={true} />
        </React.Fragment>
    ),
    UnitedStates: (
        <React.Fragment>
            <DefconStateInfo inner="🇺🇸" />
            <DefconStateInfo inner="United States" flex={true} />
        </React.Fragment>
    ),
    UnitedKingdom: (
        <React.Fragment>
            <DefconStateInfo inner="🇬🇧" />
            <DefconStateInfo inner="United Kingdom" flex={true} />
        </React.Fragment>
    ),
    Pakistan: (
        <React.Fragment>
            <DefconStateInfo inner="🇵🇰" />
            <DefconStateInfo inner="Pakistan" flex={true} />
        </React.Fragment>
    ),
    India: (
        <React.Fragment>
            <DefconStateInfo inner="🇮🇳" />
            <DefconStateInfo inner="India" flex={true} />
        </React.Fragment>
    ),
    Israel: (
        <React.Fragment>
            <DefconStateInfo inner="🇮🇱" />
            <DefconStateInfo inner="Israel" flex={true} />
        </React.Fragment>
    ),
};

export const BACKGROUNDS: Record<
    DefconStatus,
    {
        activeBackground: string;
        background: string;
        activeBorder: string;
        inactiveBorder: string;
    }
> = {
    hidden: {
        activeBackground: "bg-gray-700",
        background: "bg-gray-700",
        activeBorder: "",
        inactiveBorder: "",
    },
    1: {
        activeBackground:
            "bg-gradient-to-l from-defcon-1-light to-defcon-1-dark",
        background: "bg-defcon-1-light",
        activeBorder: "border-red-500",
        inactiveBorder: "border-red-300",
    },
    2: {
        activeBackground:
            "bg-gradient-to-l from-defcon-2-light to-defcon-2-dark",
        background: "bg-defcon-2-light",
        activeBorder: "border-orange-300",
        inactiveBorder: "border-orange-100",
    },
    3: {
        activeBackground:
            "bg-gradient-to-l from-defcon-3-light to-defcon-3-dark",
        background: "bg-defcon-3-light",
        activeBorder: "border-green-300",
        inactiveBorder: "border-green-100",
    },
};

function DefconState({
    defconNumber,
    active,
}: {
    defconNumber: DefconStatus;
    active: boolean;
}) {
    const backgroundDef = BACKGROUNDS[defconNumber];
    const background: string[] = [
        //        active ? backgroundDef.activeBorder : backgroundDef.inactiveBorder,
    ];

    if (active) {
        background.push("delay-250");

        background.push(backgroundDef.background);
    } else {
        background.push("hidden md:block");
    }

    return (
        <div
            className={`p-2 pr-6 text-center items-center flex flex-col transition duration-500 border-0 rounded-r-full ${background.join(
                " "
            )}`}
        >
            <div className={`text-2xl`}>{defconNumber}</div>
        </div>
    );
}

export function CountryDefcon({ stateName, status }: CountryDefconProps) {
    if (status == "hidden") {
        return null;
    }

    return (
        <div className="flex mx-auto lg:mx-4 w-[320px] max-w-[100%]">
            <div
                className={`flex-1 flex items-center content-center justify-center text-2xl border-0 transition duration-500 rounded-l-full ${BACKGROUNDS[status].activeBackground}`}
            >
                {DEFCON_STATE_TO_HUMAN_STATE[stateName]}
            </div>
            <DefconState defconNumber={status} active={true} />
        </div>
    );
}

function DisplayDefconStatus({ defcon }: DefconProps) {
    const states: Record<DefconStatus, (keyof Defcon)[]> = {
        hidden: [],
        1: [],
        2: [],
        3: [],
    };

    Object.entries(defcon).forEach(([country, defconStatus]) =>
        states[defconStatus].push(country as keyof Defcon)
    );

    return (
        <div className="flex justify-center mx-1 pb-24 lg:pb-0">
            <div className="w-full w-max-[400px]">
                <h3 className="text-2xl mt-2 mb-6 uppercase text-center lg:w-1/2 mx-auto">
                    DEFCON Levels
                </h3>
                {Object.entries(states).map(([state, countries]) => {
                    return (
                        <div
                            key={state}
                            className="pt-8 w-full xl:w-4/4 grid grid-cols-1 lg:grid-cols-1 gap-4"
                        >
                            {countries.map((country) => {
                                return (
                                    <CountryDefcon
                                        key={country}
                                        stateName={country}
                                        status={state as DefconStatus}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function DefconStatuses({ defcon }: DefconProps) {
    return (
        <div className="py-4">
            <div className="block w-full">
                <DisplayDefconStatus defcon={defcon} />
            </div>
        </div>
    );
}
