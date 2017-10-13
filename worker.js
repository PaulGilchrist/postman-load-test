const newman = require('newman');

onmessage = function (ev) {
	//Setup data to return on completion
	let message = {
		index: ev.data.index,
		error: null,
		summary: {}
	}
	newman.run(
		ev.data.options,
		(error, summary) => {
			if (error) {
				message.error = error;
				postMessage(message);
			} else {
				message.summary.averageResponseTimeMs = summary.run.timings.responseAverage;
				message.summary.requestsExecuted = summary.run.stats.requests.total;
				message.summary.requestsFailed = summary.run.stats.requests.failed;
				message.summary.assertionsExecuted = summary.run.stats.assertions.total;
				message.summary.assertionsFailed = summary.run.stats.assertions.failed;
				// Get total data recieved (run.executions[].response.responseSize)
				message.summary.responseSize = 0;
				for (let i = 0; i < summary.run.executions.length; i++) {
					let response = summary.run.executions[i].response;
					if(response) {
						message.summary.responseSize += response.responseSize;
					}
				}
				postMessage(message);
			}
		}
	);
};