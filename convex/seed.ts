import { mutation } from "./_generated/server";
import { requireUserId } from "./authHelpers";

const PREDEFINED_DISTRACTION_TAGS = [
  "Instagram",
  "Facebook",
  "YouTube",
  "Twitter/X",
  "Reddit",
  "TikTok",
  "Email",
  "Phone Call",
  "Texting",
  "Other",
];

export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    // Seed default focus tag
    const existingSettings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!existingSettings) {
      const defaultTagId = await ctx.db.insert("tags", {
        userId,
        name: "Untagged",
        color: "#94a3b8", // Slate 400
      });

      await ctx.db.insert("settings", {
        userId,
        defaultTagId,
      });
    }

    // Seed predefined distraction tags
    const existingDistractionTags = await ctx.db
      .query("distractionTags")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!existingDistractionTags) {
      for (const name of PREDEFINED_DISTRACTION_TAGS) {
        await ctx.db.insert("distractionTags", { userId, name });
      }
    }

    return null;
  },
});
