//	Run the script using the following command to allocate 8GB of memory to the heap and allow for more parallelism
//		node --max-old-space-size=8192 app.js

//Customizable variables
const usersToSimulate = 0
const averageCallsPerUserPerMinute = 2;

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
const v8 = require('v8');

//private variables
let testStartTime;
let threadCount;
let averageResponseTimeMs = 0, responseSize = 0, requestsExecuted = 0, requestsFailed = 0, assertionsExecuted = 0, assertionsFailed = 0;

function showResultsSummary() {
	let totalRunDuration = (Date.now() - testStartTime) / 1000;
	console.log(`\nAll test now complete\n`);
	console.log(`Simulated Users:             ${usersToSimulate}`);
	console.log(`Avg Calls / User / Min:      ${averageCallsPerUserPerMinute}`);
	console.log(`Total Run Duration (sec):    ${totalRunDuration.toFixed(0)},`);
	console.log(`Requests per Second:         ${(threadCount*1000/options.delayRequest).toFixed(1)}`);
	console.log(`Average Response Time (sec): ${(averageResponseTimeMs/1000).toFixed(2)},`);
	console.log(`Requests:                    Executed = ${requestsExecuted}, Failed = ${requestsFailed}, Success Rate = ${((1-(requestsFailed/requestsExecuted))*100).toFixed(0)}%`);
	console.log(`Assertions:                  Executed = ${assertionsExecuted}, Failed = ${assertionsFailed}, Success Rate = ${((1-(assertionsFailed/assertionsExecuted))*100).toFixed(0)}%`);
}

function test() {
	// Use lodash.after to wait till all threads complete before aggregating the results
	threadCount = usersToSimulate;
	options.delayRequest = 60000 / averageCallsPerUserPerMinute;
	options.iterationCount = 1;
	
	// Determine if there is enough heap space for the requested number of threads
	console.log(`Was heap raised = ${process.argv}`);

	while(threadCount > 100 && options.delayRequest >= 1000) {
		// We run out of heap space if newman is parallelized too much, so lets limit threads to 100 and run less delay between requests
		threadCount = threadCount / 10;
		options.delayRequest = options.delayRequest / 10
		options.iterationCount = options.iterationCount * 10
	}
	let next = after(threadCount, showResultsSummary);
	testStartTime = Date.now();
	for (let i = 0; i < threadCount; i++) {
		setTimeout(() => {
			testThread(next);
		}, i * 1000); // Threads ramp up one per second
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