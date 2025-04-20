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

# a sample query for now - same one from our phase 2 doc
@app.route('/api/data', methods=['GET'])
def get_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT medalTally.country_noc, countryProfile.country, SUM(medalTally.gold)   AS total_gold, SUM(medalTally.silver) AS total_silver, SUM(medalTally.bronze) AS total_bronze, SUM(medalTally.total)  AS total_medals FROM Olympic_Medal_Tally_History AS medalTally JOIN Olympic_Country_Profiles AS countryProfile ON medalTally.country_noc = countryProfile.noc JOIN Olympic_Games_Summary AS gameSummary ON medalTally.edition_id = gameSummary.edition_id WHERE gameSummary.year::INTEGER >= 2004 GROUP BY medalTally.country_noc, countryProfile.country ORDER BY total_medals DESC;')
    columns = ["country_noc", "country", "goldMedals", "silverMedals", "bronzeMedals", "totalMedals"]
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)
