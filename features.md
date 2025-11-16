Go into plan mode.

Clients are running into an issue in the mobile app when they try to create a 
new benchmark for themselves. Their coach has created about 30 benchmark templates
but when the client in the mobile app tries to create a new benchmark, they only
have 10 of those templates to choose from in the benhcmark templates dropdown.
investigate why this is happening. I suspect we are using a paginated endpoint
in a situation where it's not appropriate.