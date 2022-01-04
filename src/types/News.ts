import { inputObjectType, objectType } from "nexus";

export const News = objectType({
  name: "News",
  definition(t) {
    t.model.id();
    t.model.uuid();
    t.model.title();
    t.model.path();
    t.model.createdDate();
    t.model.publishDate();
    t.model.body();
    t.model.socialSummary();
    t.model.author();
    t.model.draft();
    t.model.attributes();
    t.model.comments();
  },
});

export const NewsInput = inputObjectType({
  name: "NewsInput",
  description: "Input for creating or updating News",
  definition(t) {
    t.field("id", { type: "Int" });
    t.field("uuid", { type: "String" });
    t.field("title", { type: "String" });
    t.field("createdDate", { type: "DateTime" });
    t.field("publishDate", { type: "DateTime" });
    t.field("body", { type: "String" });
    t.field("author", { type: "String" });
    t.field("path", { type: "String" });
    t.field("draft", { type: "Boolean" });
    t.field("socialSummary", { type: "String" });
    t.list.field("attributes", { type: "NewsAttributeInput" });
  },
});

export const NewsComment = objectType({
  name: "NewsComment",
  definition(t) {
    t.model.news();
    t.model.author();
    t.model.body();
  },
});

export const NewsAttribute = objectType({
  name: "NewsAttribute",
  definition(t) {
    t.model.news();
    t.model.name();
    t.model.value();
    t.model.newsId();
  },
});

export const NewsAttributeInput = inputObjectType({
  name: "NewsAttributeInput",
  definition(t) {
    t.field("name", { type: "String" });
    t.field("value", { type: "String" });
  },
});
