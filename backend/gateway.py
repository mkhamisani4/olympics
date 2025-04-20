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

# a sample query for now
@app.route('/api/data', methods=['GET'])
def get_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM olympic_medal_tally_history WHERE total > 100 ORDER BY total ASC LIMIT 1;')
    search_results = cursor.fetchall()
    return jsonify(search_results)

if __name__ == "__main__":
    app.run(debug=True)
