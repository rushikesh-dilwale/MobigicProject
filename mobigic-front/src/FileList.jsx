// FileList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FileList = ({ onFileDelete }) => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    // Fetch files when the component mounts
    fetch('http://localhost:3001/files', {
      method: 'GET',
      credentials: 'include', // Include credentials for cookie-based authentication
    })
      .then(response => response.json())
      .then(data => setFiles(data.files))
      .catch(error => console.error('Error fetching files:', error));
  }, []); // Empty dependency array means this effect runs once when the component mounts

  const handleCheckboxChange = (filename) => {
    // Toggle the selected state of the file
    setSelectedFiles((prevSelectedFiles) => {
      if (prevSelectedFiles.includes(filename)) {
        return prevSelectedFiles.filter((file) => file !== filename);
      } else {
        return [...prevSelectedFiles, filename];
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to delete.');
      return;
    }
  
    // Update the state to remove selected files
    setFiles((prevFiles) => prevFiles.filter((file) => !selectedFiles.includes(file)));
    // Clear the selectedFiles state
    setSelectedFiles([]);
    // Trigger the parent component callback to update its state
    onFileDelete();
    alert('Selected files deleted successfully!');
  };
  

  return (
    <div>
      <h2>Uploaded Files</h2>
      <button onClick={handleDeleteSelected}>Delete Selected</button>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <input
              type="checkbox"
              checked={selectedFiles.includes(file)}
              onChange={() => handleCheckboxChange(file)}
            />
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList;
