import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    tagId: v.id("tags"),
    plannedDuration: v.number(),
    actualDuration: v.number(),
    status: v.union(v.literal("completed"), v.literal("interrupted")),
    startedAt: v.number(),
    endedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", args);
  },
});

export const remove = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateTag = mutation({
  args: {
    id: v.id("sessions"),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { tagId: args.tagId });
  },
});

export const listByDateRange = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) =>
        q.gte("startedAt", args.start).lte("startedAt", args.end)
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
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) =>
        q.gte("startedAt", args.start).lte("startedAt", args.end)
      )
      .collect();

    const totalDuration = sessions.reduce((acc, s) => acc + s.actualDuration, 0);
    const completedCount = sessions.filter((s) => s.status === "completed").length;
    const interruptedCount = sessions.filter((s) => s.status === "interrupted").length;

    return {
      totalDuration,
      completedCount,
      interruptedCount,
      sessionCount: sessions.length,
    };
  },
});

export const getDailyBreakdown = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) =>
        q.gte("startedAt", args.start).lte("startedAt", args.end)
      )
      .collect();

    // Group by date string (YYYY-MM-DD)
    const daily: Record<string, { duration: number; tags: Record<string, number> }> = {};

    for (const session of sessions) {
      const date = new Date(session.startedAt).toISOString().split("T")[0];
      if (!daily[date]) {
        daily[date] = { duration: 0, tags: {} };
      }
      daily[date].duration += session.actualDuration;
      
      const tagId = session.tagId;
      daily[date].tags[tagId] = (daily[date].tags[tagId] || 0) + session.actualDuration;
    }

    return daily;
  },
});
