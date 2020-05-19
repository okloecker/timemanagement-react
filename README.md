## Overview
Easy tool (frontend part) to keep time by adding records with, created with React.js
* date
* hours/minutes spent
* a short note

A backend is needed, but not part of this repo.

## Dependencies
The UI is done with the help of [Material UI](https://material-ui.com).

Data fetching/caching is relegated to [React Query](https://github.com/tannerlinsley/react-query).

Time/data manipulations are performed with [date-fns](https://date-fns.org/).

For helping with forms, [Formik](https://jaredpalmer.com/formik).

Some data is persisted in the browser's localStorage, guarded against common
pitfalls (e.g. private windows, localStorage not available, in-memory fallback
storage) by [Storage
Factory](https://github.com/MichalZalecki/storage-factory).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


## Elements
The workflow consists of these steps:

* Login - dedicated login screen, accepts username and password credentials
* Dashboard - opens on successful login and shows date pickers for start and end date
* Records table with time records that lie between the dates selected; its data
  is automatically fetched whenever the dates change and also regularly if
  deemed "stale" (as configured in React Query), e.g. when changing window
  focus or coming back from another tab.
  Facility to add/delete/edit time records.
* Logout button
* User settings: 
  * color coded preferred quota of time per day reached
  * user role

