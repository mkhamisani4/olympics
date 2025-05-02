from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2

player_dict = {}

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
        dbname="CSE412_GroupProject", user="aadz4", password="040504", host="localhost", port="5432"
        #dbname="Project", user="postgres", password="Jawn", host="localhost", port="5433"
        # dbname="", user="", password="", host="", port=""
    )
    return conn

def get_paginated_response(query, count_query, columns, params=(), search_term=None, search_columns=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    working_query = query
    working_count_query = count_query
    working_params = list(params)
    
    if search_term and search_columns:
        search_conditions = " OR ".join([f"{col} ILIKE %s" for col in search_columns])
        search_value = f'%{search_term}%'
        
        for _ in search_columns:
            working_params.append(search_value)
        
        if "WHERE" in working_query:
            working_query = working_query.replace("ORDER BY", f"AND ({search_conditions}) ORDER BY")
            working_count_query = working_count_query + f" AND ({search_conditions})"
        else:
            working_query = working_query.replace("ORDER BY", f"WHERE ({search_conditions}) ORDER BY")
            working_count_query = working_count_query + f" WHERE ({search_conditions})"
    
    cursor.execute(working_count_query, tuple(working_params))
    total_count = cursor.fetchone()[0]
    
    execution_time = 0
    try:
        cursor.execute("EXPLAIN ANALYZE " + working_query, tuple(working_params))
        execution_plan = cursor.fetchall()
        execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    except Exception as e:
        print(f"Error during EXPLAIN ANALYZE: {e}")
    
    cursor.execute(working_query, tuple(working_params))
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return {
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000
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

# INSERTION
# athlete biography table
# sample endpoint for this http://127.0.0.1:5000/api/add/athleteBio/123123423/NotLeBron%20NotJames/Male/4%20April%201949/200/230/Bulgaria/BUL/goat...nuff%20said/GOATED adds THE GOAT - has to be unique though so delete him first if already existing
@app.route('/api/add/athleteBio/<id>/<name>/<sex>/<born>/<height>/<weight>/<country>/<country_noc>/<description>/<special_notes>', methods=['POST'])
def insert_player(id, name, sex, born, height, weight, country, country_noc, description, special_notes):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO Olympic_Athlete_Biography (athlete_id, name, sex, born, height, weight, country, country_noc, description, special_notes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', (id, name, sex, born, height, weight, country, country_noc, description, special_notes))

    player_dict[id] = name
    #print(player_dict)
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": f"{name} Inserted successfully"})

# athlete event details table
@app.route('/api/add/athleteEventDetails/<edition>/<edition_id>/<country_noc>/<sport>/<event>/<result_id>/<athlete>/<athlete_id>/<pos>/<medal>/<isteamsport>', methods=['POST'])
def insert_player_event(edition, edition_id, country_noc, sport, event, result_id, athlete, athlete_id, pos, medal, isteamsport):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO Olympic_Athlete_Event_Details (edition, edition_id, country_noc, sport, event, result_id, athlete, athlete_id, pos, medal, isteamsport) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', (edition, edition_id, country_noc, sport, event, result_id, athlete, athlete_id, pos, medal, isteamsport))

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": f"{athlete} Inserted successfully"})

# UPDATE 
# athlete biography table
# for the above insertion of NotLeBron, use this endpoint to test: http://127.0.0.1:5000/api/update/athleteBio/123123423/NotLeBron%20NotJames/Male/4%20April%201949/24/230/Bulgaria/BUL/goat...nuff%20said/GOATED
@app.route('/api/update/athleteBio', methods=['PUT'])
def update_athlete():
    data = request.get_json()
    id = data.get('athlete_id')
    name = data.get('name')
    sex = data.get('sex')
    born = data.get('born')
    height = data.get('height')
    weight = data.get('weight')
    country = data.get('country')
    country_noc = data.get('country_noc')
    description = data.get('description')
    special_notes = data.get('special_notes')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE Olympic_Athlete_Biography SET name = %s, sex = %s, born = %s, height = %s, weight = %s, country = %s, country_noc = %s, description = %s, special_notes = %s WHERE athlete_id = %s', (name, sex, born, height, weight, country, country_noc, description, special_notes, id))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify(success=True, message=f"{name} Updated successfully")

# athlete event details table
@app.route('/api/update/athleteEventDetails', methods=['PUT'])
def update_player_event():
    data = request.get_json()
    edition = data.get('edition')
    edition_id = data.get('edition_id')
    country_noc = data.get('country_noc')
    event = data.get('event')
    result_id = data.get('result_id')
    athlete = data.get('athlete')
    athlete_id = data.get('athlete_id')
    pos = data.get('pos')
    medal = data.get('medal')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE Olympic_Athlete_Event_Details SET edition = %s, country_noc = %s, event = %s, athlete = %s, medal = %s WHERE edition_id = %s AND result_id = %s AND athlete_id = %s AND pos = %s', (edition, country_noc, event, athlete, medal, edition_id, result_id, athlete_id, pos))

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify(success=True, message=f"{result_id} Updated successfully")


# DELETE
# athlete biography table
@app.route('/api/delete/athleteBio/<id>/<name>', methods=['DELETE'])
def delete_player(id, name):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if id in player_dict and player_dict[id] == name:
        del player_dict[id]
        cursor.execute('DELETE FROM Olympic_Athlete_Biography WHERE athlete_id = %s AND name = %s', (id, name))

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": f"{name} Deleted successfully"})

# athlete event details table
@app.route('/api/delete/athleteEventDetails/<edition_id>/<result_id>/<athlete_id>/<pos>', methods=['DELETE'])
def delete_player_event(edition_id, result_id, athlete_id, pos):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM Olympic_Athlete_Event_Details WHERE edition_id = %s AND result_id = %s AND athlete_id = %s AND pos = %s', (edition_id, result_id, athlete_id, pos))

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": f"Record with Edition ID: {edition_id}, Result ID: {result_id}, Athlete ID: {athlete_id}, Position: {pos} Deleted successfully"})




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
    search_query = request.args.get('search', '')
    
    base_query = 'SELECT * FROM olympic_athlete_biography'
    
    if search_query:
        search_value = f'%{search_query}%'
        where_clause = '''
        WHERE name ILIKE %s 
        OR country ILIKE %s 
        OR country_noc ILIKE %s
        '''
        order_and_limit = 'ORDER BY name LIMIT %s OFFSET %s'
        query = base_query + where_clause + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_athlete_biography WHERE name ILIKE %s OR country ILIKE %s OR country_noc ILIKE %s'
        params = (search_value, search_value, search_value, per_page, offset)
        count_params = (search_value, search_value, search_value)
    else:
        order_and_limit = 'ORDER BY name LIMIT %s OFFSET %s'
        query = base_query + ' ' + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_athlete_biography'
        params = (per_page, offset)
        count_params = ()
    
    columns = ["athlete_id", "name", "sex", "born", "height", "weight", "country", "country_noc", "description", "special_notes"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    try:
        cursor.execute("EXPLAIN ANALYZE " + query, params)
        execution_plan = cursor.fetchall()
        execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    except Exception as e:
        print(f"Error during EXPLAIN ANALYZE: {e}")
        execution_time = 0
    
    cursor.execute(query, params)
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000
    })

#  all athlete event details
@app.route('/api/athlete_events', methods=['GET'])
def get_athlete_events():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    search_query = request.args.get('search', '')
    
    base_query = 'SELECT * FROM olympic_athlete_event_details'
    
    #bruh this search better work or im going toc ry
    if search_query:
        search_value = f'%{search_query}%'
        where_clause = ''' 
        WHERE athlete ILIKE %s 
        OR sport ILIKE %s 
        OR event ILIKE %s
        OR medal ILIKE %s
        OR country_noc ILIKE %s
        '''
        order_and_limit = 'ORDER BY athlete LIMIT %s OFFSET %s'
        query = base_query + where_clause + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_athlete_event_details WHERE athlete ILIKE %s OR sport ILIKE %s OR event ILIKE %s OR medal ILIKE %s OR country_noc ILIKE %s'
        params = (search_value, search_value, search_value, search_value, search_value, per_page, offset)
        count_params = (search_value, search_value, search_value, search_value, search_value)
    else:
        order_and_limit = 'ORDER BY athlete LIMIT %s OFFSET %s'
        query = base_query + ' ' + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_athlete_event_details'
        params = (per_page, offset)
        count_params = ()
    
    columns = ["edition", "edition_id", "country_noc", "sport", "event", "result_id", "athlete", "athlete_id", "pos", "medal", "isteamsport"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    try:
        cursor.execute("EXPLAIN ANALYZE " + query, params)
        execution_plan = cursor.fetchall()
        execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    except Exception as e:
        print(f"Error during EXPLAIN ANALYZE: {e}")
        execution_time = 0
    
    cursor.execute(query, params)
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000
    })

#  all country profiles
@app.route('/api/countries', methods=['GET'])
def get_countries():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    search_query = request.args.get('search', '')
    
    base_query = 'SELECT * FROM olympic_country_profiles'
    
    if search_query:
        search_value = f'%{search_query}%'
        where_clause = '''
        WHERE noc ILIKE %s 
        OR country ILIKE %s
        '''
        order_and_limit = 'ORDER BY country LIMIT %s OFFSET %s'
        query = base_query + where_clause + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_country_profiles WHERE noc ILIKE %s OR country ILIKE %s'
        params = (search_value, search_value, per_page, offset)
        count_params = (search_value, search_value)
    else:
        order_and_limit = 'ORDER BY country LIMIT %s OFFSET %s'
        query = base_query + ' ' + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_country_profiles'
        params = (per_page, offset)
        count_params = ()
    
    columns = ["noc", "country"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    try:
        cursor.execute("EXPLAIN ANALYZE " + query, params)
        execution_plan = cursor.fetchall()
        execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    except Exception as e:
        print(f"Error during EXPLAIN ANALYZE: {e}")
        execution_time = 0
    
    cursor.execute(query, params)
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000
    })

