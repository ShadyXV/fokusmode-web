import { mutation } from "./_generated/server";

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
    // Seed default focus tag
    const existingSettings = await ctx.db.query("settings").first();
    if (!existingSettings) {
      const defaultTagId = await ctx.db.insert("tags", {
        name: "Untagged",
        color: "#94a3b8", // Slate 400
      });

      await ctx.db.insert("settings", {
        defaultTagId,
      });
    }

    // Seed predefined distraction tags
    const existingDistractionTags = await ctx.db
      .query("distractionTags")
      .first();
    if (!existingDistractionTags) {
      for (const name of PREDEFINED_DISTRACTION_TAGS) {
        await ctx.db.insert("distractionTags", { name });
      }
    }

    return null;
  },
});
