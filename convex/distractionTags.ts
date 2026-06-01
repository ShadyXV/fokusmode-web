import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./authHelpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("distractionTags")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    // Prevent duplicates
    const existing = await ctx.db
      .query("distractionTags")
      .withIndex("by_userId_and_name", (q) =>
        q.eq("userId", userId).eq("name", args.name)
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("distractionTags", {
      userId,
      name: args.name,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("distractionTags"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const tag = await ctx.db.get(args.id);
    if (!tag || tag.userId !== userId) {
      throw new Error("Distraction tag not found");
    }

    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: {
    id: v.id("distractionTags"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const tag = await ctx.db.get(args.id);
    if (!tag || tag.userId !== userId) {
      throw new Error("Distraction tag not found");
    }

    // Find the "Other" fallback tag
    const otherTag = await ctx.db
      .query("distractionTags")
      .withIndex("by_userId_and_name", (q) =>
        q.eq("userId", userId).eq("name", "Other")
      )
      .first();

    if (otherTag && otherTag._id === args.id) {
      throw new Error("Cannot delete the default 'Other' distraction tag");
    }
    if (!otherTag) {
      throw new Error("Fallback distraction tag not found");
    }

    // Reassign distractions to "Other" tag
    const distractions = await ctx.db
      .query("distractions")
      .withIndex("by_userId_and_distractionTagId", (q) =>
        q.eq("userId", userId).eq("distractionTagId", args.id)
      )
      .collect();

    for (const d of distractions) {
      await ctx.db.patch(d._id, { distractionTagId: otherTag._id });
    }

    await ctx.db.delete(args.id);
  },
});
