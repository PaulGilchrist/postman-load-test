// Requires
let Worker = require("tiny-worker");

// Variables
const threads = 1000; // Testing showed 100 MB per thread so ramp up slowly and make sure this computer does not become the bottleneck
const threadRampUpPerSec = 1; // Starting too many threads at once will crush this computer

const options = {
	collection: './postman_collection.json',
	delayRequest: 30000, // In milliseconds - Recommend 30000 for load test or 60 for stress test
	environment: './postman_environment.json',
	insecure: true,
	iterationCount: 1,
    reporters: ['cli'],
    timeoutRequest: 60000,
    timeoutScript: 60000
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Do not change any variables below this line
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let errors = [];
let summary = {
	averageResponseTimeMs: 0,
	responseSize: 0,
	requestsExecuted: 0,
	requestsFailed: 0,
	assertionsExecuted: 0,
	assertionsFailed: 0
}

let testStartTime;

let workers = [];
let runningWorkers = 0;

function showResultsSummary() {
	errors.forEach(error => console.log(error));
	let totalRunDuration = (Date.now() - testStartTime) / 1000;
	console.log(`\nAll test now complete\n`);
	console.log(`Threads:                     ${threads}`);
	console.log(`Delay (ms):                  ${options.delayRequest.toFixed(0)}`);
	console.log(`Iterations:                  ${options.iterationCount}`);
	console.log(`Thread Ramp Up per Second    ${threadRampUpPerSec}`);
	console.log(`Total Run Duration (sec):    ${totalRunDuration.toFixed(0)}`);
	console.log(`Total Data Received (MB):    ${(summary.responseSize/1048576).toFixed(0)}`);
	console.log(`Average Requests per Second: ${(threads*1000/options.delayRequest).toFixed(1)}`);
	console.log(`Average Response Time (sec): ${(summary.averageResponseTimeMs/1000).toFixed(2)}`);
	console.log(`Requests:                    Executed = ${summary.requestsExecuted}, Failed = ${summary.requestsFailed}, Success Rate = ${((1-(summary.requestsFailed/summary.requestsExecuted))*100).toFixed(0)}%`);
	console.log(`Assertions:                  Executed = ${summary.assertionsExecuted}, Failed = ${summary.assertionsFailed}, Success Rate = ${((1-(summary.assertionsFailed/summary.assertionsExecuted))*100).toFixed(0)}%`);
}

function test() {
	testStartTime = Date.now();
	for (let i = 0; i < threads; i++) {
		setTimeout(() => {
			// Setup data worker will need
			let message = {
				index: i, // Index in the workers array
				options: options
			}
			let worker = new Worker("worker.js");
			worker.onmessage = workerOnMessage; // Called when this single newman completes running all of its tests
			//Save all workers into an array
			workers.push(worker);
			//Start the worker process
			runningWorkers++;
			console.log(`Thread ${message.index} starting`);
			worker.postMessage(message);
		}, i * 1000 / threadRampUpPerSec); // Threads ramp up
	}
}

function workerOnMessage(ev) {
	if(ev.data.error) {
		errors.push(ev.data.error);
	} else {
		summary.averageResponseTimeMs += ev.data.summary.averageResponseTimeMs / threads;
		summary.responseSize += ev.data.summary.responseSize
		summary.requestsExecuted += ev.data.summary.requestsExecuted
		summary.requestsFailed += ev.data.summary.requestsFailed
		summary.assertionsExecuted += ev.data.summary.assertionsExecuted
		summary.assertionsFailed += ev.data.summary.assertionsFailed
	}
	console.log(`Thread ${ev.data.index} completed`);
	workers[ev.data.index].terminate();
	runningWorkers--;
	if(runningWorkers === 0) {
		showResultsSummary();
	}
}

test();