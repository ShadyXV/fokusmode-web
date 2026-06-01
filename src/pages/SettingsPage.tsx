import { useRef, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, FileJson, Upload } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const convex = useConvex();
  const importData = useMutation(api.dataPortability.importData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportPayload = await convex.query(api.dataPortability.exportData, {});
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fokusmode-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Export ready", {
        description: "Your FokusMode data was saved as JSON.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text());
      const result = await importData({ data: parsed });
      toast.success("Import complete", {
        description: [
          `${result.sessions} sessions`,
          `${result.breaks} breaks`,
          `${result.tags} tags`,
          `${result.distractions} distractions`,
          `${result.distractionTags} distraction tags`,
        ].join(", "),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import data");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <div className="max-w-3xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import and export your FokusMode data as JSON.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-dark border-white/5 bg-card/40">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Download className="h-5 w-5" />
            </div>
            <CardTitle>Export</CardTitle>
            <CardDescription>
              Download every session, break, tag, distraction, and setting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="h-10 w-full rounded-xl font-semibold"
              disabled={exporting}
              onClick={handleExport}
            >
              <FileJson className="h-4 w-4" />
              {exporting ? "Preparing..." : "Export JSON"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-dark border-white/5 bg-card/40">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Upload className="h-5 w-5" />
            </div>
            <CardTitle>Import</CardTitle>
            <CardDescription>
              Add records from a FokusMode JSON export to this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
            />
            <Button
              className="h-10 w-full rounded-xl font-semibold"
              disabled={importing}
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Import JSON"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
