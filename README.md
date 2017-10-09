# Postman Load Test

Enhancement for PostMan allowing for parallel execution of API calls to simulate load or stress conditions

## Steps
1. Download this project or clone it using GIT
	* git clone https://github.com/PaulGilchrist/postman-load-test.git
1. Install nodejs (if not already installed)
2. Change to the postmanLoadTest folder and install needed packages
	* npm install
3. Run Postman and export the collection to test and it's dependent environment (if any)
4. Edit app.js global variables to match the exported file names and test options desired
5. Launch the load test
	* node app.js
6. Record results
	* Concurrent Threads
	* Total Run Duration (sec)
	* Average Response Time (sec)
	* Requests Executed and Failed
	* Assertions Executed and Failed
7. Continue to scale up users recording results until errors occur or average response time becomes unacceptable
8. Look at Azure metrics to determine if bottleneck is website or database
9. Scale up Azure, recording old and new sizes, then repeat last test and record results
10. Continue to scale up parallel threads recording results until errors occur, then scale up Azure, etc.
	* All testing is complete when threads have exceeded the number of expected concurrent users
	* All test results should be associated with the Azure size at time of test
11. Return Azure to its original size
