export type DiaperInput = {
    type: DiaperType;
    time: Date;
    note?: string;
    id?: string;
    babyId?: string;
};

export type SleepInput = {
    start: Date;
    end: Date;
    note?: string;
    id?: string;
    babyId?: string;
};

export type DiaperType = "wet" | "solid" | "both";

export type NursingType = "right" | "left" | "both";

export type NursingAmount = "a little" | "medium" | "a lot";

export type NursingInput = {
    type: NursingType;
    amount: NursingAmount;
    time: Date;
    note?: string;
    id?: string;
    babyId?: string;
};

export type Baby = {
    name: string;
    id: string;
    active?: boolean;
};
