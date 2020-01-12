// jshint esversion: 8
// jshint node: true
"use strict";

const mongoose = require('mongoose');

const Course = require('../../../../models/course');
const User = require('../../../../models/user');


/**
 * @api {get} /course/:courseId/participants get participants of the course
 * @apiName adminGetParticipants
 * @apiDescription getting all participants of one course by ID
 * @apiGroup Admin
 *
 * @apiSuccess (Created 201) {String} message `success`
 * @apiSuccess (Created 201) {Object} course `{"participants": participants}'
 *
 * @apiError (On error) {String} 404 `{"message": "Invalid CourseID."}`
 */
const getParticipants = async function(req, res){
  var courseId = req.params.courseId;
  var course = await Course.findById(courseId);
  if(course){
    var participants = await User.find({_id: {$in: course.participants}});
    return res.status(200).send({
      message: 'participants found successfully.',
      participants: participants
    });
  }
  else {
    return res.status(404).send({
      message: 'Course not found.',
    });
  }
};


module.exports = {
 getParticipants
};