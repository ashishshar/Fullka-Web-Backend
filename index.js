const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Add headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// connection configurations
const mc = mysql.createConnection({
    host: '103.21.58.29',
    user: 'dbanumju_fullka',
    password: 'admin@123',
    database: 'dbanumju_fullka'
});

// connect to database
mc.connect();

// Instantiating the express-jwt middleware
const jwtMW = exjwt({
    secret: 'keyboard cat 4 ever'
});

// LOGIN ROUTE
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Use your DB ORM logic here to find user and compare password
    mc.query("SELECT * FROM customerLogin WHERE custEmail = '"+ username +"' AND custPassword='"+ password+"'", function (error, results, fields) {
        if (error) throw error;
        if (results) {
            const data = JSON.parse(JSON.stringify(results));
            for (let user of data){
                if (username == user.custEmail && password == user.custPassword /* Use your password hash checking logic here !*/) {
                //If all credentials are correct do this
                let token = jwt.sign({ id: user.id, username: user.username }, 'keyboard cat 4 ever', { expiresIn: 129600 }); // Sigining the token
                    res.json({
                        sucess: true,
                        err: null,
                        token
                    });
                    break;
                }
                else {
                    res.status(401).json({
                        sucess: false,
                        token: null,
                        err: 'Username or password is incorrect'
                    });
                }  
            }
        }
        else {
            res.status(401).json({
                sucess: false,
                token: null,
                err: 'Username or password is incorrect'
            });
        }
    });
    // for (let user of users) { // I am using a simple array users which i made above
    //     if (username == user.username && password == user.password /* Use your password hash checking logic here !*/) {
    //         //If all credentials are correct do this
    //         let token = jwt.sign({ id: user.id, username: user.username }, 'keyboard cat 4 ever', { expiresIn: 129600 }); // Sigining the token
    //         res.json({
    //             sucess: true,
    //             err: null,
    //             token
    //         });
    //         break;
    //     }
    //     else {
    //         res.status(401).json({
    //             sucess: false,
    //             token: null,
    //             err: 'Username or password is incorrect'
    //         });
    //     }
    // }
});

// LOGIN ROUTE
app.post('/register', (req, res) => {
    //console.log(req.body.data);
    const {email, password } = req.body.data;

    // Use your DB ORM logic here to find user and compare password
    mc.query("INSERT INTO `customerLogin`(`custEmail`, `custPassword`, `custUpdates`) VALUES ('"+email+"','"+password+"',NOW())", function (error, results, fields) {
        if (error) throw error;
        if (results) {
            //console.log(results)
            res.json({
                sucess: true,
                err: null
            });
        }
        else {
            res.status(401).json({
                sucess: false,
                err: 'Username or password is incorrect'
            });
        }
    });
});

// Error handling 
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') { // Send the error rather than to show it on the console
        res.status(401).send(err);
    }
    else {
        next(err);
    }
});

// default route
app.get('/', jwtMW, function (req, res) {
    return res.send({
        error: true,
        message: 'You are authenticated'
    })
});

// Retrieve all todos 
app.get('/restaurants', function (req, res) {
    mc.query('SELECT * FROM `restaurantProfile`', function (error, results, fields) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results,
            message: 'Restaurant list.'
        });
    });
});

// Search for todos with ‘bug’ in their name
app.get('/restaurants/search/:place/:restaurant', function (req, res) {
    let restaurant = req.params.restaurant;
    mc.query("SELECT * FROM `restaurantProfile` WHERE `rs_name` LIKE ? ", ['%' + restaurant + '%'], function (error, results, fields) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results,
            message: 'Restaurant search list.'
        });
    });
});

// Retrieve todo with id 
app.get('/restaurant/:id', function (req, res) {

    let task_id = req.params.id;

    mc.query('SELECT * FROM `restaurantProfile` WHERE `rs_profileId`=?', task_id, function (error, results, fields) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results[0],
            message: 'Todos list.'
        });
    });

});

// Add a new todo  
app.post('/todo', function (req, res) {

    let task = req.body.task;

    if (!task) {
        return res.status(400).send({
            error: true,
            message: 'Please provide task'
        });
    }

    mc.query("INSERT INTO tasks SET ? ", {
        task: task
    }, function (error, results, fields) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results,
            message: 'New task has been created successfully.'
        });
    });
});

//  Update todo with id
app.put('/todo', function (req, res) {

    let task_id = req.body.task_id;
    let task = req.body.task;

    if (!task_id || !task) {
        return res.status(400).send({
            error: task,
            message: 'Please provide task and task_id'
        });
    }

    mc.query("UPDATE tasks SET task = ? WHERE id = ?", [task, task_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results,
            message: 'Task has been updated successfully.'
        });
    });
});

//  Delete todo
app.delete('/todo/:id', function (req, res) {

    let task_id = req.params.id;

    mc.query('DELETE FROM tasks WHERE id = ?', [task_id], function (error, results, fields) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results,
            message: 'Task has been updated successfully.'
        });
    });

});

// all other requests redirect to 404
app.all("*", function (req, res, next) {
    return res.send('page not found');
    next();
});

// port must be set to 8080 because incoming http requests are routed from port 80 to port 8080
app.listen(8080, function () {
    console.log('Node app is running on port 8080');
});

// allows "grunt dev" to create a development server with livereload
module.exports = app;