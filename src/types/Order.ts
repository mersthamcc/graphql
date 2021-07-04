import { inputObjectType, objectType } from "nexus";

export const Order = objectType({
  name: "Order",
  definition(t) {
    t.model.id();
    t.model.ownerUserId();
    t.model.accountingId();
    t.model.uuid();
    t.date("createDate");
    t.model.memberSubscription();
    t.model.payment();
  },
});

export const Payment = objectType({
  name: "Payment",
  definition(t) {
    t.model.id();
    t.date("date");
    t.model.type();
    t.model.reference();
    t.model.amount();
    t.model.processingFees();
    t.model.accountingId();
    t.model.feesAccountingId();
    t.model.collected();
    t.model.reconciled();
    t.model.order();
  },
});

export const PaymentInput = inputObjectType({
  name: "PaymentInput",
  description: "Input for creating or updating payments",
  definition(t) {
    t.field("id", { type: "String" });
    t.field("date", { type: "Date" });
    t.field("type", { type: "String" });
    t.field("reference", { type: "String" });
    t.field("amount", { type: "Float" });
    t.field("processingFees", { type: "Float" });
    t.field("collected", { type: "Boolean" });
    t.field("reconciled", { type: "Boolean" });
  },
});
