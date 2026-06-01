import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./authHelpers";

export const create = mutation({
  args: {
    distractionTagId: v.id("distractionTags"),
    description: v.string(),
    startedAt: v.number(),
    endedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const tag = await ctx.db.get(args.distractionTagId);
    if (!tag || tag.userId !== userId) {
      throw new Error("Distraction tag not found");
    }

    return await ctx.db.insert("distractions", {
      userId,
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
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("distractions")
      .withIndex("by_userId_and_startedAt", (q) =>
        q
          .eq("userId", userId)
          .gte("startedAt", args.start)
          .lte("startedAt", args.end)
      )
      .collect();
  },
});

export const remove = mutation({
  args: {
    id: v.id("distractions"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const distraction = await ctx.db.get(args.id);
    if (!distraction || distraction.userId !== userId) {
      throw new Error("Distraction not found");
    }

    await ctx.db.delete(args.id);
  },
});
