import { mutation } from "./_generated/server";

export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const existingSettings = await ctx.db.query("settings").first();
    if (existingSettings) return;

    const defaultTagId = await ctx.db.insert("tags", {
      name: "Untagged",
      color: "#94a3b8", // Slate 400
    });

    await ctx.db.insert("settings", {
      defaultTagId,
    });

    return defaultTagId;
  },
});
