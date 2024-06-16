/*
These are the SQL commands to enter some ballotCandidates locally. 
the issue is that the remote db and local have different column orders and the export import is not working well

INSERT INTO public.ballotcandidate 
("createdAt", "updatedAt", id, "firstName", "middleName", "lastName", state, "parsedLocation", "positionName", "normalizedPositionName", email, phone, "candidateId", "raceId", "positionId", "electionId", parties, "electionName", "electionDay", "electionResult", level, tier, "isJudicial", "isRetention", "isPrimary", "isRunoff", "isUnexpired", campaign, "ballotHashId", "brData", "bpData", "vendorTsData", "vendorTsPhone", "vendorTsEmail", "bpCandidateId")
VALUES 
(1718418311075, 1718418311075, 1, 'Heather', '', 'Graham', 'CO', 'Pueblo', 'Pueblo City Mayor', 'City Executive//Mayor', 'grahamforpueblo@gmail.com', '719-406-5970', '587413', '2801374', '417235', '7121', 'Nonpartisan', 'Pueblo Mayoral Runoff Election', '2024-01-23', 'GENERAL_WIN', 'city', '3', false, false, false, true, false, NULL, 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvQ2FuZGlkYXRlLzU4NzQxMw==', '{"subAreaName":"","subAreaValue":"","subAreaNameSecondary":"","subAreaValueSecondary":"","urls":"https://www.facebook.com/grahamforpueblo/ https://www.pueblo.us/directory.aspx?EID=134 https://www.heathergrahamformayor.com/home ","imageUrl":"https://assets.civicengine.com/uploads/candidate/headshot/587413/587413.jpg","suffix":"","nickname":"","middleName":"","numberOfSeats":"1","geofenceIsNotExact":"false","geofenceId":"1249059","normalizedPositionId":"1500","mtfcc":"G4110","geoId":"0862000","candidacyId":"844446","candidacyCreatedAt":"2023-11-21 18:55:39.351","candidacyUpdatedAt":"2024-01-24 17:21:22.983"}', NULL, NULL, '', '', '');


INSERT INTO public.ballotcandidate 
("createdAt", "updatedAt", id, "firstName", "middleName", "lastName", state, "parsedLocation", "positionName", "normalizedPositionName", email, phone, "candidateId", "raceId", "positionId", "electionId", parties, "electionName", "electionDay", "electionResult", level, tier, "isJudicial", "isRetention", "isPrimary", "isRunoff", "isUnexpired", campaign, "ballotHashId", "brData", "bpData", "vendorTsData", "vendorTsPhone", "vendorTsEmail", "bpCandidateId")
VALUES 
(1718418316459, 1718418316459, 2, 'Nicholas', '', 'Gradisar', 'CO', 'Pueblo', 'Pueblo City Mayor', 'City Executive//Mayor', 'gradisarformayor2023@gmail.com', '719-214-7936', '779078', '2801374', '417235', '7121', 'Nonpartisan', 'Pueblo Mayoral Runoff Election', '2024-01-23', 'LOSS', 'city', '3', false, false, false, true, false, NULL, 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvQ2FuZGlkYXRlLzc3OTA3OA==', '{"subAreaName":"","subAreaValue":"","subAreaNameSecondary":"","subAreaValueSecondary":"","urls":"https://www.pueblo.us/2434/About-Mayor-Gradisar https://nickgradisar.com/ ","imageUrl":"https://assets.civicengine.com/uploads/candidate/headshot/779078/779078.jpg","suffix":"","nickname":"Nick","middleName":"A.","numberOfSeats":"1","geofenceIsNotExact":"false","geofenceId":"1249059","normalizedPositionId":"1500","mtfcc":"G4110","geoId":"0862000","candidacyId":"844447","candidacyCreatedAt":"2023-11-21 18:55:39.430","candidacyUpdatedAt":"2024-01-24 17:21:22.940"}', NULL, NULL, '', '', '');


INSERT INTO public.ballotcandidate 
("createdAt", "updatedAt", id, "firstName", "middleName", "lastName", state, "parsedLocation", "positionName", "normalizedPositionName", email, phone, "candidateId", "raceId", "positionId", "electionId", parties, "electionName", "electionDay", "electionResult", level, tier, "isJudicial", "isRetention", "isPrimary", "isRunoff", "isUnexpired", campaign, "ballotHashId", "brData", "bpData", "vendorTsData", "vendorTsPhone", "vendorTsEmail", "bpCandidateId")
VALUES 
(1718418323486, 1718418323486, 3, 'Bart', '', 'Miesfeld', 'CA', 'Chula Vista', 'Chula Vista City Attorney', 'City Attorney', '', '', '783771', '2801674', '156263', '5367', 'Nonpartisan', 'California Primary Election', '2024-03-05', 'LOSS', 'city', '3', false, false, false, true, true, NULL, 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvQ2FuZGlkYXRlLzc4Mzc3MQ==', '{"subAreaName":"","subAreaValue":"","subAreaNameSecondary":"","subAreaValueSecondary":"","urls":"https://www.linkedin.com/in/bart-miesfeld-224aab2a/ https://bartmiesfeld.com/ ","imageUrl":"https://assets.civicengine.com/uploads/candidate/headshot/783771/783771.jpg","suffix":"","nickname":"","middleName":"","numberOfSeats":"1","geofenceIsNotExact":"false","geofenceId":"1247555","normalizedPositionId":"1635","mtfcc":"G4110","geoId":"0613392","candidacyId":"844726","candidacyCreatedAt":"2023-11-29 23:06:06.212","candidacyUpdatedAt":"2024-03-22 23:33:45.405"}', NULL, NULL, '', '', '');


-- insert one ballot race
INSERT INTO public.ballotrace 
("createdAt", "updatedAt", id, "ballotId", "ballotHashId", "hashId", "positionSlug", state, "electionDate", level, "subAreaName", "subAreaValue", "isJudicial", "isPrimary", data, county, municipality)
VALUES 
(
    '1718418310749', 
    '1718418310749', 
    11461, 
    '2801374', 
    'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8yODAxMzc0', 
    '7a7f09', 
    'city-executivemayor', 
    'CO', 
    1.705968e+12::real, 
    'city', 
    '', 
    '', 
    False, 
    False, 
    '{"position_name":"Pueblo City Mayor","state":"CO","race_id":2801374,"is_primary":false,"is_judicial":false,"sub_area_name":null,"sub_area_value":null,"filing_periods":"[]","election_day":"2024-01-23","normalized_position_name":"City Executive//Mayor","level":"city"}', 
    NULL, 
    51
);


-- many to many relationship between ballotCandidates and ballotRaces
INSERT INTO public.ballotcandidate_races__ballotrace_candidates(
	id, ballotcandidate_races, ballotrace_candidates)
	VALUES (1, 1, 1);

    INSERT INTO public.ballotcandidate_races__ballotrace_candidates(
	id, ballotcandidate_races, ballotrace_candidates)
	VALUES (2, 2, 1);

    INSERT INTO public.ballotcandidate_races__ballotrace_candidates(
	id, ballotcandidate_races, ballotrace_candidates)
	VALUES (3, 3, 1);


-- insert one election

INSERT INTO public.ballotelection 
("createdAt", "updatedAt", id, "ballotId", "ballotHashId", "electionDate", state, data)
VALUES 
(
    '1718418334246', 
    '1718418334246', 
    1, 
    5191, 
    'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3RvcnkvRWxlY3Rpb24vNTE5MQ==', 
    '2024-02-13', 
    'OK', 
    '{"electionDay":"2024-02-13","id":"Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8yODAxMzc0"}'
);


-- many to many relationship between ballotCandidates and ballotElections

INSERT INTO public.ballotcandidate_elections__ballotelection_candidates(
	id, ballotcandidate_elections, ballotelection_candidates)
	VALUES (1, 1, 1);

INSERT INTO public.ballotcandidate_elections__ballotelection_candidates(
	id, ballotcandidate_elections, ballotelection_candidates)
	VALUES (2, 2, 1);    

INSERT INTO public.ballotcandidate_elections__ballotelection_candidates(
	id, ballotcandidate_elections, ballotelection_candidates)
	VALUES (3, 3, 1);    


    -- ballot position
    INSERT INTO public.ballotposition 
("createdAt", "updatedAt", id, "ballotId", "ballotHashId", data, "ballotElection")
VALUES 
(
    '1718418334596', 
    '1718418334596', 
    1, 
    163969, 
    'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vMTYzOTY5', 
    '{"appointed":false,"createdAt":"2018-02-12T15:59:06.388Z"}', 
    1
);


-- many to many relationship between ballotCandidates and ballotPositions
INSERT INTO public.ballotcandidate_positions__ballotposition_candidates(
	id, ballotcandidate_positions, ballotposition_candidates)
	VALUES (1, 1, 1);

INSERT INTO public.ballotcandidate_positions__ballotposition_candidates(
	id, ballotcandidate_positions, ballotposition_candidates)
	VALUES (2, 2, 1);

INSERT INTO public.ballotcandidate_positions__ballotposition_candidates(
	id, ballotcandidate_positions, ballotposition_candidates)
	VALUES (3, 3, 1);        
*/