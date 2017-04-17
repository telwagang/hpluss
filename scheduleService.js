/**
 * scheduleService
 *
 * @description :: JSON Webtoken Service for sails
 * 
 *
 */
var http = require('http');
var async = require('async');
var _ = require('lodash');
//var distance = require('google-distance');
/*var apikey = "AIzaSyAPGVtAR8Ga93WLt53hEyq5oel_rfT-vhM";
distance.apiKey = apikey;*/

function addAppointment(schedule, callback) {
    if (schedule) {
        var time = helperService.findTime(schedule.time);

        Appointment.findOrCreate({
            doctorId: schedule.doctorId,
            time: time,
            patientId: schedule.patientid,
            schedule: schedule.id
        }).exec(function(error, appointment) {
            if (error) return callback({ 'err': error });

            if (appointment) return callback({ 'data': appointment });
        });
    }
    callback({ 'error': 'pick a slot again!!' });
}

function firstcall(doctor, formdata, dayss, callback) {
    list = new Array();
    var d = 0;
    var l = doctor.length;
    async.each(doctor, function(doc, caback) {
        Day.find({
            owner: doc.id,
            day: dayss,
            time: formdata.time
        }).exec(function(error, data) {
            if (error) { console.log(error); }
            if (data) {
                if (data.length != 0) {

                    secondcall(data, doc, list, function(data) {
                        list.push(data);
                    });
                    console.log("no");
                }
            }
        });
        if (d == l) {

        }
        d++;
        caback();
    }, function(err) {
        console.log(err);
        console.log("done");


    });
    callback({ data: list });
}

function secondcall(data, doc, list, callback) {

    async.each(data, function(da, ck) {
            list.push({
                name: doc.name,
                specialty: doc.specialty,
                day: da.day,
                place: da.place,
                time: da.time,
                longitude: da.longitude,
                latitude: da.latitude
            });

            ck();
        },
        function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("yes");

            }
        });
    callback(list);
}
module.exports.ScheduleSet = function(formdata, callback) {
    if (formdata) {
        Schedule.findOrCreate({
            doctorId: formdata.owner.id,
            hospital: d,
            day: formdata.day,
            timefrom: formdata.timefrom,
            timeto: formdata.timeto,
            building: g
        }).exec(function(error, schedule) {
            if (error) return callback({ 'error': error.message });

            if (schedule) return addAppointment(schedule);
        });

    } else {
        callback({ 'error': "this is empty" });
    }
};
module.exports.updateAppointment = function(formdata, callback) {
    if (formdata) {
        return addAppointment(formdata);
    }
    callback({ 'error': "this is empty" });
};

module.exports.slots = function(formdata, callback) {

    let dayss;
    helperService.findTime(formdata.day, function(time) {
        dayss = time;
    });
    list = new Array();
    Doctors.find({
            specialty: formdata.specialty
        })
        .exec(function(error, doctor) {
            if (error) { callback({ 'error': error.error }); }

            if (doctor) {

                firstcall(doctor, formdata, dayss, function(data) {
                    if (data) {
                        callback(data);
                    }
                });
            }
        });
};

module.exports.updateSchedule = function(formdata, callback) {
    Doctors.findOrCreate({
        name: formdata.name,
        specialty: formdata.specialty
    }).exec(function(error, doctor) {
        if (error) {
            // callback(error);
            console.log(error);
        }
        if (doctor) {
            async.forEach(formdata.days,
                function(v, k, cb) {
                    Day.findOrCreate({
                        day: v.day,
                        place: v.place,
                        owner: doctor.id
                    }).exec(function(err, day) {
                        if (err) callback({
                            'error': err
                        });
                    });
                },
                function(err) {
                    if (err) console.log(err);
                });
        } else {
            callback('i dnt man!!');
        }
    });
};

module.exports.fill = function(Callback) {

    var options = {
        host: 'localhost',
        port: 8081,
        path: '/scrape'
    };

    var req = http.get(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));

        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res.on('data', function(chunk) {
            // You can process streamed parts here...
            // updateSchedule(chunk);
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            // console.log('BODY: ' + body);
            var eachbody = JSON.parse(body);
            times = ['monring', 'afternoon', 'earlymorning', 'evenning'];


            async.forEachOf(eachbody, function(value, key, callback) {
                    Doctors.findOrCreate({
                        name: value.name,
                        specialty: value.specialty
                    }).exec(function(error, doctor) {
                        if (error) {
                            // callback(error);
                            console.log(error);
                        }
                        if (doctor) {
                            async.forEachOf(value.days,
                                function(v, k, cb) {
                                    var d = _.random(0, 3);
                                    console.log(d);
                                    Day.findOrCreate({
                                        day: v.day,
                                        place: v.place,
                                        time: times[d],
                                        owner: doctor.id
                                    }).exec(function(err, dy) {
                                        if (err) cb({
                                            'error': err
                                        });

                                    });
                                },
                                function(err) {
                                    if (err) console.log(err);

                                    doctor.day.save(function(err) {
                                        if (err) cb(err);
                                        cb("itWorked");
                                    });
                                });
                        } else {
                            callback('i dnt man!!');
                        }
                    });
                },
                function(err) {
                    if (err) console.error(err.message);
                    // configs is now a map of JSON data
                    console.log("done ");
                });
        });
    });
    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });
};

module.exports.givedistance = function(callback) {

    place = [{
            place: 'sliema',
            latitude: 35.910470,
            longitude: 14.504192
        },
        {
            place: 'Burmarrad',
            latitude: 35.933609,
            longitude: 14.415929
        },
        {
            place: 'Zabbar',
            latitude: 35.877736,
            longitude: 14.538693
        },
        {
            place: 'Zebbug',
            latitude: 35.872362,
            longitude: 14.443036
        }
    ];

    async.each(place, function(p, callback) {

        Day.update({ place: p.place }, { latitude: p.latitude, longitude: p.longitude }).exec(function(error, day) {
            if (error) { console.log(error); }
        });
        callback();
    }, function(err) {
        if (err) {
            console.log(err);

        } else {
            callback({ done: "done" });
        }
    });
};