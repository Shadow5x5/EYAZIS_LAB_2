const fs = require("fs");
const pdf = require("pdf-parse");

const filePath = "./files/text.pdf";
const filePath2 = "./files/text2.pdf";

class LanguageClassifier {
    constructor(threshold, maxWordLength) {
        this.threshold = threshold;
        this.maxWordLength = maxWordLength;
        this.languages = {};
    }

    train(language, text) {
        const words = text.split(/\s+/);

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
    }

    classify(text) {
        const words = text.split(/\s+/);

        let maxProbability = -1;
        let predictedLanguage = null;

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

            if (probability > maxProbability) {
                maxProbability = probability;
                predictedLanguage = language;
            }
        }

        return predictedLanguage;
    }
}

const classifier = new LanguageClassifier(3, 5);

async function processPdf(filePath, language) {
    const dataBuffer = fs.readFileSync(filePath);
    
    const data = await pdf(dataBuffer);
    classifier.train(language, data.text.replace(/\n/g, "", language));
}

(async () => {
    await processPdf(filePath, "russian");
    await processPdf(filePath2, "english");

    // Теперь можно классифицировать текст
    const textToClassify = "Song";
    const predictedLanguage = classifier.classify(textToClassify);

    console.log(`Predicted language: ${predictedLanguage}`);
})();



// Пример использования:

// Обучаем классификатор на английском и русском
