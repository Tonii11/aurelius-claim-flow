import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  claimId?: string;
  onUploadComplete?: (filePath: string) => void;
}

const FileUpload = ({ claimId, onUploadComplete }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select a file to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const allowedTypes = ["pdf", "docx", "xlsx", "doc", "xls"];

      if (!allowedTypes.includes(fileExt?.toLowerCase() || "")) {
        throw new Error("Please upload a PDF, Word, or Excel file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("claim-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadedFile(file.name);
      toast.success("File uploaded successfully!");
      
      if (onUploadComplete) {
        onUploadComplete(fileName);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="space-y-2">
      {!uploadedFile ? (
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx,.xlsx,.doc,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Supporting Document"}
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Accepted formats: PDF, Word, Excel (max 5MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm">{uploadedFile}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
