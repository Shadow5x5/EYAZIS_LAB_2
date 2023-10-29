const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const pdfFolderRu = path.join("./files", "ru");
const pdfFolderEng = path.join("./files", "eng");

const getTextFromPdf = async (filePath) => {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    // console.log(data.text.replace(/-/g, ""));
    // return data.text.replace(/\n/g, "");
    return data.text.replace(/-/g, "");
};

const processFolder = async (folderPath, language) => {
    const files = fs.readdirSync(folderPath);

    const texts = await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(folderPath, file);
            return await getTextFromPdf(filePath);
        })
    );

    return { [language]: texts };
};

const processPdfFolders = async () => {
    try {
        const ruData = await processFolder(pdfFolderRu, "ru");
        const engData = await processFolder(pdfFolderEng, "eng");

        const result = { ...ruData, ...engData };
        // console.log(result);
        return result;
    } catch (error) {
        console.error(error);
    }
};


module.exports = {processPdfFolders};
