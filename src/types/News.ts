import {inputObjectType, objectType} from "nexus";

export const News = objectType({
  name: "News",
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.path();
    t.model.createdDate();
    t.model.publishDate();
    t.model.body();
    t.model.author();
    t.model.attributes();
    t.model.comments();
  },
});

export const NewsInput = inputObjectType({
  name: "NewsInput",
  description: "Input for creating or updating News",
  definition(t) {
    t.field("id", { type: "Int" });
    t.field("title", { type: "String" });
    t.field("createdDate", { type: "DateTime" });
    t.field("publishDate", { type: "DateTime" });
    t.field("body", { type: "String" });
    t.field("author", { type: "String" });
    t.field("path", { type: "String" });
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
  },
});
