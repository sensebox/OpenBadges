// jshint esversion: 8
// jshint node: true
"use strict";

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Badge = require('../../../../models/badge');
const User = require('../../../../models/user');
const {badgeValidation} = require('../../../../helper/validation/badge');

/**
 * @api {get} /api/v1/badge Get Badges
 * @apiName getBadges
 * @apiDescription Get (all) Badges by different query which exist.
 * @apiGroup Badge
 *
 * @apiParam {String} [name] find Badges by its name
 * @apiParam {String} [description] find Badges by its description
 * @apiParam {ObejctId} [issuer] the ID of the issuer you are referring to
 * @apiParam {Boolean} [global] if true, get global Badges; if false, get local Badges
 * @apiParam {Boolean} [independent] if true, get independent Badges; if false, get course-related Badges
 *
 * @apiSuccess (Success 200) {String} message `Badges found successfully.`
 * @apiSuccess (Success 200) {Object} badges `[{"name":"name", "issuer": user, "description": "description", "criteria":"criteria", "global": true, "exists": true, "image": {"path": <String>, "size": <Number>, "contentType": "image/jpeg", "originalName": "originalName.jpeg"}}]`
 *
 * @apiError (On error) {Object} 500 Complications during querying the database.
 */
const getBadges = async function(req, res){
  var qname  = req.query.name;
  var qdescription = req.query.description;
  var qissuer = req.query.issuer;
  var qglobal = req.query.global;
  var qindependent = req.query.independent;

  try{
    var query = {
      exists: true
    };
    if(qname){
      query.name = qname;
    }
    if(qdescription){
      query.description=qdescription;
    }
    if(qissuer){
      query.issuer={$in: qissuer};
    }
    if(qglobal){
      query.global = qglobal;
    }
    if(qindependent){
      query.independent = qindependent;
    }

    console.log(query);
    var result = await Badge.find(query);
    console.log(result.length);

    return res.status(200).send({
      message: 'Badges found succesfully.',
      badges: result
    });
  }
  catch(err){
    return res.status(500).send(err);
  }
};


/**
 * @api {get} /api/v1/badge/me Get my Badges
 * @apiName getBadgesMe
 * @apiDescription Get (all) Badges of currently signed in User by different queries.
 * @apiGroup Badge
 *
 * @apiHeader {String} Authorization allows to send a valid JSON Web Token along with this request with `Bearer` prefix.
 * @apiHeaderExample {String} Authorization Header Example
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMTk5OTEwY2QxMDgyMjA3Y2Y1ZGM2ZiIsImlhdCI6MTU3ODg0NDEwOSwiZXhwIjoxNTc4ODUwMTA5fQ.D4NKx6uT3J329j7JrPst6p02d311u7AsXVCUEyvoiTo
 *
 * @apiParam {String} [name] find Badges by its name
 * @apiParam {String} [description] find Badges by its description
 * @apiParam {ObejctId} [issuer] find Badges by its issuer
 * @apiParam {Boolean} [global] if true, get global Badges; if false, get local Badges
 * @apiParam {Boolean} [independent] if true, get independent Badges; if false, get course-related Badges
 *
 * @apiSuccess (Success 200) {String} message `Badges found successfully.`
 * @apiSuccess (Success 200) {Object} badges `[{"name":"name", "issuer": user, "description": "description", "criteria":"criteria", "global": true, "exists": true, "image": {"path": <String>, "size": <Number>, "contentType": "image/jpeg", "originalName": "originalName.jpeg"}}]`
 *
 * @apiError (On error) {Object} 500 Complications during querying the database.
 */
const getBadgesMe = async function(req, res){
  var qname  = req.query.name;
  var qdescription = req.query.description;
  var qissuer = req.query.issuer;
  var qglobal = req.query.global;
  var qindependent = req.query.independent;

  try{
    // find all badges from current user
    var user = await User.findById(req.user.id, {badge: 1, localbadge: 1, _id: 0});
    var query = {
      $or: [{_id: {$in: user.badge}}, {_id: {$in: user.localbadge}}]
    };
    if(qname){
      query.name = qname;
    }
    if(qdescription){
      query.description=qdescription;
    }
    if(qissuer){
      query.issuer={$in: qissuer};
    }
    if(qglobal){
      query.global = qglobal;
    }
    if(qindependent){
      query.independent = qindependent;
    }

    var result = await Badge.find(query);

    return res.status(200).send({
      message: 'Badges found succesfully.',
      badges: result
    });
  }
  catch(err){
    return res.status(500).send(err);
  }
};


