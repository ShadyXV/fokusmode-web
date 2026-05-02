import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    distractionTagId: v.id("distractionTags"),
    description: v.string(),
    startedAt: v.number(),
    endedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("distractions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listByDateRange = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("distractions")
      .withIndex("by_startedAt", (q) =>
        q.gte("startedAt", args.start).lte("startedAt", args.end)
      )
      .collect();
  },
});

export const remove = mutation({
  args: {
    id: v.id("distractions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
