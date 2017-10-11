
//Customizable variables
const threadCount = 100; // Number of concurrent threads
const threadRampUpPerSecond = 1; //1 thread will be added every second until threadCount is reached
const options = {
	collection: './postman_collection.json',
	delayRequest: 30000, // Each thread will make an API call every 30 seconds
    environment: './postman_environment.json',
    iterationCount: 1,
    reporters: ['cli']
};

//Required components
const after = require('lodash').after;
const fs = require('fs');
const newman = require('newman');

//private variables
let testStartTime;

function processResults(summaries) {
	let averageResponseTime = 0, responseSize = 0, requestsExecuted = 0, requestsFailed = 0, assertionsExecuted = 0, assertionsFailed = 0;
	for (let i = 0; i < threadCount; i++) {
		let run = summaries[i].run;
		averageResponseTime += run.timings.responseAverage;
		// Get total data recieved (run.executions[].response.responseSize)
		for (let j = 0; j < run.executions.length; j++) {
			let response = run.executions[j].response;
			if(response) {
				responseSize += run.executions[j].response.responseSize;
			}
		}
		requestsExecuted += run.stats.requests.total;
		requestsFailed += run.stats.requests.failed;
		assertionsExecuted += run.stats.assertions.total;
		assertionsFailed += run.stats.assertions.failed;
	}
	averageResponseTime = averageResponseTime / threadCount / 1000;
	let totalRunDuration = (Date.now() - testStartTime) / 1000;
	console.log(`\nAll test now complete\n`);
	console.log(`Concurrent Threads:          ${threadCount}`);
	console.log(`Total Run Duration (sec):    ${totalRunDuration.toFixed(1)},`);
	console.log(`Requests per Second:         ${(requestsExecuted/totalRunDuration).toFixed(1)}`);
	console.log(`Average Response Time (sec): ${averageResponseTime.toFixed(2)},`);
	console.log(`Requests:                    Executed = ${requestsExecuted}, Failed = ${requestsFailed}, Success Rate = ${((1-(requestsFailed/requestsExecuted))*100).toFixed(0)}%`);
	console.log(`Assertions:                  Executed = ${assertionsExecuted}, Failed = ${assertionsFailed}, Success Rate = ${((1-(assertionsFailed/assertionsExecuted))*100).toFixed(0)}%`);
}

function test() {
	// Use lodash.after to wait till all threads complete before aggregating the results
	let finished = after(threadCount, processResults);
	let summaries = [];
	testStartTime = Date.now();
	for (let i = 0; i < threadCount; i++) {
		setTimeout(() => {
			console.log(`Adding test thread # ${i}`);
			testThread(summaries, finished)
		}, i * (1000 / threadRampUpPerSecond));
	}
}

function testThread(summaries, callback) {
	// console.log(`Test thread - starting`);
	newman.run(
		options,
		(err, summary) => {
			if (err) {
				console.log(err);
			}
			// console.log('Test thread - complete');
			summaries.push(summary);
			callback(summaries);
		}
	);
}

test();