/**
 * @api {get} /api/v1/badge/:badgeId Get Badge
 * @apiName getBadge
 * @apiDescription Get one Badge by its ObjectId.
 * @apiGroup Badge
 *
 * @apiParam {ObejctId} badgeId the ID of the Badge you are referring to
 *
 * @apiSuccess (Success 200) {String} message `Badge found successfully.`
 * @apiSuccess (Success 200) {Object} badge `{"name":"name", "issuer": user, "description": "description", "criteria":"criteria", "global": true, "exists": true}`
 *
 * @apiError (On error) {Object} 404 `{"message": "Badge not found."}`
 * @apiError (On error) {Object} 500 Complications during querying the database.
 */
const getBadge = async function(req, res){
  try{
    var id = req.params.badgeId;
    var badge = await Badge.findById(id);

    if(badge){
      return res.status(200).send({
        message: 'Badge found succesfully.',
        badge: badge
      });
    }
    else {
      return res.status(404).send({
        message: 'Badge not found.',
      });
    }
  }
  catch(err){
    return res.status(500).send(err);
  }
};


/**
 * @api {post} /api/v1/badge Create local Badge
 * @apiName createLocalBadge
 * @apiDescription Create a new local Badge.
 * @apiGroup Badge
 *
 * @apiHeader {String} Authorization allows to send a valid JSON Web Token along with this request with `Bearer` prefix.
 * @apiHeaderExample {String} Authorization Header Example
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMTk5OTEwY2QxMDgyMjA3Y2Y1ZGM2ZiIsImlhdCI6MTU3ODg0NDEwOSwiZXhwIjoxNTc4ODUwMTA5fQ.D4NKx6uT3J329j7JrPst6p02d311u7AsXVCUEyvoiTo
 *
 * @apiParam {String} name title of Badge
 * @apiParam {String} description a brief summary of the Badge
 * @apiParam {String} critera criterias getting this Badge
 * @apiParam {File} [image] image-File (Only images with extension 'PNG', 'JPEG', 'JPG' and 'GIF' are allowed.)
 *
 * @apiSuccess (Created 201) {String} message `Local Badge is succesfully created.`
 * @apiSuccess (Created 201) {Object} badge `{"name":"name", "issuer": user, "description": "description", "criteria":"criteria", "global": false, "exists": true, "image": {"path": <String>, "size": <Number>, "contentType": "image/jpeg", "originalName": "originalName.jpeg"}}`
 *
 * @apiError (On error) {Object} 500 Complications during storage.
 */
const postLocalBadge = async function(req, res){
  if(req.fileValidationError){
    return res.status(422).send({message: req.fileValidationError});
  }
  const {error} = badgeValidation(req.body);
  if(error) return res.status(422).send({message: error.details[0].message});

  try{
    var body = {
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      description: req.body.description,
      criteria: req.body.criteria,
      issuer: [req.user.id]
    };
    if(req.file){
      const image = {
        path: req.file.filename,
        size: req.file.size,
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
      };
      body.image = image;
    }

    const badge = new Badge(body);
    const savedBadge = await badge.save();
    return res.status(201).send({
      message: 'Local Badge is succesfully created.',
      badge: savedBadge
    });
  }
  catch(err){
    return res.status(500).send(err);
  }
};



/**
 * @api {put} /api/v1/badge/:badgeId Change local Badge
 * @apiName putLocalBadge
 * @apiDescription Change information of a local Badge.
 * @apiGroup Badge
 *
 * @apiHeader {String} Authorization allows to send a valid JSON Web Token along with this request with `Bearer` prefix.
 * @apiHeaderExample {String} Authorization Header Example
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMTk5OTEwY2QxMDgyMjA3Y2Y1ZGM2ZiIsImlhdCI6MTU3ODg0NDEwOSwiZXhwIjoxNTc4ODUwMTA5fQ.D4NKx6uT3J329j7JrPst6p02d311u7AsXVCUEyvoiTo
 *
 * @apiParam {ObjectId} badgeId the ID of the Badge you are referring to
 * @apiParam {String} [name] title of Badge
 * @apiParam {String} [description] a brief summary of the Badge
 * @apiParam {String} [critera] criterias getting this Badge
 * @apiParam {File} [image] image-File (Only images with extension 'PNG', 'JPEG', 'JPG' and 'GIF' are allowed.)
 *
 * @apiSuccess (Success 200) {String} message `Local Badge updated successfully.` or </br> `Local Badge not changed.`
 * @apiSuccess (Success 200) {Object} badge `{"name":"name", "issuer": user, "description": "description", "criteria":"criteria", "global": false, "exists": true, "image": {"path": <String>, "size": <Number>, "contentType": "image/jpeg", "originalName": "originalName.jpeg"}}`
 *
 * @apiError (On error) {Object} 403 `{"message": "No permission putting the local Badge."}`
 * @apiError (On error) {Object} 404 `{"message": "Local Badge not found."}`
 * @apiError (On error) {Object} 500 Complications during storage.
 */
