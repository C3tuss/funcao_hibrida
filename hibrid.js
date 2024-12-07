const XLSX = require('xlsx');
const cliProgress = require('cli-progress');

function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
    return arr;
}

function mergeSort(arr) {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));

    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;

    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
}

function hybridSort(arr, n0) {
    if (arr.length <= n0) {
        return insertionSort(arr);
    }

    const mid = Math.floor(arr.length / 2);
    const left = hybridSort(arr.slice(0, mid), n0);
    const right = hybridSort(arr.slice(mid), n0);

    return merge(left, right);
}

function measureExecutionTime(algorithm, array) {
    const start = performance.now();
    algorithm(array);
    const end = performance.now();
    return end - start;
}

function findN0() {
    let n0 = 0;

    for (let size = 10; size <= 10000; size *= 2) {
        const sortedArray = Array.from({ length: size }, (_, i) => i);
        const reverseArray = Array.from({ length: size }, (_, i) => size - i - 1);

        const timeInsertionSorted = measureExecutionTime(insertionSort, sortedArray);
        const timeMergeSorted = measureExecutionTime(mergeSort, sortedArray);

        const timeInsertionReverse = measureExecutionTime(insertionSort, reverseArray);
        const timeMergeReverse = measureExecutionTime(mergeSort, reverseArray);

        const avgInsertion = (timeInsertionSorted + timeInsertionReverse) / 2;
        const avgMerge = (timeMergeSorted + timeMergeReverse) / 2;

        if (avgMerge < avgInsertion) {
            n0 = size;
            break;
        }
    }

    return n0;
}

function runExperiment(array, n0) {
    const results = { insertion: [], merge: [], hybrid: [] };

    const bar = new cliProgress.SingleBar({
        format: 'Experimento [{bar}] {percentage}% | {value}/{total} Rodadas | Tempo Restante: {remaining}s',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
    }, cliProgress.Presets.shades_classic);

    const totalRounds = 100;
    bar.start(totalRounds, 0);

    const startTime = Date.now(); // Marca o tempo de início do experimento

    for (let i = 0; i < totalRounds; i++) {
        results.insertion.push(measureExecutionTime(insertionSort, [...array]));
        results.merge.push(measureExecutionTime(mergeSort, [...array]));
        results.hybrid.push(measureExecutionTime((arr) => hybridSort(arr, n0), [...array]));

        const elapsedTime = (Date.now() - startTime) / 1000; // Tempo passado em segundos
        const estimatedTimeRemaining = (elapsedTime / (i + 1)) * (totalRounds - (i + 1)); // Estimativa do tempo restante
        bar.update(i + 1, { remaining: estimatedTimeRemaining.toFixed(2) });
    }

    bar.stop();

    return results;
}

function calculateStatistics(times) {
    const n = times.length;
    const mean = times.reduce((sum, time) => sum + time, 0) / n;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...times);
    const max = Math.max(...times);

    const frequencyMap = times.reduce((map, time) => {
        map[time] = (map[time] || 0) + 1;
        return map;
    }, {});
    const mode = Object.keys(frequencyMap).reduce((a, b) => frequencyMap[a] > frequencyMap[b] ? a : b);

    return { mean, min, max, mode: parseFloat(mode), stdDev };
}

function exportToExcel(allResults) {
    const wb = XLSX.utils.book_new();

    const headers = ['Execução', 'Insertion Sort', 'Merge Sort', 'Hybrid Sort'];

    const resultsData = [];

    // Para o array ordenado
    resultsData.push(['Array Ordenado']);
    resultsData.push(headers);
    for (let i = 0; i < allResults.sorted.insertion.length; i++) {
        resultsData.push([`Exec ${i + 1}`, allResults.sorted.insertion[i], allResults.sorted.merge[i], allResults.sorted.hybrid[i]]);
    }

    // Para o array inverso
    resultsData.push(['Array Inverso']);
    resultsData.push(headers);
    for (let i = 0; i < allResults.reverse.insertion.length; i++) {
        resultsData.push([`Exec ${i + 1}`, allResults.reverse.insertion[i], allResults.reverse.merge[i], allResults.reverse.hybrid[i]]);
    }

    const ws = XLSX.utils.aoa_to_sheet(resultsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');

    XLSX.writeFile(wb, 'resultados_experimento.xlsx');
}

const sortedArray = Array.from({ length: 100000 }, (_, i) => i);
const reverseArray = Array.from({ length: 100000 }, (_, i) => 100000 - i - 1);

const n0 = findN0();
const sortedResults = runExperiment(sortedArray, n0);
const reverseResults = runExperiment(reverseArray, n0);

exportToExcel({ sorted: sortedResults, reverse: reverseResults });

console.log("Estatísticas para o Array Ordenado:");
console.log("Insertion Sort:", calculateStatistics(sortedResults.insertion));
console.log("Merge Sort:", calculateStatistics(sortedResults.merge));
console.log("Hybrid Sort:", calculateStatistics(sortedResults.hybrid));

console.log("Estatísticas para o Array Inverso:");
console.log("Insertion Sort:", calculateStatistics(reverseResults.insertion));
console.log("Merge Sort:", calculateStatistics(reverseResults.merge));
console.log("Hybrid Sort:", calculateStatistics(reverseResults.hybrid));
