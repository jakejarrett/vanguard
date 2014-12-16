TODO
====

#### What to begin work on before 0.1 release.

#### UI

* ~~UI Needs to finalised (Sidebar for Instruments, Effects, Library & Sidebar for Channels)~~
* Needs panel that comes up only when you select Channel/Instrument
* ~~Need to finish off Headerbar with all icons & then prepare them for functionality~~
* Themes (Default, Flat & more) & allow custom themes
* Settings Modal/Page
* Timeline - Design & Implement new timeline to replace current timeline
* Use native confirm/alert dialogs
* Change theme depending on OS (Yosemite for OSX etc)

#### JS / Performance

* Minimize JS
* Allow disabling of certain plugins
* Add Looping to main.js & UI

#### vanguard.js / Core JS

* ~~Begin restructuring JS for Modular design (note- all code has been moved to /lib/ to keep it simple)~~
* ~~Create new Project via Predefined JS Array~~
* Begin writing core DAW functionality in vanguard.js (Will be done before a full release)
* Split functionality so a new project calls newproject.js & Open project calls openproject.js (Easier to maintain)

#### Backend

* Implement cloud support (Google Drive, Dropbox etc?) for saving files if the user chooses to.

#### Themes

* ~~Restructure CSS~~
* Plan to support Instrument Theming too
* Create Flat Theme, Light & Dark Themes.
* Re-write SCSS for code to allow users to make their own style in SCSS or CSS

#### Projects

* Ability to save instruments (JSON gzip?)
* Optional write notes on clips/regions.
* Write/Edit MIDI clips (Possibly export MIDI clips)
