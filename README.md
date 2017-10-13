# Postman Load Test

Enhancement for PostMan allowing for parallel execution of API calls to simulate load or stress conditions

## Features
* Thread ramp up
* Average calls per minute
* Summarize all threads into final report
* Scalability to 4000+ concurrent users
* Client or server bottleneck detection
* Error handling

## Setup Steps
1. Download this project or clone it using GIT
	* git clone https://github.com/PaulGilchrist/postman-load-test.git
1. Install nodejs (if not already installed)
2. Change to the postmanLoadTest folder and install needed packages
	* npm install

## Test Execution Steps
1. Run Postman exporting the collection to test and it's dependent environment (if any)
	* You may need to update any tokens in the environment before exporting
2. Edit app.js global variables to match the exported file names and test options desired
3. Launch the load test setting "max-old-space-size" to as much memory as you can afford to allocate.  This helps ensure Node has enough memory to manage all the threads you have choosen to run.  If the script errors with a heap allocation error, either reduce the number of threads, or increase the memory allocated by "max-old-space-size".  This application has been successfully tested beyond 4000 threads.
	* node --max-old-space-size=8192 app.js
4. Record results
	* Concurrent Threads
	* Total Run Duration (sec)
	* Average Response Time (sec)
	* Requests Executed and Failed
	* Assertions Executed and Failed
5. Continue to scale up users recording results until errors occur or average response time becomes unacceptable
6. Look at Azure metrics to determine if bottleneck is website or database
7. Scale up Azure, recording old and new sizes, then repeat last test and record results
8. Continue to scale up parallel threads recording results until errors occur, then scale up Azure, etc.
	* All testing is complete when threads have exceeded the number of expected concurrent users
	* All test results should be associated with the Azure size at time of test
9. Return Azure to its original size

## Important Notes
* Ensure the bottleneck is always the remote API being tested and not the local test computer or network connection
