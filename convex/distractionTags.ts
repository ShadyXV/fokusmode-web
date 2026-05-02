import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("distractionTags").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicates
    const existing = await ctx.db
      .query("distractionTags")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("distractionTags", { name: args.name });
  },
});

export const update = mutation({
  args: {
    id: v.id("distractionTags"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: {
    id: v.id("distractionTags"),
  },
  handler: async (ctx, args) => {
    // Find the "Other" fallback tag
    const otherTag = await ctx.db
      .query("distractionTags")
      .withIndex("by_name", (q) => q.eq("name", "Other"))
      .first();

    if (otherTag && otherTag._id === args.id) {
      throw new Error("Cannot delete the default 'Other' distraction tag");
    }

    // Reassign distractions to "Other" tag
    if (otherTag) {
      const distractions = await ctx.db
        .query("distractions")
        .withIndex("by_distractionTagId", (q) =>
          q.eq("distractionTagId", args.id)
        )
        .collect();

      for (const d of distractions) {
        await ctx.db.patch(d._id, { distractionTagId: otherTag._id });
      }
    }

    await ctx.db.delete(args.id);
  },
});
