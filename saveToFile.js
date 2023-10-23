const fs = require("fs");

function saveVariableAsJson(variable, filePath="data.json") {
    try {
        const jsonContent = JSON.stringify(variable, null, 2);
        fs.writeFileSync(filePath, jsonContent);
        console.log(`Данные сохранены в файл ${filePath}`);
    } catch (error) {
        console.error("Произошла ошибка при сохранении файла:", error);
    }
}


module.exports = {saveVariableAsJson};
