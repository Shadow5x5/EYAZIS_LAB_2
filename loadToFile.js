const fs = require("fs");


function loadJsonData(filePath="data.json") {
    try {
        const jsonData = fs.readFileSync(filePath, "utf8");
        return JSON.parse(jsonData);
    } catch (error) {
        // console.error("Произошла ошибка при чтении файла:", error);
        return null;
    }
}


module.exports = {loadJsonData};
