Stay in plan mode.

Looks good. Another feature I'd like to add to that section of the mobile 
app is the ability for the client to filter their benchmarks by tag.
So, they should see all the tags in their collection of current 
benchmarks at the top of the page (unique tags), and should
be able to click the tag and filter to the benchmarks that have that tag.
Have the frontend engineer plan out this feature. In order to implement
this in a performant way, I'd recommend using a dictionary for 
<tag, benchmarks[]> that gets created when the page is loaded (and 
of course it should be updated when a benchmark is updated, added, or removed).