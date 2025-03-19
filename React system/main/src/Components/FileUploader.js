import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FileUploader = ({ label, fileType, submissionLink }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file before submitting.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(submissionLink, {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        alert("File uploaded successfully!");
      } else {
        alert("Failed to upload file.");
      }
    } catch (error) {
      alert("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg w-80">
      <Label>{label}</Label>
      <Input type="file" accept={fileType} onChange={handleFileChange} />
      <Button onClick={handleSubmit} disabled={uploading}>
        {uploading ? "Uploading..." : "Submit"}
      </Button>
    </div>
  );
};

export default FileUploader;
