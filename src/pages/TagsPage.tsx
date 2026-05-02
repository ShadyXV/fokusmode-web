import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import TagCard from "@/components/tags/TagCard";
import TagFormDialog from "@/components/tags/TagFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";

export default function TagsPage() {
  const tags = useQuery(api.tags.list);
  const defaultTag = useQuery(api.tags.getDefault);
  const createTag = useMutation(api.tags.create);
  const updateTag = useMutation(api.tags.update);
  const removeTag = useMutation(api.tags.remove);

  const [editingTag, setEditingTag] = useState<{
    id: Id<"tags">;
    name: string;
    color: string;
  } | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<Id<"tags"> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleCreate = async (name: string, color: string) => {
    try {
      await createTag({ name, color });
      setCreateOpen(false);
      toast.success("Tag created", { description: `"${name}" is ready to use.` });
    } catch {
      toast.error("Failed to create tag");
    }
  };

  const handleUpdate = async (name: string, color: string) => {
    if (!editingTag) return;
    try {
      await updateTag({ id: editingTag.id, name, color });
      setEditOpen(false);
      setEditingTag(null);
      toast.success("Tag updated");
    } catch {
      toast.error("Failed to update tag");
    }
  };

  const handleDelete = async () => {
    if (!deletingTagId) return;
    try {
      await removeTag({ id: deletingTagId });
      setDeletingTagId(null);
      toast.success("Tag deleted", {
        description: "Sessions have been reassigned to the default tag.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tag");
    }
  };

  const deletingTag = tags?.find((t) => t._id === deletingTagId);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground mt-1">
            Organize your focus sessions with custom tags
          </p>
        </div>
        <TagFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
          trigger={
            <Button className="rounded-full shadow-lg shadow-primary/20 h-11 px-5 text-sm font-semibold">
              <Plus className="w-6 h-6 mr-2" />
              New Tag
            </Button>
          }
        />
      </div>

      {/* Tag grid */}
      {tags && tags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <TagCard
              key={tag._id}
              name={tag.name}
              color={tag.color}
              isDefault={defaultTag?._id === tag._id}
              onEdit={() => {
                setEditingTag({ id: tag._id, name: tag.name, color: tag.color });
                setEditOpen(true);
              }}
              onDelete={() => setDeletingTagId(tag._id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Tag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No tags yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Create tags to categorize your focus sessions. Tags help you track time across different projects and activities.
          </p>
        </div>
      )}

      {/* Edit dialog */}
      {editingTag && (
        <TagFormDialog
          mode="edit"
          initialName={editingTag.name}
          initialColor={editingTag.color}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingTag(null);
          }}
          onSubmit={handleUpdate}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deletingTagId} onOpenChange={(open) => !open && setDeletingTagId(null)}>
        <DialogContent className="glass-dark sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete tag?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deletingTag?.name}"</strong>?
              All sessions using this tag will be reassigned to the default tag.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeletingTagId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
