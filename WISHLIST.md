# Feature wish list

* Add more response shortcut methods for other http status codes.
* Add more error exception types and to the simple error handler.
* Add trace logging through out the project.
* Log a warning message if request chain does not callback in a specific time and indicate where it went wrong.
* Auto detect handler type based on the number of arguments the function has.
* Can we explore using a config helper to cut down the level of serverless.yml config. 
It would be nice if we could point the whole functions section at a javascript file that would generate it based on the 
information slspress has available from the code.