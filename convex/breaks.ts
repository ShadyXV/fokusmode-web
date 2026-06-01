import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./authHelpers";

export const create = mutation({
  args: {
    plannedDuration: v.number(),
    actualDuration: v.number(),
    status: v.union(v.literal("completed"), v.literal("interrupted")),
    startedAt: v.number(),
    endedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("breaks", { userId, ...args });
  },
});

export const remove = mutation({
  args: { id: v.id("breaks") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const breakRow = await ctx.db.get(args.id);
    if (!breakRow || breakRow.userId !== userId) {
      throw new Error("Break not found");
    }

    await ctx.db.delete(args.id);
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
      .query("breaks")
      .withIndex("by_userId_and_startedAt", (q) =>
        q
          .eq("userId", userId)
          .gte("startedAt", args.start)
          .lte("startedAt", args.end)
      )
      .collect();
  },
});

export const getStats = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const breaks = await ctx.db
      .query("breaks")
      .withIndex("by_userId_and_startedAt", (q) =>
        q
          .eq("userId", userId)
          .gte("startedAt", args.start)
          .lte("startedAt", args.end)
      )
      .collect();

    const totalDuration = breaks.reduce((acc, b) => acc + b.actualDuration, 0);
    const completedCount = breaks.filter((b) => b.status === "completed").length;
    const interruptedCount = breaks.filter((b) => b.status === "interrupted").length;

    return {
      totalDuration,
      completedCount,
      interruptedCount,
      breakCount: breaks.length,
    };
  },
});
