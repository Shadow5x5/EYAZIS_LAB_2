const fs = require("fs");
const { mod } = require("numjs");
const pdf = require("pdf-parse");

const filePath = "./files/text.pdf";
const filePath2 = "./files/text2.pdf";

const trainingData = {
    english: [
        "The sun was setting over the horizon, painting the sky in shades of orange and pink. Birds chirped their evening songs, bidding farewell to another day. As the world settled into a peaceful slumber, a sense of calm washed over everything.",
    ],
    russian: [
        "Солнце садилось за горизонтом, раскрашивая небо оттенками оранжевого и розового. Птицы щебетали свои вечерние песни, прощаясь с еще одним днем. Когда мир погружался в мирный сон, на все ниспадала чувство спокойствия.",
    ],
};

async function processPdf(filePath, language) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    trainingData[language].push(data.text.replace(/\n/g, ""));
}

(async () => {
    await processPdf(filePath, "russian");
    await processPdf(filePath2, "english");
    console.log(trainingData);

    const detector = new FrequentWordsModel(trainingData);

    const textToDetect =
        "Мы строим города и разводим мосты, ткачи судеб и создатели своей собственной судьбы.";
    const scores = detector.detect(textToDetect);

    console.log(scores);
})();

// Получить словарь типа:
// {
//      язык: [тренировочный_текст1, тренировочный_текст2, ..., тренировочный_текстn]
// }
let getTrainingData = () => {
    // Надо реализовать...
}

// Загрузить json из файла 'filename'
let loadFromFile = (filename) => {
    // Надо реализовать...
}

// Сохранить json переданный в параметре data в файл с именем 'filename'
let saveToFile = (filename, data) => {
    // Надо реализовать
}

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
            "english": 0.0,
            "russian": 0.0
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
    const modelFilename = "fwmodel.json"
    let model = FrequentWordsModel();
    
    if (! model.load(modelFilename)) {
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
        text: document
    };
}

// Определить язык документа методом КОРОТКИХ СЛОВ
let detectLanguageSW = (document) => {
    const modelFilename = "swmodel.json"
    let model = ShortWordsModel(5); // Модель считает короткими слова, длина которых не больше 5 символов
    
    if (! model.load(modelFilename)) {
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
        text: document
    };
}
