const brain = require("brain.js");


const { saveVariableAsJson } = require("./saveToFile.js");
const { loadJsonData } = require("./loadToFile.js");
const { processPdfFolders } = require("./getTrainingData.js");

let getTrainingData = () => {
    return processPdfFolders();
}

class FrequentWordsModel {
    constructor() {
        this.languageModels = {};
    }

    train(trainingData) {
        for (let language in trainingData) {
            const wordCounts = {};

            trainingData[language].forEach((text) => {
                const words = text.match(/[a-zA-Zа-яА-Я]+/g);
                words.forEach((word) => {
                    if (!wordCounts[word]) {
                        wordCounts[word] = 0;
                    }
                    wordCounts[word]++;
                });
            });

            const sortedWords = Object.keys(wordCounts).sort(
                (a, b) => wordCounts[b] - wordCounts[a]
            );

            this.languageModels[language] = sortedWords.slice(0, 100); // ПОЯ - первые 100 слов с наибольшей частотой
        }
    }

    detect(text) {
        const words = text.split(" ");
        const scores = {};

        for (let language in this.languageModels) {
            const model = this.languageModels[language];
            let score = 0;

            words.forEach((word) => {
                if (model.includes(word)) {
                    score++;
                }
            });

            scores[language] = score / words.length; // нормализация по длине текста
        }

        return scores;
    }

    save(filename) {
        saveVariableAsJson(this.languageModels, filename);
    }

    load(filename) {
        let data = loadJsonData(filename);
        if (data) {
            this.languageModels = data;
            return true;
        }

        return false;
    }
}

class ShortWordsModel {
    constructor(maxWordLength) {
        this.maxWordLength = maxWordLength;
        this.languages = {};
    }

    train(trainingData) {
        for (let language in trainingData) {
            trainingData[language].forEach((text) => {
                const words = text.match(/[a-zA-Zа-яА-Я]+/g);

                if (!this.languages[language]) {
                    this.languages[language] = {
                        totalWords: 0,
                        wordCounts: {},
                    };
                }

                const languageData = this.languages[language];
                for (const word of words) {
                    if (word.length <= this.maxWordLength) {
                        let processedWord = word.toLowerCase();

                        languageData.totalWords++;
                        languageData.wordCounts[processedWord] =
                            (languageData.wordCounts[processedWord] || 0) + 1;
                    }
                }
            });
        }
    }

    detect(text) {
        const words = text.split(/\s+/g);

        let scores = {};
        for (let language in this.languages) {
            scores[language] = 0.0;
        }

        let visitedWords = [];
        for (const language in this.languages) {
            let probability = 0;

            for (const word of words) {
                if (word.length <= this.maxWordLength) {
                    let processedWord = word.toLowerCase();

                    if (! visitedWords.includes(processedWord)) {
                        visitedWords.push(processedWord);

                        const wordCount =
                            this.languages[language].wordCounts[processedWord] || 0;
                        const wordProbability =
                            wordCount / this.languages[language].totalWords;

                        probability += wordProbability;
                    }
                }
            }

            scores[language] = probability;
        }

        return scores;
    }

    save(filename) {
        saveVariableAsJson(this.languages, filename);
    }

    load(filename) {
        let data = loadJsonData(filename);
        if (data) {
            this.languages = data;
            return true;
        }

        return false;
    }
}

class NeuralNetworkModel {
    constructor() {
        this.net = new brain.NeuralNetworkGPU({activation: "sigmoid", hiddenLayers: [], learningRate: 0.007});
        this.dictionary = [];
    }

    countNgrams(document) {
        let words = document.match(/[a-zA-Zа-яА-Я]+/g).join("");
        let trigramms = {};
        for (let i = 0; i <= words.length - 3; i ++) {
            let gramm = words.substring(i, i + 3);
            trigramms[gramm] = (trigramms[gramm] || 0) + 1;
        }

        let result = [];
        for (let trigramm of this.dictionary) {
            result.push(trigramms[trigramm] || 0);
        }

        return result;
    }