#  all event results
@app.route('/api/events', methods=['GET'])
def get_events():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    search_query = request.args.get('search', '')
    
    base_query = 'SELECT * FROM olympic_event_results'
    
    if search_query:
        search_value = f'%{search_query}%'
        where_clause = '''
        WHERE event_title ILIKE %s 
        OR edition ILIKE %s 
        OR sport ILIKE %s
        OR result_location ILIKE %s
        '''
        order_and_limit = 'ORDER BY edition, sport, event_title LIMIT %s OFFSET %s'
        query = base_query + where_clause + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_event_results WHERE event_title ILIKE %s OR edition ILIKE %s OR sport ILIKE %s OR result_location ILIKE %s'
        params = (search_value, search_value, search_value, search_value, per_page, offset)
        count_params = (search_value, search_value, search_value, search_value)
    else:
        order_and_limit = 'ORDER BY edition, sport, event_title LIMIT %s OFFSET %s'
        query = base_query + ' ' + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_event_results'
        params = (per_page, offset)
        count_params = ()
    
    columns = ["result_id", "event_title", "edition", "edition_id", "sport", "sport_url", "result_date", "result_location", "result_participants", "result_format", "result_detail", "result_description"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    try:
        cursor.execute("EXPLAIN ANALYZE " + query, params)
        execution_plan = cursor.fetchall()
        execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    except Exception as e:
        print(f"Error during EXPLAIN ANALYZE: {e}")
        execution_time = 0
    
    cursor.execute(query, params)
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000
    })

