from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
#  allow requests from frontend (needed apparenytl)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True # making it pretty auto

# the stuff you use to connect to the database in ur postgres
def get_db_connection():
    conn = psycopg2.connect(
        #dbname="CSE412_GroupProject", user="aadz4", password="040504", host="localhost", port="5432" 
        dbname="", user="", password="", host="", port=""
    )
    return conn

def get_paginated_response(query, count_query, columns, params=()):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]
    
    #  query execution time
    cursor.execute("EXPLAIN ANALYZE " + query, params)
    execution_plan = cursor.fetchall()
    #time from the last line of EXPLAIN ANALYZE
    execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    
    #actual data
    cursor.execute(query, params)
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return {
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000  # Convert from ms to seconds
    }

# a sample query for now - same one from our phase 2 doc
@app.route('/api/sampleData', methods=['GET'])
def get_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT medalTally.country_noc, countryProfile.country, SUM(medalTally.gold)   AS total_gold, SUM(medalTally.silver) AS total_silver, SUM(medalTally.bronze) AS total_bronze, SUM(medalTally.total)  AS total_medals FROM Olympic_Medal_Tally_History AS medalTally JOIN Olympic_Country_Profiles AS countryProfile ON medalTally.country_noc = countryProfile.noc JOIN Olympic_Games_Summary AS gameSummary ON medalTally.edition_id = gameSummary.edition_id WHERE gameSummary.year::INTEGER >= 2004 GROUP BY medalTally.country_noc, countryProfile.country ORDER BY total_medals DESC;')
    columns = ["country_noc", "country", "goldMedals", "silverMedals", "bronzeMedals", "totalMedals"]
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    cursor.close()
    conn.close()
    return jsonify(results)

# a sample query that returns back all of the events an athlete participated in and any information about results or medals they got
@app.route('/api/<athleteName>', methods=['GET'])
def allAthleteEvents(athleteName):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT athleteInfo.name, eventDetails.athlete_id, eventResults.event_title, eventDetails.medal, eventResults.edition, eventResults.sport, eventResults.result_description FROM olympic_athlete_event_details AS eventDetails JOIN olympic_athlete_biography AS athleteInfo ON eventDetails.athlete_id = athleteInfo.athlete_id JOIN olympic_event_results AS eventResults ON eventDetails.result_id = eventResults.result_id WHERE athleteInfo.name ILIKE %s', (f'%{athleteName}%',))
    columns = ["name", "athlete_id", "event_title", "medal", "edition", "sport", "result_description"]
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    cursor.close()
    conn.close()
    return jsonify(results)

# a sample query that returns back all of the events of a specific sport in a specific year
# the endpoint can be reached by for example http://127.0.0.1:5000/api/2004%20Summer%20Olympics/Basketball for Basketball in the 2004 Summer Olympics
@app.route('/api/<editionYearSeason>/<sportName>', methods=['GET'])
def sportByYear(editionYearSeason, sportName):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM olympic_event_results WHERE edition = %s AND sport = %s', (editionYearSeason, sportName))
    columns = ["result_id", "event_title", "edition", "edition_id", "sport", "sport_url", "result_date", "result_location", "result_participants", "result_format", "result_detail", "result_description"]
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    cursor.close()
    conn.close()
    return jsonify(results)

# a sample query to find the most decorated athletes ever!
# # the endpoint can be reached by for example http://127.0.0.1:5000/api/medalsByAthlete
@app.route('/api/medalsByAthlete', methods=['GET'])
def medalsByAthlete():
    allAthletes = {}
    conn = get_db_connection()
    cursor = conn.cursor()

    # get all medal counts and make indiivudal athlete key values
    cursor.execute('SELECT athlete, COUNT(medal) FROM olympic_athlete_event_details WHERE medal IS NOT NULL GROUP BY athlete ORDER BY COUNT(medal) DESC')
    search_results = cursor.fetchall()
    for result in search_results:
        allAthletes[result[0]] = {
            "athlete": result[0],
            "medal_count": result[1]
        }

    # gold query, add to dict for that athlete
    cursor.execute('SELECT athlete, COUNT(medal) FROM olympic_athlete_event_details WHERE medal = %s GROUP BY athlete ORDER BY COUNT(medal) DESC', ('Gold',))
    search_results = cursor.fetchall()
    for result in search_results:
        allAthletes[result[0]]["gold_medal_count"] = result[1]

    # silver query, add to dict for that athlete
    cursor.execute('SELECT athlete, COUNT(medal) FROM olympic_athlete_event_details WHERE medal = %s GROUP BY athlete ORDER BY COUNT(medal) DESC', ('Silver',))
    search_results = cursor.fetchall()
    for result in search_results:
        allAthletes[result[0]]["silver_medal_count"] = result[1]

    # bronze query, add to dict for that athlete
    cursor.execute('SELECT athlete, COUNT(medal) FROM olympic_athlete_event_details WHERE medal = %s GROUP BY athlete ORDER BY COUNT(medal) DESC', ('Bronze',))
    search_results = cursor.fetchall()
    for result in search_results:
        allAthletes[result[0]]["bronze_medal_count"] = result[1]

    # put it into the list so we can jsonify
    results = []
    for athlete in allAthletes:
        results.append(allAthletes[athlete])


    cursor.close()
    conn.close()
    return jsonify(results)

