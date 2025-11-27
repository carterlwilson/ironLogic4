Go into plan mode.

Great. Now that we have the mapping file you created for the benchmark templates,
We need to migrate the client benchmarks to reflect the new structure. I've
added a file called IronLogic-Production.users.json that contains the users in the database
with the old structure. For "client" type users, update their client benchmarks to 
reflect the new structure given the template ID mappings we now know.