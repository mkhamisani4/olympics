from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)

# the stuff you use to connect to the database in ur postgres
def get_db_connection():
    conn = psycopg2.connect(
        dbname="", user="", password="", host="",
        port=""
    )
    return conn

@app.route('/api/data', methods=['GET'])
def get_data():
    print("My name is Mo!")

if __name__ == "__main__":
    app.run(debug=True)
