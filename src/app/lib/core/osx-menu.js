if (process.platform === "darwin") {

    var gui = require('nw.gui'),
        win = gui.Window.get(),
        nativeMenuBar = new gui.Menu({ type: "menubar" }),
        file = new gui.Menu(),
        Window = new gui.Menu(),
        playback = new gui.Menu(),
        help = new gui.Menu(),
        clipboard = gui.Clipboard.get();


    nativeMenuBar.createMacBuiltin("Vanguard", {
        hideEdit: false,
        hideWindow: true
    });

    // Create File Menu
    nativeMenuBar.insert(
        new gui.MenuItem({
            label: 'File',
            submenu: file
        }), 1
    );

    // New Project
    file.append(
        new gui.MenuItem({
            label: 'New Project',
            click: function() {
                console.log("New Project");
                clearProject();
                vanguard.newProject();
            },
            key: "n",
            modifiers: "cmd"
        })
    );

    // Open Project
    file.append(
        new gui.MenuItem({
            label: 'Open Project',
            click: function() {
                console.log("Open Project");
                vanguard.openProject();
            },
            key: "o",
            modifiers: "cmd"
        })
    );

    // Save Project
    file.append(
        new gui.MenuItem({
            label: 'Save Project',
            click: function() {
                console.log("Save Project");
                vanguard.saveProject();
            },
            key: "s",
            modifiers: "cmd"
        })
    );

    // Close Project
    file.append(
        new gui.MenuItem({
            label: 'Close Project',
            click: function() {
                console.log("Close Project");
                closeCurrent();
            },
            key: "w",
            modifiers: "cmd"
        })
    );


    // Seperator
    file.append (
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // Install Instrument
    file.append(
        new gui.MenuItem({
            label: 'Install Instrument',
            click: function() {
                alert("sorry, not functional yet!");
            }
        })
    );

    // // Create Edit Menu
    // nativeMenuBar.insert(
    //     new gui.MenuItem({
    //         label: 'Edit',
    //         submenu: edit
    //     }), 2
    // );

    // Create Window Menu
    nativeMenuBar.insert(
        new gui.MenuItem({
            label: 'Window',
            submenu: Window
        }), 3
    );

    // Minimize Window
    Window.append(
        new gui.MenuItem({
            label: 'Minimize',
            click: function() {
                win.minimize();
            },
            key: "m",
            modifiers: "cmd"
        })
    );

    // Zoom Window
    Window.append(
        new gui.MenuItem({
            label: 'Zoom',
            click: function() {
                var maximized = false;
                if(maximized === false) {
                    win.maximize();
                    maximized = true;
                } else {
                    win.unmaximize();
                }
            }
        })
    );

    // Seperator
    Window.append (
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // Minimize Window
    Window.append(
        new gui.MenuItem({
            label: 'Bring All to Front',
            click: function() {
                win.focus();
            }
        })
    );

    // Create Playback Menu
    nativeMenuBar.insert(
        new gui.MenuItem({
            label: 'Playback',
            submenu: playback
        }), 3
    );

    // Help Menu
    nativeMenuBar.append(
        new gui.MenuItem({
            label: 'Help',
            submenu: help
        }), 4
    );

    // DevTools
    help.append(
        new gui.MenuItem({
            label: 'Github',
            click: function() {
                gui.Shell.openExternal("https://github.com/jakehh/vanguard");
            }
        })
    );

    // Seperator
    help.append (
        new gui.MenuItem({
            type: 'separator'
        })
    );

    // DevTools
    help.append(
        new gui.MenuItem({
            label: 'DevTools',
            click: function() {
                win.showDevTools();
            }
        })
    );

    win.menu = nativeMenuBar;
}
