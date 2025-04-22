# olympics
Developed By: Aayush Bharti, Aadithya Bharadwaj, Neel Ray, Mohammed Khamisani

Tech Stack: React Frontend, Python Flask API, PostgreSQL

Dataset In Use: Olympics 126 Year History (https://www.kaggle.com/datasets/muhammadehsan02/126-years-of-historical-olympic-dataset)

How to Use (Initial for Dev):
1. Start your PostgreSQL and make sure all CREATE Table Scripts have been executed and Data is Populated.
2. Find out your port and host information and put into the python script in the .connect fields. Additionally, put the name of the database, your username, and password for Postgres.
- Tips for this part: 
    - Username: Can be found by running SELECT current_user;
    - Password: It is just the password for the above username, but if you forgot run 
        - ALTER theUsernameFromAbove WITH PASSWORD 'bored';
    - The name of the database is just whatever you named it when you created it to populate the data into.
    - If you followed the initial Postgres documentation from the beginning of the semester, your host might be '/tmp' and your port might be '8888' but if not, you could try host as 'localhost' and port as '5432'. If neither work, check PgAdmin for more info.
3. Inside the backend folder, running python3 gateway.py will power up the API
4. http://127.0.0.1:5000/api/sampleData is the localhost endpoint to return the results of the sample query in JSON. Use the other endpoints to try out the other sample queries.
5. Frontend... Soon
