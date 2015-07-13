/*
* db will use localStorage for persistent storage & sessionStorage for session based storage (When a new project is loaded, sessionStorage is flushed)
*/

/*
* Store your Objects via JSON.stringify to allow them to be stored in localStorage / sessionStorage
*/
sessionStorage.track1 = JSON.stringify({
    "fx": "none",
    "midi": {
        0: {
            "notes": {
                0: "A#"
            },
            "timing": 12
        }
    }
});

// How to call an object in DB
console.log(JSON.parse(sessionStorage.track1));
