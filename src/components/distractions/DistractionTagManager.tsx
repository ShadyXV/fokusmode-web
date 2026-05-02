import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

interface DistractionTagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DistractionTagManager({
  open,
  onOpenChange,
}: DistractionTagManagerProps) {
  const tags = useQuery(api.distractionTags.list);
  const createTag = useMutation(api.distractionTags.create);
  const updateTag = useMutation(api.distractionTags.update);
  const removeTag = useMutation(api.distractionTags.remove);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<Id<"distractionTags"> | null>(
    null
  );
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<Id<"distractionTags"> | null>(
    null
  );

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await createTag({ name: trimmed });
      setNewName("");
      toast.success("Tag created");
    } catch {
      toast.error("Failed to create tag");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await updateTag({ id: editingId, name: trimmed });
      setEditingId(null);
      setEditingName("");
      toast.success("Tag renamed");
    } catch {
      toast.error("Failed to rename tag");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await removeTag({ id: deletingId });
      setDeletingId(null);
      toast.success("Tag deleted", {
        description: "Distractions reassigned to 'Other'.",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete tag"
      );
    }
  };

  const deletingTag = tags?.find((t) => t._id === deletingId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-dark sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Distraction Tags</DialogTitle>
            <DialogDescription>
              Create, rename, or remove distraction categories.
            </DialogDescription>
          </DialogHeader>

          {/* Create new */}
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New tag name..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <ScrollArea className="max-h-[320px] -mx-1 px-1">
            <div className="space-y-1">
              {tags?.map((tag) => (
                <div
                  key={tag._id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  {editingId === tag._id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate();
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditingName("");
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={handleUpdate}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{tag.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingId(tag._id);
                          setEditingName(tag.name);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(tag._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <DialogContent className="glass-dark sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete tag?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>"{deletingTag?.name}"</strong>? All distractions using
              this tag will be reassigned to "Other".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
