import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tags").collect();
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) return null;
    return await ctx.db.get(settings.defaultTagId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tags", {
      name: args.name,
      color: args.color,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) throw new Error("Settings not found");

    // Prevent deleting the default tag
    if (args.id === settings.defaultTagId) {
      throw new Error("Cannot delete the default tag");
    }

    // Reassign sessions to default tag
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_tagId", (q) => q.eq("tagId", args.id))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, { tagId: settings.defaultTagId });
    }

    await ctx.db.delete(args.id);
  },
});
