const brain = require("brain.js");
// const natural = require("natural");
// const tokenizer = new natural.WordTokenizer();
const fs = require("fs");
const pdf = require("pdf-parse");

const filePath = "./files/text.pdf";
const filePath2 = "./files/text2.pdf";

const xTrain = [
    { input: "", output: { English: 1 } },
    { input: "", output: { Russian: 1 } },
];


async function processPdf(filePath, language) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    xTrain[language].input = data.text.replace(/\n/g, "");
}

(async () => {
    await processPdf(filePath, 0);
    await processPdf(filePath2, 1);
    
    const net = new brain.NeuralNetwork();
    net.train(
        xTrain, // Входные данные
        {
            iterations: 1000, // Количество итераций обучения
            errorThresh: 0.005, // Порог ошибки
            log: true, // Выводить прогресс обучения
            logPeriod: 100, // Частота вывода прогресса
        }
    );
    const xInput = {
        input: "song",
    };
    const result = net.run(xInput);
    
    console.log(result);
    // 4. Выбор категории
    const maxCategory = Math.max(...Object.values(result));
    console.log(result)
    const resultCategory = Object.keys(result).find(
        (category) => result[category] === maxCategory
    );
    
    console.log(`Документ классифицирован как: ${resultCategory}`);
    
})();

class NeuralNetworkModel {
    constructor() {
        this.net = new brain.NeuralNetwork();
    }

    train(trainingData) {
        for (let language in trainingData) {
            trainingData[language].array.forEach(text => {
                net.train(
                    {input: text, output: { language: 1 }}, // Входные данные
                    {
                        iterations: 10000, // Количество итераций обучения
                        errorThresh: 0.005, // Порог ошибки
                        log: true, // Выводить прогресс обучения
                        logPeriod: 100, // Частота вывода прогресса
                    }
                );
            });
        }
    }

    detect(document) {
        return this.net.run({input: document});
    }

    save(filename, data) {
        return false;
    }

    load(filename) {
        return false;
    }
}


console.log(xTrain)