const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(__dirname + '/dist/room-planner'));
app.get('/*', function(req, res) { 
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.sendFile(path.join(__dirname+'/dist/room-planner/index.html'));
});

app.listen(process.env.PORT || 8080);