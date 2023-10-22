const fs = require("fs");
const pdf = require("pdf-parse");

const filePath = "./files/text.pdf";
const filePath2 = "./files/text2.pdf";

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

const classifier = new ShortWordsModel(5);

async function processPdf(filePath, language) {
    const dataBuffer = fs.readFileSync(filePath);
    
    return await pdf(dataBuffer);
}

(async () => {
    let russianTexts = await processPdf(filePath, "russian");
    let englishTexts = await processPdf(filePath2, "english");

    classifier.train({
        "russian" : [russianTexts.text.replace(/\n/g, "")],
        "english" : [englishTexts.text.replace(/\n/g, "")],
    });

    // Теперь можно классифицировать текст
    const textToClassify = "Song was good enough!";
    const predictedLanguage = classifier.detect(textToClassify);

    console.log(predictedLanguage);
})();

let detectLanguageSW = (document) => {
    const modelFilename = "swmodel.json"
    let model = ShortWordsModel();
    
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

// Пример использования:

// Обучаем классификатор на английском и русском
