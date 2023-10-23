const { saveVariableAsJson } = require("./saveToFile.js");
const { loadJsonData } = require("./loadToFile.js");
const { processPdfFolders } = require("./getTrainingData.js");
class FrequentWordsModel {
    constructor() {
        this.languageModels = {};
    }

    train(trainingData) {
        for (let language in trainingData) {
            const wordCounts = {};

            trainingData[language].forEach((text) => {
                const words = text.split(" ");
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
        return false;
    }

    load(filename) {
        return false;
    }
}

class ShortWordsModel {
    constructor(maxWordLength) {
        this.maxWordLength = maxWordLength;
        this.languages = {};
    }

    train(trainingData) {
        console.log(trainingData);

        for (let language in trainingData) {
            trainingData[language].forEach((text) => {
                const words = text.split(" ");

                if (!this.languages[language]) {
                    this.languages[language] = {
                        totalWords: 0,
                        wordCounts: {},
                    };
                }

                const languageData = this.languages[language];
                for (const word of words) {
                    if (word.length <= this.maxWordLength) {
                        languageData.totalWords++;
                        languageData.wordCounts[word] =
                            (languageData.wordCounts[word] || 0) + 1;
                    }
                }
            });
        }
    }

    detect(text) {
        const words = text.split(/\s+/);

        let scores = {
            english: 0.0,
            russian: 0.0,
        };

        for (const language in this.languages) {
            let probability = 1;

            for (const word of words) {
                if (word.length <= this.maxWordLength) {
                    const wordCount =
                        this.languages[language].wordCounts[word] || 0;
                    const wordProbability =
                        wordCount / this.languages[language].totalWords;

                    probability *= wordProbability || 0.01;
                }
            }

            scores[language] = probability;
        }

        return scores;
    }

    save(filename) {
        return false;
    }

    load(filename) {
        return false;
    }
}

// Определить язык методом ЧАСТОТНЫХ СЛОВ
// documents - текста, для которых происходить определение языка
let detectLanguageFW = (document) => {
    const modelFilename = "fwmodel.json";
    let model = FrequentWordsModel();

    if (!model.load(modelFilename)) {
        model.train(getTrainingData());
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
let detectLanguageSW = (document) => {
    const modelFilename = "swmodel.json";
    let model = ShortWordsModel(5); // Модель считает короткими слова, длина которых не больше 5 символов

    if (!model.load(modelFilename)) {
        model.train(getTrainingData());
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
