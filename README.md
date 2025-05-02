# olympics
Developed By: Aayush Bharti, Aadithya Bharadwaj, Neel Ray, Mohammed Khamisani

Tech Stack: React Frontend, Python Flask API, PostgreSQL

Dataset In Use: Olympics 126 Year History (https://www.kaggle.com/datasets/muhammadehsan02/126-years-of-historical-olympic-dataset)

To Set Up the Database:
- Make sure the “properData” folder is downloaded from the Github repository.
- Open pgAdmin and run the “createDB.sql” file which is located inside the “properData” folder. You should see the new database created in your pgAdmin.
- Open and start the Database and run the “createTables.sql” file which is also located inside the “properData” folder. You should see the tables created within the new database in pgAdmin.
- For each table (in the order they were inserted in the createTables.sql file), right click on it in the schema and press the “Import/Export Data” button.
- Select the csv file for the table, use the “csv” option for “Format”. Then, click on the “Options” tab and turn on the “Header” option and make sure the Delimiter is “,”.
- Check that the tables are populated with sample test queries like “SELECT * FROM Olympic_Country_Profiles” and you should see a list of countries with their short form codes.

After the Database is Set Up, Start the Python Flask API:
- In the “backend” folder, locate the file called “gateway.py”.
- You will need to ensure you have Python and Pip installed on your machine, and then run the command “pip install flask flask-cors psycopg2-binary”
- Finally, run the python file with the command “python gateway.py” or “python3 gateway.py”. You should see the terminal say that the API is running on port 5000 or something similar.

After the API and Database are Up, Run the Frontend:
- Navigate to the “frontend” folder and run “npm install” to get all dependencies. You should see a progress bar showing the dependencies being installed.
- Run the command “npm start” and React will open the webpage for you automatically to start interacting with the Olympics database.

