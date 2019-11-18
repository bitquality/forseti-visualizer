"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = require("express");

var _forsetiService = _interopRequireDefault(require("../services/forseti-service"));

var _cors = _interopRequireDefault(require("cors"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var _default = function _default(_ref) {
  var config = _ref.config,
      db = _ref.db;
  var forsetiApi = (0, _express.Router)();
  forsetiApi.all('*', (0, _cors["default"])());
  /**
   * @desc returns .json file content
   */

  forsetiApi.get('/', function (req, res) {
    _forsetiService["default"].getResourcesJson(function (error, results) {
      if (error) {
        console.log(error); // throw error;
      }

      var json = results;
      res.json(json);
    });
  });
  /**
   * @desc returns resources
   */

  forsetiApi.get('/resources/:parentId?', function (req, res) {
    console.log(req.params.parentId);
    var parentId = req.params.parentId ? req.params.parentId : null;

    _forsetiService["default"].getResources(parentId, function (error, results) {
      if (error) {
        console.log(error); // throw error;
      }

      var json = results;
      res.json(json);
    });
  });
  /**
   * @desc returns grpc call for iam explain
   */

  forsetiApi.get('/getExplainIdentity/:iamPrefix', function (req, res) {
    var iamPrefix = req.params.iamPrefix;

    _forsetiService["default"].getExplainIdentity(iamPrefix, function (error, results) {
      if (error) {
        console.log('Error: ', error);
      } else {
        for (var i = 0; i < results.accesses.length; i++) {
          for (var j = 0; j < results.accesses[i].resources.length; j++) {
            console.log(results.accesses[i]);
            console.log(results.accesses[i].resources[j]);
          }
        }

        res.json(results.accesses);
      }
    });
  });
  /**
   * @desc returns grpc call for iam explain role
   */

  forsetiApi.get('/getExplainRole/:role', function (req, res) {
    var role = req.params.role;
    console.log('rolex', role);

    _forsetiService["default"].getExplainRoles(role, function (error, results) {
      if (error) console.log('Error: ', error);else {
        console.log(results); // TODO:

        res.json(results.accesses);
      }
    });
  });
  /**
   * @desc returns violations
   */

  forsetiApi.get('/violations/:inventoryIndexId', function (req, res) {
    var inventoryIndexId = req.params.inventoryIndexId;

    _forsetiService["default"].getViolations(inventoryIndexId, function (error, results) {
      if (error) {
        console.log(error); // throw error;
      }

      console.log('getViolations() results:', results);
      var json = results;
      res.json(json);
    });
  });
  return forsetiApi;
};

exports["default"] = _default;
//# sourceMappingURL=forseti.js.map