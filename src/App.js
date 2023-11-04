import axios from "axios";
import { useState } from "react";

function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };
    const handleUpload = async () => {
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const response = await axios.post(
                    "http://localhost:5000/",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                console.log("File uploaded successfully", response);
            } catch (error) {
                console.error("Error uploading file", error);
            }
        } else {
            console.error("Please select a file before uploading.");
        }
    };
    return (
        <div className="App">
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Отправить</button>
            <p></p>
        </div>
    );
}

export default App;
