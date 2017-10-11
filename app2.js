// This application has been successfully tested beyond 4000 threads

// Standard tuning
const usersToSimulate = 4000;
const averageCallsPerUserPerMinute = 2;

// Advanced tuning
// Run node passing the the "--max-old-space-size" parameter to ensure there is enough memory to support the number of threads you have choosen.
//		node --max-old-space-size=8192 app.js
// If the script errors with a heap allocation error, either reduce the number of threads, or increase the memory allocated by "max-old-space-size"
const threadRampUpPerSec = 2; // Stay between 1 and 4 to keep the API calls evenly distributed
const maxThreads = 100; // Testing shows 36 MB of memory required per thread.  Tested to 500 threads requiring "--max-old-space-size=18432"

const options = {
	collection: './postman_collection.json',
    environment: './postman_environment.json',
    reporters: ['cli']
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Do not change any variables below this line
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Required components
const after = require('lodash').after;
const newman = require('newman');

//private variables
let testStartTime;
let threadCount;
let averageResponseTimeMs = 0, responseSize = 0, requestsExecuted = 0, requestsFailed = 0, assertionsExecuted = 0, assertionsFailed = 0;

function showResultsSummary() {
	let totalRunDuration = (Date.now() - testStartTime) / 1000;
	console.log(`\nAll test now complete\n`);
	console.log(`Simulated Users:             ${usersToSimulate}`);
	console.log(`Avg Calls / User / Min:      ${averageCallsPerUserPerMinute}`);
	console.log(`Threads:                     ${maxThreads}`);
	console.log(`Thread Ramp Up per Second    ${threadRampUpPerSec}`);
	console.log(`Total Run Duration (sec):    ${totalRunDuration.toFixed(0)}`);
	console.log(`Total Data Received:         ${responseSize.toFixed(0)}`);
	console.log(`Average Requests per Second: ${(threadCount*1000/options.delayRequest).toFixed(1)}`);
	console.log(`Average Response Time (sec): ${(averageResponseTimeMs/1000).toFixed(2)}`);
	console.log(`Requests:                    Executed = ${requestsExecuted}, Failed = ${requestsFailed}, Success Rate = ${((1-(requestsFailed/requestsExecuted))*100).toFixed(0)}%`);
	console.log(`Assertions:                  Executed = ${assertionsExecuted}, Failed = ${assertionsFailed}, Success Rate = ${((1-(assertionsFailed/assertionsExecuted))*100).toFixed(0)}%`);
}

function test() {
	threadCount = usersToSimulate;
	if(usersToSimulate <= maxThreads) {
		threadCount = usersToSimulate;
		options.delayRequest = 60000 / averageCallsPerUserPerMinute;
		options.iterationCount = 1;
	} else {
		threadCount = maxThreads;
		let ratioToAdjust = Math.ceil(usersToSimulate / maxThreads);
		options.delayRequest = 60000 / averageCallsPerUserPerMinute / ratioToAdjust;
		options.iterationCount = ratioToAdjust;
	}
	// Use lodash.after to wait till all threads complete before aggregating the results
	let next = after(threadCount, showResultsSummary);
	testStartTime = Date.now();
	for (let i = 0; i < threadCount; i++) {
		setTimeout(() => {
			testThread(next);
		}, i * 1000 / threadRampUpPerSec); // Threads ramp up
	}
}

function testThread(next) {
	// console.log(`Test thread - starting`);
	newman.run(
		options,
		(err, summary) => {
			if (err) {
				console.log(err);
			}
			averageResponseTimeMs += summary.run.timings.responseAverage / threadCount;
			requestsExecuted += summary.run.stats.requests.total;
			requestsFailed += summary.run.stats.requests.failed;
			assertionsExecuted += summary.run.stats.assertions.total;
			assertionsFailed += summary.run.stats.assertions.failed;
			// Get total data recieved (run.executions[].response.responseSize)
			for (let i = 0; i < summary.run.executions.length; i++) {
				let response = summary.run.executions[i].response;
				if(response) {
					responseSize += response.responseSize;
				}
			}
			next();
		}
	);
}

test();