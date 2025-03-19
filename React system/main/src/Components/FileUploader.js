import { useState } from "react";

const FileUploader = ({ label, fileType, submissionLink, onUploadSuccess }) => {
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
        if (onUploadSuccess) {
          onUploadSuccess({}); // Call onUploadSuccess after successful upload
        }
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
    <div className="file-uploader-container">
      <label className="file-uploader-label">{label}</label>
      <input
        type="file"
        accept={fileType}
        onChange={handleFileChange}
        className="file-uploader-input"
      />
      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="file-uploader-button"
      >
        {uploading ? "Uploading..." : "Submit"}
      </button>
    </div>
  );
};

export default FileUploader;