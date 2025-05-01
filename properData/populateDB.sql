-- creating the database
CREATE DATABASE OlympicDB;

-- creating all the tables in the database
CREATE TABLE Olympic_Country_Profiles (
	noc VARCHAR(3) NOT NULL PRIMARY KEY,
	country VARCHAR(255) NOT NULL
);

CREATE TABLE Olympic_Games_Summary (
	edition VARCHAR(255) NOT NULL,
	edition_id INTEGER NOT NULL PRIMARY KEY,
	edition_url VARCHAR(127) NOT NULL,
	"year" VARCHAR(4) NOT NULL,
	city VARCHAR(63) NOT NULL,
	country_flag_url VARCHAR(63) NOT NULL,
	country_noc VARCHAR(3) NOT NULL,
	start_date VARCHAR(63),
	end_date VARCHAR(63),
	competition_date VARCHAR(63),
	isHeld VARCHAR(31),
	FOREIGN KEY (country_noc) REFERENCES Olympic_Country_Profiles(noc)
);

CREATE TABLE Olympic_Athlete_Biography (
	athlete_id INTEGER NOT NULL PRIMARY KEY,
	"name" VARCHAR(255) NOT NULL,
	sex VARCHAR(55) NOT NULL,
	born VARCHAR(255),
	height VARCHAR(8),
	weight VARCHAR(8),
	country VARCHAR(255) NOT NULL,
	country_noc VARCHAR(3) NOT NULL,
	description VARCHAR(32768),
	special_notes VARCHAR(32768),
	FOREIGN KEY (country_noc) REFERENCES Olympic_Country_Profiles(noc)
);

CREATE TABLE Olympic_Event_Results (
	result_id INTEGER NOT NULL PRIMARY KEY,
	event_title VARCHAR(255) NOT NULL,
	edition VARCHAR(255) NOT NULL,
	edition_id INTEGER NOT NULL, 
	sport VARCHAR(255) NOT NULL,
	sport_url VARCHAR(511) NOT NULL,
	result_date VARCHAR(511) NOT NULL,
	result_location VARCHAR(511),
	result_participants VARCHAR(255) NOT NULL,
	result_format VARCHAR(32768) NOT NULL,
	result_detail VARCHAR(511) NOT NULL,
	result_description VARCHAR(32768) NOT NULL,
	FOREIGN KEY (edition_id) REFERENCES Olympic_Games_Summary(edition_id)
);

CREATE TABLE Olympic_Athlete_Event_Details (
	edition VARCHAR(255) NOT NULL,
	edition_id INTEGER NOT NULL,
	country_noc VARCHAR(3) NOT NULL,
	sport VARCHAR(127) NOT NULL,
	"event" VARCHAR(32768) NOT NULL,
	result_id INTEGER NOT NULL,
	athlete VARCHAR(255) NOT NULL,
	athlete_id INTEGER NOT NULL,
	pos VARCHAR(127) NOT NULL,
	medal VARCHAR(63),
	isTeamSport VARCHAR(5),
	--PRIMARY KEY (edition_id, result_id, athlete_id, pos),
	FOREIGN KEY (edition_id) REFERENCES Olympic_Games_Summary(edition_id)
);

CREATE TABLE Olympic_Medal_Tally_History (
	edition VARCHAR(255) NOT NULL,
	edition_id INTEGER NOT NULL,
	"year" INTEGER NOT NULL,
	country VARCHAR(127) NOT NULL,
	country_noc VARCHAR(3) NOT NULL, 
	gold INTEGER NOT NULL,
	silver INTEGER NOT NULL,
	bronze INTEGER NOT NULL,
	total INTEGER NOT NULL,
	PRIMARY KEY (edition_id, country_noc),
	FOREIGN KEY (edition_id) REFERENCES Olympic_Games_Summary(edition_id),
	FOREIGN KEY (country_noc) REFERENCES Olympic_Country_Profiles(noc)
);


-- inserting data into the tables
COPY Olympic_Country_Profiles(noc, country) 
FROM 'Olympic_Country_Profiles.csv' DELIMITER ',' CSV HEADER;

COPY Olympic_Games_Summary(edition, edition_id, edition_url, year, city, country_flag_url, country_noc, start_date, end_date, competition_date, isHeld) 
FROM 'Olympic_Games_Summary.csv' DELIMITER ',' CSV HEADER;

COPY Olympic_Athlete_Biography(athlete_id, name, sex, born, height, weight, country, country_noc, description, special_notes)
FROM 'Olympic_Athlete_Biography.csv' DELIMITER ',' CSV HEADER;

COPY Olympic_Event_Results(result_id, event_title, edition, edition_id, sport, sport_url, result_date, result_location, result_participants, result_format, result_detail, result_description)
FROM 'Olympic_Event_Results.csv' DELIMITER ',' CSV HEADER;

COPY Olympic_Athlete_Event_Details(edition, edition_id, country_noc, sport, event, result_id, athlete, athlete_id, pos, medal, isTeamSport)
FROM 'Olympic_Athlete_Event_Details.csv' DELIMITER ',' CSV HEADER;

COPY Olympic_Medal_Tally_History(edition, edition_id, year, country, country_noc, gold, silver, bronze, total)
FROM 'Olympic_Medal_Tally_History.csv' DELIMITER ',' CSV HEADER;