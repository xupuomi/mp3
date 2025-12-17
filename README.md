# API for a task management / todo list
This is an API with the following end-points using Node, Express and Mongoose.

| Endpoints| Actions | Intended Outcome                                    |
|----------|---------|-----------------------------------------------------|
| users    | GET     | Respond with a List of users                        |
|          | POST    | Create a new user. Respond with details of new user |
| users/:id| GET     | Respond with details of specified user or 404 error |
|          | PUT     | Replace entire user with supplied user or 404 error |
|          | DELETE  | Delete specified user or 404 error                  |
| tasks    | GET     | Respond with a List of tasks                        |
|          | POST    | Create a new task. Respond with details of new task |
| tasks/:id| GET    | Respond with details of specified task or 404 error  |
|          | PUT     | Replace entire task with supplied task or 404 error |
|          | DELETE  | Delete specified task or 404 error                  |


| Parameter | Description                                                                                  |
|----------|----------------------------------------------------------------------------------------------|
| where    | filter results based on JSON query                                                           |
| sort     | specify the order in which to sort each specified field  (1- ascending; -1 - descending)     |
| select   | specify the set of fields to include or exclude in each document  (1 - include; 0 - exclude) |
| skip     | specify the number of results to skip in the result set; useful for pagination               |
| limit    | specify the number of results to return (default should be 100 for tasks and unlimited for users)                    |
| count    | if set to true, return the count of documents that match the query (instead of the documents themselves)                    |

The database is on MongoDB Atlas.

## Using Database Scripts

***NOTE: Use Python3 to run following codes*** 

**dbClean.py**

`python3 dbClean.py -u "localhost" -p 3000 `

You can change "localhost" and the port number to match your own running api server. Leave the quotation marks. DO NOT include "/api/" or "/user" etc.

**dbFill.py**

`python3 dbFill.py -u "localhost" -p 3000 -n 20 -t 100`

Once again, change the url and port number to match your own running api server. You can populate your database with X users and Y tasks (in the above case, 20 and 100 respectively). This will randomly generate users with realistic names and emails as well as realistic tasks. Tasks will have a 50% chance of being completed and a 60% chance of being assigned. If num_tasks >> num_users, users will likely have multiple tasks assigned to them. A task will have one assigned user at most.

**task.txt**

Contains sample task descriptions.  
