# Postman Load Test

Enhancement for PostMan allowing for parallel execution of API calls to simulate load or stress conditions

## Steps
1. Download this project or clone it using GIT
	* git clone https://github.com/PaulGilchrist/postmanLoadTest.git
1. Install nodejs (if not already installed)
2. Change to the postmanLoadTest folder and install needed packages
	* npm install
3. Run Postman and export the collection to test and it's dependent environment (if any)
4. Edit app.js global variables to match the exported file names and test options desired
5. Launch the load test
	* node app.js
6. Record results
	* requests/second
	* average duration
7. Continue to scale up users recording results until errors occur
8. Look at Azure metrics to determine if bottleneck is website or database
9. Scale up Azure, record old and new sizes, then repeat last k6 test and record results
10. Continue to scale up users recording results until errors occur, then scale up Azure, etc.
	* All testing is complete when users have reached 5000 concurrent.
	* All test results should be associated with the Azure size at time of test
11. Return Azure to its original size
