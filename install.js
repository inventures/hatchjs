var bower = require('bower');

// install the required libraries with bower
bower.commands
.install(['bootstrap#3.0.3', 'font-awesome#4.0.3', 'bootswatch#3.0.3'])
.on('end', function (installed) {
	console.log('Bower installed the following:', installed);
});