const putBadgeLocal = async function(req, res){
  try {
    if(req.fileValidationError){
      return res.status(422).send({message: req.fileValidationError});
    }
    var badge = await Badge.findById(req.params.badgeId);
    if(badge){
      if(badge.issuer == req.user.id){
        var updatedBadge = {};
        if(req.body.name) updatedBadge.name = req.body.name;
        if(req.body.description) updatedBadge.description = req.body.description;
        if(req.body.criteria) updatedBadge.criteria = req.body.criteria;
        if(req.file){
          const image = {
            path: req.file.filename,
            size: req.file.size,
            contentType: req.file.mimetype,
            originalName: req.file.originalname,
          };
          if(badge.image.path){
            fs.unlink(path.join(__dirname, '..', '..', '..', '..', 'upload', badge.image.path), function(err) {
              // if(err && err.code == 'ENOENT') {
              //   // file doens't exist
              //   console.info("File doesn't exist, won't remove it.");
              // } else if (err) {
              //   // other errors, e.g. maybe we don't have enough permission
              //   console.error("Error occurred while trying to remove file");
              // } else {
              //   console.info(`removed`);
              // }
            });
          }
          updatedBadge.image = image;
        }

        if(Object.keys(updatedBadge).length > 0){
          var newBadge = await Badge.findOneAndUpdate({_id: req.params.badgeId}, updatedBadge, {new: true});
          return res.status(200).send({
            message: 'Local Badge updated successfully.',
            badge: newBadge
          });
        }
        else {
          return res.status(200).send({
            message: 'Local Badge not changed.',
            badge: badge
          });
        }
      }
      else {
        return res.status(403).send({
          message: 'No permission putting the local Badge.',
        });
      }
    }
    else {
      return res.status(404).send({
        message: 'Local Badge not found.',
      });
    }
  }
  catch(err){
    return res.status(500).send(err);
  }
};


/**
 * @api {put} /api/v1/badge/:badgeId/deactivation Deactivate local Badge
 * @apiName putLocalBadgeHidden
 * @apiDescription Deactivate a local Badge.
 * @apiGroup Badge
 *
 * @apiHeader {String} Authorization allows to send a valid JSON Web Token along with this request with `Bearer` prefix.
 * @apiHeaderExample {String} Authorization Header Example
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMTk5OTEwY2QxMDgyMjA3Y2Y1ZGM2ZiIsImlhdCI6MTU3ODg0NDEwOSwiZXhwIjoxNTc4ODUwMTA5fQ.D4NKx6uT3J329j7JrPst6p02d311u7AsXVCUEyvoiTo
 *
 * @apiParam {ObjectId} badgeId the ID of the Badge you are referring to
 *
 * @apiSuccess (Success 200) {String} message `Local Badge is successfully deactivated.`
 *
 * @apiError (On error) {Object} 400 `{"message": "Local Badge not found."}`
 * @apiError (On error) {Object} 403 `{"message": "No permission deactivating the local Badge."}`
 * @apiError (On error) {Object} 409 `{"message": "Local Badge is already deactivated."}`
 * @apiError (On error) {Object} 500 Complications during storage.
 */
const putBadgeLocalHidden = async function(req, res){
  try{
    var badge = await Badge.findOne({_id: req.params.badgeId});
    if(badge){
      if(badge.issuer == req.user.id){
        if(badge.exists !== false){
          await Badge.updateOne({_id: req.params.badgeId}, {exists: false});
          return res.status(200).send({
            message: 'Local Badge is successfully deactivated.'
          });
        }
        else {
          return res.status(409).send({
            message: 'Local Badge is already deactivated.'
          });
        }
      }
      else {
        return res.status(403).send({
          message: 'No permission deactivating the local Badge.',
        });
      }
    }
    else {
      return res.status(400).send({
        message: 'Local Badge not found.',
      });
    }
  }
  catch(err){
    return res.status(500).send(err);
  }
};

module.exports = {
  getBadges,
  getBadgesMe,
  getBadge,
  postLocalBadge,
  putBadgeLocal,
  putBadgeLocalHidden
};
