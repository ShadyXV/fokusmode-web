import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  tags: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(), // Hex code
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),

  sessions: defineTable({
    userId: v.id("users"),
    tagId: v.id("tags"),
    plannedDuration: v.number(), // in seconds
    actualDuration: v.number(), // in seconds
    status: v.union(v.literal("completed"), v.literal("interrupted")),
    startedAt: v.number(), // Unix timestamp (ms)
    endedAt: v.number(), // Unix timestamp (ms)
  })
    .index("by_userId_and_startedAt", ["userId", "startedAt"])
    .index("by_userId_and_tagId", ["userId", "tagId"])
    .index("by_userId_and_status_and_startedAt", [
      "userId",
      "status",
      "startedAt",
    ]),

  settings: defineTable({
    userId: v.id("users"),
    defaultTagId: v.id("tags"),
  }).index("by_userId", ["userId"]),

  breaks: defineTable({
    userId: v.id("users"),
    plannedDuration: v.number(), // in seconds
    actualDuration: v.number(), // in seconds
    status: v.union(v.literal("completed"), v.literal("interrupted")),
    startedAt: v.number(), // Unix timestamp (ms)
    endedAt: v.number(), // Unix timestamp (ms)
  }).index("by_userId_and_startedAt", ["userId", "startedAt"]),

  distractionTags: defineTable({
    userId: v.id("users"),
    name: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),

  distractions: defineTable({
    userId: v.id("users"),
    distractionTagId: v.id("distractionTags"),
    description: v.string(),
    startedAt: v.number(), // Unix timestamp (ms) — start of distraction window
    endedAt: v.number(), // Unix timestamp (ms) — end of distraction window
    createdAt: v.number(), // Unix timestamp (ms) — when the log was recorded
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_userId_and_startedAt", ["userId", "startedAt"])
    .index("by_userId_and_distractionTagId", [
      "userId",
      "distractionTagId",
    ]),
});