# query for inserting

# query for updating something

# query for deleting something

# endpoint tester
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "hello i work"})

#  all athlete biographies
@app.route('/api/athletes', methods=['GET'])
def get_athletes():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    
    query = 'SELECT * FROM olympic_athlete_biography ORDER BY name LIMIT %s OFFSET %s'
    count_query = 'SELECT COUNT(*) FROM olympic_athlete_biography'
    columns = ["athlete_id", "name", "gender", "height", "weight", "birth_date"]
    
    return jsonify(get_paginated_response(
        query=query,
        count_query=count_query,
        columns=columns,
        params=(per_page, offset)
    ))

#  all athlete event details
@app.route('/api/athlete_events', methods=['GET'])
def get_athlete_events():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    
    query = 'SELECT * FROM olympic_athlete_event_details ORDER BY athlete LIMIT %s OFFSET %s'
    count_query = 'SELECT COUNT(*) FROM olympic_athlete_event_details'
    columns = ["athlete_id", "result_id", "athlete", "age", "medal"]
    
    return jsonify(get_paginated_response(
        query=query,
        count_query=count_query,
        columns=columns,
        params=(per_page, offset)
    ))

#  all country profiles
@app.route('/api/countries', methods=['GET'])
def get_countries():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    
    query = 'SELECT * FROM olympic_country_profiles ORDER BY country LIMIT %s OFFSET %s'
    count_query = 'SELECT COUNT(*) FROM olympic_country_profiles'
    columns = ["noc", "country", "notes"]
    
    return jsonify(get_paginated_response(
        query=query,
        count_query=count_query,
        columns=columns,
        params=(per_page, offset)
    ))

#  all event results
@app.route('/api/events', methods=['GET'])
def get_events():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    
    query = 'SELECT * FROM olympic_event_results ORDER BY edition, sport, event_title LIMIT %s OFFSET %s'
    count_query = 'SELECT COUNT(*) FROM olympic_event_results'
    columns = ["result_id", "event_title", "edition", "edition_id", "sport", "sport_url", "result_date", "result_location", "result_participants", "result_format", "result_detail", "result_description"]
    
    return jsonify(get_paginated_response(
        query=query,
        count_query=count_query,
        columns=columns,
        params=(per_page, offset)
    ))

#  all games summaries
@app.route('/api/games', methods=['GET'])
def get_games():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    
    query = 'SELECT * FROM olympic_games_summary ORDER BY year DESC LIMIT %s OFFSET %s'
    count_query = 'SELECT COUNT(*) FROM olympic_games_summary'
    columns = ["edition_id", "edition", "year", "host_city", "opening_date", "closing_date", "nations", "participants", "participants_m", "participants_f", "events"]
    
    return jsonify(get_paginated_response(
        query=query,
        count_query=count_query,
        columns=columns,
        params=(per_page, offset)
    ))

#  all medal tallies
@app.route('/api/medals', methods=['GET'])
def get_medals():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    
    query = '''
        SELECT medalTally.*, countryProfile.country 
        FROM olympic_medal_tally_history AS medalTally 
        JOIN olympic_country_profiles AS countryProfile 
        ON medalTally.country_noc = countryProfile.noc 
        ORDER BY edition_id DESC, total DESC 
        LIMIT %s OFFSET %s
    '''
    count_query = 'SELECT COUNT(*) FROM olympic_medal_tally_history'
    columns = ["edition_id", "country_noc", "rank", "gold", "silver", "bronze", "total", "rank_by_total", "country_name"]
    
    return jsonify(get_paginated_response(
        query=query,
        count_query=count_query,
        columns=columns,
        params=(per_page, offset)
    ))

if __name__ == "__main__":
    app.run(debug=True)
