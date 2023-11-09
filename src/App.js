import axios from "axios";
import { useState } from "react";
import "./style.css";
function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [data, setData] = useState({});
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
                setData(response);
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
            <p>
                {data && data.data
                    ? `Language: ${
                          data.data.language === "ru"
                              ? "Russian"
                              : data.data.language === "eng"
                              ? "English"
                              : "Unknown"
                      }, Probability: ${data.data.probability}, Text: ${
                          data.data.text
                      }`
                    : "Значение еще не заполнено"}
            </p>
            <div className="containerHelp">
                <img src="./help_icon.svg" alt=""/>
                <p className="help">
                    Для выбора языка, на который написан данный текст, вам
                    следует просмотреть каталоги в нашей системе, нажать кнопку
                    "Отправить" и дождаться результатов. Система оценит
                    насколько точно вы выбрали язык и переведенный текст.
                </p>
            </div>
        </div>
    );
}

export default App;