#  all games summaries
@app.route('/api/games', methods=['GET'])
def get_games():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    search_query = request.args.get('search', '')
    
    base_query = 'SELECT * FROM olympic_games_summary'
    
    if search_query:
        search_value = f'%{search_query}%'
        where_clause = '''
        WHERE edition ILIKE %s 
        OR year::text ILIKE %s 
        OR city ILIKE %s
        OR country_noc ILIKE %s
        '''
        order_and_limit = 'ORDER BY year DESC LIMIT %s OFFSET %s'
        query = base_query + where_clause + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_games_summary WHERE edition ILIKE %s OR year::text ILIKE %s OR city ILIKE %s OR country_noc ILIKE %s'
        params = (search_value, search_value, search_value, search_value, per_page, offset)
        count_params = (search_value, search_value, search_value, search_value)
    else:
        order_and_limit = 'ORDER BY year DESC LIMIT %s OFFSET %s'
        query = base_query + ' ' + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_games_summary'
        params = (per_page, offset)
        count_params = ()
    
    columns = ["edition", "edition_id", "edition_url", "year", "city", 
               "country_flag_url", "country_noc", "start_date", "end_date", 
               "competition_date", "isHeld"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    try:
        cursor.execute("EXPLAIN ANALYZE " + query, params)
        execution_plan = cursor.fetchall()
        execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    except Exception as e:
        print(f"Error during EXPLAIN ANALYZE: {e}")
        execution_time = 0
    
    cursor.execute(query, params)
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000
    })

