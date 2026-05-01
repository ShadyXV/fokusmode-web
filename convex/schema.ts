import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tags: defineTable({
    name: v.string(),
    color: v.string(), // Hex code
  }).index("by_name", ["name"]),

  sessions: defineTable({
    tagId: v.id("tags"),
    plannedDuration: v.number(), // in seconds
    actualDuration: v.number(), // in seconds
    status: v.union(v.literal("completed"), v.literal("interrupted")),
    startedAt: v.number(), // Unix timestamp (ms)
    endedAt: v.number(), // Unix timestamp (ms)
  })
    .index("by_startedAt", ["startedAt"])
    .index("by_tagId", ["tagId"])
    .index("by_status", ["status", "startedAt"]),

  settings: defineTable({
    defaultTagId: v.id("tags"),
  }),
});
