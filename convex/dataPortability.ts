import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const tagExportValidator = v.object({
  id: v.string(),
  creationTime: v.number(),
  name: v.string(),
  color: v.string(),
});

const sessionExportValidator = v.object({
  id: v.string(),
  creationTime: v.number(),
  tagId: v.string(),
  plannedDuration: v.number(),
  actualDuration: v.number(),
  status: v.union(v.literal("completed"), v.literal("interrupted")),
  startedAt: v.number(),
  endedAt: v.number(),
});

const breakExportValidator = v.object({
  id: v.string(),
  creationTime: v.number(),
  plannedDuration: v.number(),
  actualDuration: v.number(),
  status: v.union(v.literal("completed"), v.literal("interrupted")),
  startedAt: v.number(),
  endedAt: v.number(),
});

const distractionTagExportValidator = v.object({
  id: v.string(),
  creationTime: v.number(),
  name: v.string(),
});

const distractionExportValidator = v.object({
  id: v.string(),
  creationTime: v.number(),
  distractionTagId: v.string(),
  description: v.string(),
  startedAt: v.number(),
  endedAt: v.number(),
  createdAt: v.number(),
});

const settingExportValidator = v.object({
  id: v.string(),
  creationTime: v.number(),
  defaultTagId: v.string(),
});

const exportDataValidator = v.object({
  exportFormat: v.literal("fokusmode.user-data"),
  version: v.literal(1),
  exportedAt: v.string(),
  data: v.object({
    tags: v.array(tagExportValidator),
    sessions: v.array(sessionExportValidator),
    breaks: v.array(breakExportValidator),
    distractionTags: v.array(distractionTagExportValidator),
    distractions: v.array(distractionExportValidator),
    settings: v.array(settingExportValidator),
  }),
});

export const exportData = query({
  args: {},
  handler: async (ctx) => {
    const tags = await ctx.db.query("tags").collect();
    const sessions = await ctx.db.query("sessions").collect();
    const breaks = await ctx.db.query("breaks").collect();
    const distractionTags = await ctx.db.query("distractionTags").collect();
    const distractions = await ctx.db.query("distractions").collect();
    const settings = await ctx.db.query("settings").collect();

    return {
      exportFormat: "fokusmode.user-data" as const,
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      data: {
        tags: tags.map((tag) => ({
          id: tag._id,
          creationTime: tag._creationTime,
          name: tag.name,
          color: tag.color,
        })),
        sessions: sessions.map((session) => ({
          id: session._id,
          creationTime: session._creationTime,
          tagId: session.tagId,
          plannedDuration: session.plannedDuration,
          actualDuration: session.actualDuration,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        })),
        breaks: breaks.map((breakRow) => ({
          id: breakRow._id,
          creationTime: breakRow._creationTime,
          plannedDuration: breakRow.plannedDuration,
          actualDuration: breakRow.actualDuration,
          status: breakRow.status,
          startedAt: breakRow.startedAt,
          endedAt: breakRow.endedAt,
        })),
        distractionTags: distractionTags.map((tag) => ({
          id: tag._id,
          creationTime: tag._creationTime,
          name: tag.name,
        })),
        distractions: distractions.map((distraction) => ({
          id: distraction._id,
          creationTime: distraction._creationTime,
          distractionTagId: distraction.distractionTagId,
          description: distraction.description,
          startedAt: distraction.startedAt,
          endedAt: distraction.endedAt,
          createdAt: distraction.createdAt,
        })),
        settings: settings.map((setting) => ({
          id: setting._id,
          creationTime: setting._creationTime,
          defaultTagId: setting.defaultTagId,
        })),
      },
    };
  },
});

export const importData = mutation({
  args: {
    data: exportDataValidator,
  },
  handler: async (ctx, args) => {
    const tagIdByExportId: Record<string, Id<"tags">> = {};
    const distractionTagIdByExportId: Record<string, Id<"distractionTags">> =
      {};

    for (const tag of args.data.data.tags) {
      tagIdByExportId[tag.id] = await ctx.db.insert("tags", {
        name: tag.name,
        color: tag.color,
      });
    }

    for (const tag of args.data.data.distractionTags) {
      distractionTagIdByExportId[tag.id] = await ctx.db.insert(
        "distractionTags",
        {
          name: tag.name,
        }
      );
    }

    for (const session of args.data.data.sessions) {
      const tagId = tagIdByExportId[session.tagId];
      if (!tagId) {
        throw new Error("Import file has a session that references a missing tag");
      }

      await ctx.db.insert("sessions", {
        tagId,
        plannedDuration: session.plannedDuration,
        actualDuration: session.actualDuration,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      });
    }

    for (const breakRow of args.data.data.breaks) {
      await ctx.db.insert("breaks", {
        plannedDuration: breakRow.plannedDuration,
        actualDuration: breakRow.actualDuration,
        status: breakRow.status,
        startedAt: breakRow.startedAt,
        endedAt: breakRow.endedAt,
      });
    }

    for (const distraction of args.data.data.distractions) {
      const distractionTagId =
        distractionTagIdByExportId[distraction.distractionTagId];
      if (!distractionTagId) {
        throw new Error(
          "Import file has a distraction that references a missing distraction tag"
        );
      }

      await ctx.db.insert("distractions", {
        distractionTagId,
        description: distraction.description,
        startedAt: distraction.startedAt,
        endedAt: distraction.endedAt,
        createdAt: distraction.createdAt,
      });
    }

    const existingSettings = await ctx.db.query("settings").first();
    const importedDefaultTagId = args.data.data.settings[0]?.defaultTagId;
    const defaultTagId =
      importedDefaultTagId ? tagIdByExportId[importedDefaultTagId] : undefined;

    if (!existingSettings && defaultTagId) {
      await ctx.db.insert("settings", { defaultTagId });
    }

    return {
      tags: args.data.data.tags.length,
      sessions: args.data.data.sessions.length,
      breaks: args.data.data.breaks.length,
      distractionTags: args.data.data.distractionTags.length,
      distractions: args.data.data.distractions.length,
      settings: !existingSettings && defaultTagId ? 1 : 0,
    };
  },
});
