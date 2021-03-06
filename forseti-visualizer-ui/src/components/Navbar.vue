<template>
  <v-flex xs3 mb-5>
    <div class="control-panel">
      <v-container grid-list-md text-xs-center style="padding: 0;">
        <v-layout row wrap>
          <v-flex xs6 style="text-align: left; margin-left: 0;">
            <v-btn color="info" v-on:click="resetZoom" style="margin-left: 0;">Reset Zoom</v-btn>
          </v-flex>

          <v-flex xs6>
            <p class="text-lg-right">
              <v-btn v-on:click="dialog=!dialog">
                <v-icon>fas fa-cog</v-icon>
              </v-btn>

              <v-dialog v-model="dialog" width="500">
                <v-card>
                  <v-card-title class="headline grey lighten-2" primary-title>Settings</v-card-title>

                  <v-card-text>
                    <v-checkbox
                      :label="`Show Violations`"
                      v-model="showViolations"
                      v-on:change="toggleViolations"
                    ></v-checkbox>

                    <v-checkbox
                      :label="`Cached Data Enabled`"
                      v-model="useCache"
                      v-on:change="toggleCacheEnabled()"
                    ></v-checkbox>

                    <v-checkbox
                      :label="`Json On`"
                      v-model="useJson"
                      v-on:change="toggleJsonEnabled()"
                    ></v-checkbox>

                    <v-checkbox
                      :label="`Use Wide View`"
                      v-model="useWideView"
                      v-on:change="toggleWideView()"
                    ></v-checkbox>
                  </v-card-text>

                  <v-divider></v-divider>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" flat @click="dialog = false">Close</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </p>
          </v-flex>
        </v-layout>
      </v-container>

      <!--https://vuetifyjs.com/en/components/autocompletes -->
      <v-autocomplete
        v-model="nodeName"
        :hint="!isEditing ? 'Click the icon to edit' : 'Click the icon to save'"
        :items="resourceArray"
        :item-text="'resource_name'"
        :item-value="'resource_name'"
        :readonly="!isEditing"
        :label="`Resources`"
        persistent-hint
      >
        <v-slide-x-reverse-transition slot="append-outer" mode="out-in">
          <v-icon
            :color="isEditing ? 'success' : 'info'"
            :key="`icon-${isEditing}`"
            @click="isEditing = !isEditing"
            v-text="isEditing ? 'mdi-check-outline' : 'mdi-circle-edit-outline'"
          ></v-icon>
        </v-slide-x-reverse-transition>
      </v-autocomplete>

      <v-btn color="info" id="btn-search" v-on:click="search">Search</v-btn>
      <v-btn color="info" id="btn-search" v-on:click="resetParent">Reset to Org</v-btn>
      <v-btn color="info" id="btn-search" v-on:click="setParent">Set Parent</v-btn>

      <v-checkbox :label="`Expand/Collapse`" v-model="expand" v-on:change="toggleExpand"></v-checkbox>

      <v-checkbox :label="`Expand/Collapse All`" v-model="expandAll" v-on:change="toggleExpandAll"></v-checkbox>

      <v-radio-group v-model="orientation" v-on:change="toggleOrientation">
        <v-radio v-for="n in orientations" :key="n" :label="`${n}`" :value="n"></v-radio>
      </v-radio-group>

      <v-text-field
        label="Explain (user/$USER, group/$GROUP, serviceAccount/$SA)"
        v-model="explainIdentitySearchTerm"
      ></v-text-field>
      <v-btn color="info" v-on:click="explainIdentity">Explain Identity</v-btn>
    </div>

    <v-combobox
      v-model="selectedFilterResources"
      :items="items"
      label="Filter by a list of resource types"
      v-on:input="filterResources"
      multiple
      chips
      :menu-props="{ maxHeight: '400px', overflowY: true }"
    ></v-combobox>
  </v-flex>
</template>

<script>
import $ from 'jquery';
import * as d3 from 'd3';

import D3Helpers from '../services/D3Helpers';
import GoogleCloudImageService from '../services/GoogleCloudImageService';
import DataService from '../services/DataService';
import ForsetiResourceConverter from '../services/ForsetiResourceConverter';
import Orientation from '../constants/Orientation';
import ResourceArrayStore from '../stores/ResourceArray';
import { mapState } from 'vuex';

let cachedFileMap = {
    resourcesFile: 'dataset1_resources.json',
    violationsFile: 'dataset1_violations.json',
    iamexplainbyuserFile: 'dataset1_iamexplainbyuser.json',

    resourcesFile2: 'dataset2_resources.json',
    violationsFile2: 'dataset2_violations.json',
    iamexplainbyuserFile2: 'dataset2_iamexplainbyuser.json',
};

let componentFunctionMap = {
    resetZoom: 'resetZoom',
    toggleViolations: 'toggleViolations',
    toggleCacheEnabled: 'toggleCacheEnabled',
    toggleJsonEnabled: 'toggleJsonEnabled',
    toggleWideView: 'toggleWideView',
    search: 'search',
    resetParent: 'resetParent',
    setParent: 'setParent',
    expandAll: 'expandAll',
    toggleExpand: 'toggleExpand',
    toggleExpandAll: 'toggleExpandAll',
    toggleOrientation: 'toggleOrientation',
    explainIdentity: 'explainIdentity',
    filterResources: 'filterResources',
};

