import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import FileList from './FileList';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [code, setCode] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [fileDeletionToggle, setFileDeletionToggle] = useState(false); // Add this line



  const handleRegister = async () => {
    try {
      await axios.post('http://localhost:3001/register', { username, password });
      alert('User registered successfully!');
    } catch (error) {
      console.error('Error registering user:', error.response ? error.response.data : error.message);
      alert('Error registering user. Please check the console for details.');
    }
  };

  const handleLogin = async () => {
    try {
      await axios.post('http://localhost:3001/login', { username, password }, {
        withCredentials: true,
      });
      setLoggedIn(true);
      alert('Login successful!');
    } catch (error) {
      console.error('Error logging in:', error.response.data);
      alert('Invalid credentials. Please check the console for details.');
    }
  };

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error.response ? error.response.data : error.message);
      alert('Error uploading file. Please check the console for details.');
    }
  };

  const handleFileDownload = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/download/${code}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `downloaded_file_${code}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error.response.data);
      alert('Error downloading file. Please check the console for details.');
    }
  };

 
  const handleFileDelete = async () => {
    try {
      // Make an axios post request to your delete-multiple endpoint
      await axios.post('http://localhost:3001/delete-multiple', { files: ['fileToDelete.txt'] });
      // Note: replace 'fileToDelete.txt' with the actual file name you want to delete

      // Toggle the file deletion flag to trigger a refresh in the FileList component
      setFileDeletionToggle((prevToggle) => !prevToggle);

      alert('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error.response ? error.response.data : error.message);
      alert('Error deleting file. Please check the console for details.');
    }
  };

  return (
    <div className="app-container">
      {loggedIn ? (
        <div>
          <h2>File Upload</h2>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={handleFileUpload}>Upload File</button>
        </div>
      ) : (
        <div>
          <h2>Register</h2>
          <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleRegister}>Register</button>

          <h2>Login</h2>
          <button id="loginButton" onClick={handleLogin}>Login</button>
        </div>
      )}

{loggedIn && (
        <div className="file-section">
          <h2>File Operations</h2>
          <input type="text" placeholder="File Code" onChange={(e) => setCode(e.target.value)} />
          <button onClick={handleFileDownload}>Download File</button>
          <button onClick={handleFileDelete}>Delete File</button> {/* Add a delete button */}
        </div>
      )}

      {loggedIn && (
        <FileList onFileDelete={() => {}} />
      )}
    </div>
  );
}

export default App;
