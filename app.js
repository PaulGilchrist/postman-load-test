
//Customizable variables
const threadCount = 200;
const options = {
	collection: './postman_collection.json',
	delayRequest: 3000,
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

function test() {
	// Use lodash.after to wait till all threads complete before aggregating the results
	let finished = after(threadCount, processResults);
	let summaries = [];
	console.log(`Running test collection: ${options.collection}`);
	console.log(`Running ${threadCount} threads at ${options.iterationCount} iterations each`);
	testStartTime = Date.now();
	for (let i = 0; i < threadCount; i++) {
		testThread(summaries, finished);
	}
}

function processResults(summaries) {
	let sections = ['iterations', 'items', 'scripts', 'prerequests', 'requests', 'tests', 'assertions', 'testScripts', 'prerequestScripts'];
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
	console.log(`Average Response Time (sec): ${averageResponseTime.toFixed(2)},`);
	console.log(`Requests:                    Executed = ${requestsExecuted}, Failed = ${requestsFailed}, Success Rate = ${((1-(requestsFailed/requestsExecuted))*100).toFixed(0)}%`);
	console.log(`Assertions:                  Executed = ${assertionsExecuted}, Failed = ${assertionsFailed}, Success Rate = ${((1-(assertionsFailed/assertionsExecuted))*100).toFixed(0)}%`);
}

function testThread(summaries, callback) {
	// console.log(`Test thread - starting`);
	newman.run(
		options,
		(err, summary) => {
			if (err) {
				throw err;
			}
			// console.log('Test thread - complete');
			summaries.push(summary);
			callback(summaries);
		}
	);
}

test();