export default {
    store: ResourceArrayStore,

    computed: mapState(['resourceArray']),
    watch: {
        resourceArray(newValue, oldValue) {
            // console.log(`Watch: Updating from ${oldValue} to ${newValue}`);
        },
    },

    /**
     * Vue: mounted() - onload function
     */
    mounted() {},

    /**
     * Vue: methods
     */
    methods: {
        /**
         * @function resetZoom
         * @description Send notification to reset the parent component's svg
         */
        resetZoom: function() {
            this.$emit(componentFunctionMap.resetZoom);
        },

        /**
         * @function toggleViolations
         * @description Send notification to toggle the parent's show/hide violations.
         * (represented in the svg by a red circle)
         */
        toggleViolations: function() {
            this.$emit(
                componentFunctionMap.toggleViolations,
                this.showViolations
            );
        },

        /**
         * @function toggleCacheEnabled
         * @description Send notification to toggle the useCache setting
         */
        toggleCacheEnabled: function() {
            this.$emit(componentFunctionMap.toggleCacheEnabled, this.useCache);
        },

        /**
         * @function explainIdentity
         * @description Executes explain plan via a GRPC call
         *      if (cacheOn) --> then use cached data
         */
        explainIdentity: function() {
            if (this.explainIdentitySearchTerm === '') {
                alert('Explain input must not be empty');
                return;
            }

            this.$emit(
                componentFunctionMap.explainIdentity,
                this.explainIdentitySearchTerm
            );
        },

        /**
         * @function filterResources
         * @description Event executed when the resource filter multiselect box changes
         */
        filterResources: function() {
            this.$emit(
                componentFunctionMap.filterResources,
                this.selectedFilterResources
            );
        },

        /**
         * @function search
         * @description Searches for an exact text match of the node name and pans to that node
         */
        search: function() {
            this.$emit(componentFunctionMap.search, this.nodeName);
        },

        /**
         * @function resetParent
         * @description Sends a request to reset the parent to the original parent
         */
        resetParent: function() {
            this.$emit(componentFunctionMap.resetParent);
        },

        /**
         * @function setParent
         * @description Emits a request to set the new parent (root) node
         */
        setParent: function() {
            this.$emit(componentFunctionMap.setParent, this.nodeName);
        },

        /**
         * @function toggleJsonEnabled
         * @description Refresh the grid and alternate between json / csv file format (only works when useCache true)
         */
        toggleJsonEnabled: function() {
            this.$emit(componentFunctionMap.toggleJsonEnabled, this.useJson);
        },

        /**
         * @function toggleWideView
         * @description Update node width
         */
        toggleWideView: function() {
            this.$emit(componentFunctionMap.toggleWideView, this.useWideView);
        },

        /**
         * @function toggleExpand
         * @description Expand/Collapse the [currently expanded] tree hierarchy.
         */
        toggleExpand: function() {
            this.$emit(componentFunctionMap.toggleExpand, this.expand);
        },

        /**
         * @function toggleExpandAll
         * @description Expand/Collapse the entire tree hierarchy.
         */
        toggleExpandAll: function() {
            this.$emit(componentFunctionMap.toggleExpandAll, this.expandAll);
        },

        /**
         * @function toggleOrientation
         * @description Change direction from horizontal to vertical and vice-versa
         */
        toggleOrientation: function() {
            this.$emit(
                componentFunctionMap.toggleOrientation,
                this.orientation
            );
        },
    },

    /**
     * Vue: data
     */
    data: () => ({
        // global: set this to use JSON files vs. dynamic
        // useCache: false, // default to using server data
        useCache: false, // default to using cached files.json
        useJson: true, // false defers to using a .csv
        useWideView: false, // false defers to keeping node view default screen (hxw)

        // filter variables
        nodeName: '',
        expand: true,
        expandAll: false,
        showViolations: true,
        orientation: Orientation.Vertical,
        explainIdentitySearchTerm: '',
        orientations: Object.keys(Orientation),
        bottomSheetEnabled: false, // for violations view on the bottom
        dialog: false, // settings dialog
        selectedFilterResources: [
            // 'GCS Bucket',
            'GCE Instance',
            'GKE Cluster',
            'Network',
            // 'BQ Dataset',
            // 'App Engine',
            // 'Service Account',
            // 'Service Account Key'
        ],
        items: [
            'GCS Bucket',
            'GCE Instance',
            'GKE Cluster',
            'App Engine',
            'Cloud SQL',
            'Firewall',
            'Network',
            'BQ Dataset',
            'Service Account',
            'Service Account Key',
        ],

        // autocomp
        isEditing: true,
        resources: [], // ['mycloud.com', 'folder1', 'folder2', 'project1', 'project2', 'project1_bucket']
    }),
};
</script>

<style>
.control-panel {
    padding: 8px;
}
</style>
