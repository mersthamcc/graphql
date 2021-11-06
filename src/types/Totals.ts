import {objectType, scalarType} from "nexus";

export const Totals = objectType({
    name: "Totals",
    definition(t) {
        t.int("totalRecords", { description: "Total amount of records of given type" });
        t.int("totalMatching", { description: "Total amount of records matching the criteria" });
    },
});