Stay in plan mode.

This is not working correctly locally. The following flow is happening for me:
- Log in as client user to the client app
- get redirected to mobile app (so that's working as expected)
- log out of mobile app
- try to go to client app because I want to log in as the owner, but get redirected to mobile app as user
  I just logged out of (not what should happen. When the user logs out, I should be able to go to the client app and see the login page).