    train(trainingData) {
        // First generate dictionary
        for (let language in trainingData) {
            let trigramms = {};

            trainingData[language].forEach(text => {
                let words = text.match(/[a-zA-Zа-яА-Я]+/g).join("");

                for (let i = 0; i <= words.length - 3; i ++) {
                    let gramm = words.substring(i, i + 3);
                    trigramms[gramm] = (trigramms[gramm] || 0) + 1;
                }
            });

            this.dictionary = this.dictionary.concat(Object.keys(trigramms).sort(
                (a, b) => trigramms[b] - trigramms[a]
            ).slice(0, Math.min(1000, Object.keys(trigramms).length * 0.5))); // .slice(0, 100 > Object.keys(trigramms).length ? Object.keys(trigramms).length : 0.1 * Object.keys(trigramms).length));
        }

        // Then count all ngramms in each text
        let toTrain = [];
        for (let language in trainingData) {
            trainingData[language].forEach(text => {
                let trainInput = this.countNgrams(text).slice();

                let trainEntry = {};
                trainEntry.input = trainInput;
                let trainLanguage = {};
                trainLanguage[language] = 1.0;
                trainEntry.output = trainLanguage;
                toTrain.push(
                    trainEntry
                );
            });
        }

        this.net.train(
            toTrain.slice(), // Входные данные
            {
                iterations: 50000, // Количество итераций обучения
                errorThresh: 1e-9, // Порог ошибки
                log: true, // Выводить прогресс обучения
                logPeriod: 100, // Частота вывода прогресса
            }
        );
    }

    detect(document) {
        return this.net.run(this.countNgrams(document));
    }

    save(filename) {
        saveVariableAsJson(this.dictionary, `dictionaryOf${filename}`)
        saveVariableAsJson(this.net.toJSON(), filename);
    }

    load(filename) {
        let data = loadJsonData(filename);
        if (data) {
            this.net = this.net.fromJSON(data);
            data = loadJsonData(`dictionaryOf${filename}`);
            if (data) {
                this.dictionary = data;
                return true;
            }
        }
        
        return false;
    }

    
}

// Определить язык методом ЧАСТОТНЫХ СЛОВ
// documents - текста, для которых происходить определение языка
let detectLanguageFW = async (document) => {
    const modelFilename = "fwmodel.json";
    let model = new FrequentWordsModel();

    if (!model.load(modelFilename)) {
        model.train(await getTrainingData());
        model.save(modelFilename);
    }

    let evaluation = model.detect(document);

    let result = null;
    for (let language in evaluation) {
        if (result == null) {
            result = language;
            continue;
        }

        if (evaluation[language] > evaluation[result]) {
            result = language;
        }
    }

    return {
        language: result,
        probability: evaluation[result],
        text: document,
    };
};

// Определить язык документа методом КОРОТКИХ СЛОВ
let detectLanguageSW = async (document) => {
    const modelFilename = "swmodel.json";
    let model = new ShortWordsModel(2); // Модель считает короткими слова, длина которых не больше 3 символов

    if (!model.load(modelFilename)) {
        model.train(await getTrainingData());
        model.save(modelFilename);
    }

    let evaluation = model.detect(document);

    let result = null;
    for (let language in evaluation) {
        if (result == null) {
            result = language;
            continue;
        }

        if (evaluation[language] > evaluation[result]) {
            result = language;
        }
    }

    return {
        language: result,
        probability: evaluation[result],
        text: document,
    };
};

let detectLanguageNN = async (document) => {
    const modelFilename = "nnmodel.json";
    let model = new NeuralNetworkModel();

    if (!model.load(modelFilename)) {
        model.train(await getTrainingData());
        model.save(modelFilename);
    }

    let evaluation = model.detect(document);

    let result = null;
    for (let language in evaluation) {
        if (result == null) {
            result = language;
            continue;
        }

        if (evaluation[language] > evaluation[result]) {
            result = language;
        }
    }

    return {
        language: result,
        probability: evaluation[result],
        text: document,
    };
};

let detectLanguage = async (document) => {
    let detectionResults = [];

    detectionResults.push(
        await detectLanguageFW(document),
        await detectLanguageSW(document),
        await detectLanguageNN(document),
    )

    let languages = {};
    let resultLanguage = null;

    for (let evaluation of detectionResults) {
        languages[evaluation.language] = languages[evaluation.language] || 0 + evaluation.probability;
        languages[evaluation.language + "count"] = languages[evaluation.language + "count"] || 0 + 1;

        if (resultLanguage == null) {
            resultLanguage = evaluation.language;
        } else if (
            languages[resultLanguage] / languages[resultLanguage + "count"] < 
            languages[evaluation.language] / languages[evaluation.language + "count"]) {
            resultLanguage = evaluation.language;
        }

    }

    return {
        language: resultLanguage,
        probability: languages[resultLanguage] / languages[resultLanguage + "count"],
        text: document
    };
}

module.exports = {detectLanguage};