#  all medal tallies
@app.route('/api/medals', methods=['GET'])
def get_medals():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    search_query = request.args.get('search', '')
    
    base_query = '''
        SELECT medalTally.edition, medalTally.edition_id, medalTally.year, medalTally.country, medalTally.country_noc, 
        ROW_NUMBER() OVER(PARTITION BY medalTally.edition_id ORDER BY medalTally.total DESC) as rank,
        medalTally.gold, medalTally.silver, medalTally.bronze, medalTally.total
        FROM olympic_medal_tally_history AS medalTally 
        JOIN olympic_country_profiles AS countryProfile 
        ON medalTally.country_noc = countryProfile.noc 
    '''
    
    if search_query:
        search_value = f'%{search_query}%'
        where_clause = '''
        WHERE medalTally.edition ILIKE %s 
        OR medalTally.country ILIKE %s 
        OR medalTally.country_noc ILIKE %s
        '''
        order_and_limit = 'ORDER BY medalTally.edition_id DESC, medalTally.total DESC LIMIT %s OFFSET %s'
        query = base_query + where_clause + order_and_limit
        count_query = f'SELECT COUNT(*) FROM olympic_medal_tally_history AS medalTally WHERE medalTally.edition ILIKE %s OR medalTally.country ILIKE %s OR medalTally.country_noc ILIKE %s'
        params = (search_value, search_value, search_value, per_page, offset)
        count_params = (search_value, search_value, search_value)
    else:
        order_and_limit = 'ORDER BY medalTally.edition_id DESC, medalTally.total DESC LIMIT %s OFFSET %s'
        query = base_query + order_and_limit
        count_query = 'SELECT COUNT(*) FROM olympic_medal_tally_history'
        params = (per_page, offset)
        count_params = ()
    
    columns = ["edition", "edition_id", "year", "country", "country_noc", "rank", "gold", "silver", "bronze", "total"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    try:
        cursor.execute("EXPLAIN ANALYZE " + query, params)
        execution_plan = cursor.fetchall()
        execution_time = float([line for line in execution_plan if "Execution Time:" in line[0]][0][0].split(": ")[1].split(" ms")[0])
    except Exception as e:
        print(f"Error during EXPLAIN ANALYZE: {e}")
        execution_time = 0
    
    cursor.execute(query, params)
    search_results = cursor.fetchall()
    results = [dict(zip(columns, result)) for result in search_results]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "total": total_count,
        "data": results,
        "execution_time": execution_time / 1000
    })

@app.route('/api/insert/countries', methods=['POST'])
def insert_country():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM Olympic_Country_Profiles WHERE noc = %s', (data['noc'],))
        exists = cursor.fetchone()[0] > 0
        
        if exists:
            return jsonify({"error": f"Country with NOC '{data['noc']}' already exists", "success": False}), 400
        
        cursor.execute(
            'INSERT INTO Olympic_Country_Profiles (noc, country) VALUES (%s, %s)',
            (data['noc'], data['country'])
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": f"{data['country']} inserted successfully", "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 400

@app.route('/api/insert/athletes', methods=['POST'])
def insert_athlete():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM Olympic_Athlete_Biography WHERE athlete_id = %s', (data['athlete_id'],))
        exists = cursor.fetchone()[0] > 0
        
        if exists:
            return jsonify({"error": f"Athlete with ID '{data['athlete_id']}' already exists", "success": False}), 400
        
        athlete_id = data['athlete_id']
        name = data['name']
        sex = data.get('sex', '')
        born = data.get('born', '')
        height = data.get('height', '')
        weight = data.get('weight', '')
        country = data.get('country', '')
        country_noc = data.get('country_noc', '')
        description = data.get('description', '')
        special_notes = data.get('special_notes', '')
        
        cursor.execute('INSERT INTO Olympic_Athlete_Biography (athlete_id, name, sex, born, height, weight, country, country_noc, description, special_notes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', 
                       (athlete_id, name, sex, born, height, weight, country, country_noc, description, special_notes))
        
        player_dict[athlete_id] = name
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": f"{name} inserted successfully", "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 400

if __name__ == "__main__":
    app.run(debug=True)
