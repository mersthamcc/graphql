import {objectType} from "nexus";

export const Order = objectType({
    name: "Order",
    definition(t) {
        t.model.id();
        t.model.ownerUserId();
        t.model.accountingId();
        t.model.uuid();
        t.date("createDate");
        t.model.memberSubscription();
    }
});