const fs = require("fs");
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

    const detector = new LanguageDetector(trainingData);

    const textToDetect =
        "Мы строим города и разводим мосты, ткачи судеб и создатели своей собственной судьбы.";
    const scores = detector.detect(textToDetect);

    console.log(scores);
})();

class LanguageDetector {
    constructor(trainingData) {
        this.languageModels = {};

        for (let language in trainingData) {
            this.languageModels[language] = this.train(trainingData[language]);
        }
    }

    train(data) {
        const wordCounts = {};

        data.forEach((text) => {
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

        return sortedWords.slice(0, 100); // ПОЯ - первые 100 слов с наибольшей частотой
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
}
