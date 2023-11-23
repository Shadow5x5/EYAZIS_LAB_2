import axios from "axios";
import { useState } from "react";
import "./style.css";
function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [open, setOpen] = useState(false);
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
                setOpen(true);
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
            <div>
                {open && (
                    <span>
                        Функция частотных слов Язык:{" "}
                        {data.data.resultFW.language} Вероятность:{" "}
                        {data.data.resultFW.probability}
                    </span>
                )}
            </div>
            <div>
                {open && (
                    <span>
                        Функция коротких слов Язык:{" "}
                        {data.data.resultSW.language} Вероятность:{" "}
                        {data.data.resultSW.probability}
                    </span>
                )}
            </div>
            <div>
                {open && (
                    <span>
                        Нейронная функция Язык: {data.data.resultNN.language}{" "}
                        Вероятность: {data.data.resultNN.probability}
                    </span>
                )}
            </div>
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
                <img src="./help_icon.svg" alt="" />
                <p className="help">
                    Система автоматически определяет язык текста. Для получения
                    результата следует выбрать файл PDF из вашей системы в любом
                    каталоге, загрузить его и нажать кнопку "Отправить". После
                    этого ожидайте результатов вычислений. Ниже изображена
                    графика нейронной сети, которая осуществляет определение
                    данного результата.
                    <img src="./svgNet.jpg" alt="" />
                </p>
            </div>
        </div>
    );
}

export default App;
