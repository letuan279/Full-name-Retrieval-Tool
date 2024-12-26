import khongDau from "@/utils/khongDau";

function compareTwoStrings(first, second, n = 3) {
    first = first.replace(/\s+/g, '');
    second = second.replace(/\s+/g, '');

    if (first === second) return 1; // identical or empty
    if (first.length < n || second.length < n) return 0; // if either is shorter than n

    let firstNgrams = new Map();
    for (let i = 0; i <= first.length - n; i++) {
        const ngram = first.substring(i, i + n);
        const count = firstNgrams.has(ngram)
            ? firstNgrams.get(ngram) + 1
            : 1;

        firstNgrams.set(ngram, count);
    }

    let intersectionSize = 0;
    for (let i = 0; i <= second.length - n; i++) {
        const ngram = second.substring(i, i + n);
        const count = firstNgrams.has(ngram)
            ? firstNgrams.get(ngram)
            : 0;

        if (count > 0) {
            firstNgrams.set(ngram, count - 1);
            intersectionSize++;
        }
    }

    return (n * intersectionSize) / (first.length + second.length - 2 * n);
}

function findBestMatchOld(mainString, targetStrings) {
    if (!areArgsValid(mainString, targetStrings)) throw new Error('Bad arguments: First argument should be a string, second should be an array of strings');

    const ratings = [];
    let bestMatchIndex = 0;

    for (let i = 0; i < targetStrings.length; i++) {
        const currentTargetString = targetStrings[i];
        const currentRating = compareTwoStrings(mainString, currentTargetString)
        ratings.push({ target: currentTargetString, rating: currentRating })
        if (currentRating > ratings[bestMatchIndex].rating) {
            bestMatchIndex = i
        }
    }


    const bestMatch = ratings[bestMatchIndex]

    return { ratings: ratings, bestMatch: bestMatch, bestMatchIndex: bestMatchIndex };
}

function areArgsValid(mainString, targetStrings) {
    if (typeof mainString !== 'string') return false;
    if (!Array.isArray(targetStrings)) return false;
    if (!targetStrings.length) return false;
    if (targetStrings.find(function (s) { return typeof s !== 'string' })) return false;
    return true;
}

export const findBestMatch = (mainString, targetStrings) => {
    const cleanString = (str) => str.replace(/[^a-z0-9]/gi, '');
    const mainStringFiltered = cleanString(khongDau(mainString)).toLowerCase();
    const targetStringsFiltered = targetStrings.map(item => cleanString(khongDau(item)).toLowerCase());
    const matches = findBestMatchOld(mainStringFiltered, targetStringsFiltered);
    return matches.bestMatchIndex;
}
