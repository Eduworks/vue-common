<template>
    <div class="section">
        <div class="field">
            <label
                v-if="selectedPropertyToAdd === ''"
                class="label is-size-6">Add a property</label>
            <label
                v-else
                class="label is-size-6"> Adding property: {{ selectedPropertyToAdd.label }}
            </label>
            <div
                class="add-property__select-type">
                <div class="field">
                    <div class="control">
                        <div class="select is-fullwidth is-small">
                            <select v-model="selectedPropertyToAdd">
                                <option value>
                                    Select a property to add
                                </option>
                                <option
                                    v-for="option in propertyOptions"
                                    :key="option"
                                    :value="option">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="selectedPropertyToAddIsTextValue || addRelationBy === 'url'"
            class="field">
            <!-- if it is a text input type, show the following -->
            <div class="add-property__input-type">
                <div class="add-property__select-type">
                    <!--<label class="label">Property value</label>-->
                    <div class="field is-expanded">
                        <ul v-if="checkedOptions && profile && profile[selectedPropertyToAdd.value] && profile[selectedPropertyToAdd.value]['options']">
                            <li
                                v-for="each in profile[selectedPropertyToAdd.value]['options']"
                                :key="each">
                                <input
                                    type="checkbox"
                                    v-model="checkedOptions"
                                    :value="each.val"
                                    :id="each.val">
                                <label :for="each.val">
                                    {{ getBlocking(each.val).name }}
                                </label>
                            </li>
                        </ul>

                        <PropertyString
                            v-else
                            index="null"
                            :expandedProperty="selectedPropertyToAdd.value"
                            :langString="selectedPropertyToAddIsLangString"
                            :range="selectedPropertyRange"
                            :newProperty="true"
                            :profile="profile"
                            :addSingle="true"
                            :valueFromSearching="selectedPropertyToAddValue"
                            :options="(profile && profile[selectedPropertyToAdd.value] && profile[selectedPropertyToAdd.value]['options']) ? profile[selectedPropertyToAdd.value]['options'] : null" />
                    </div>
                </div>
            </div>
        </div>
        <div
            v-else-if="selectedPropertyToAdd !== '' && !selectedPropertyToAddIsTextValue"
            class="field">
            <!-- if it is a text input type, show the following -->
            <div class="add-property__input-type">
                <div class="add-property__select-type">
                    <!--<label class="label">Property value</label>-->
                    <div class="field is-grouped">
                        <div
                            class="control is-expanded"
                            v-if="selectedPropertyToAdd.value.toLowerCase().indexOf('level') !== -1 && !editingMultipleCompetencies">
                            <div
                                @click="addNewLevel"
                                type="text"
                                class="button is-small is-outlined is-primary is-fullwidth">
                                <span class="icon">
                                    <i class="fa fa-plus" />
                                </span>
                                <span>
                                    create new Level
                                </span>
                            </div>
                        </div>
                        <div class="control is-expanded">
                            <div
                                @click="addRelationBy = 'url'"
                                type="text"
                                class="button is-small is-outlined is-primary is-fullwidth">
                                <span>
                                    Add {{ selectedPropertyToAdd.label }} by url
                                </span>
                                <span class="icon">
                                    <i class="fa fa-link" />
                                </span>
                            </div>
                        </div>
                        <div class="control is-expanded">
                            <div
                                @click="search"
                                type="button"
                                class="button is-small is-outlined is-primary is-fullwidth">
                                <span>
                                    Search for {{ selectedPropertyToAdd.label }} to add
                                </span>
                                <span class="icon">
                                    <i class="fa fa-search" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import PropertyString from './PropertyString.vue';


export default {
    name: 'AddProperty',
    props: {
        profile: Object,
        expandedThing: Object,
        editingMultipleCompetencies: Boolean,
        // When adding multiple competencies, need to know which element of array to update
        idx: Number,
        addedPropertiesAndValuesFromSearching: Object
    },
    components: {
        PropertyString
    },
    data: function() {
        return {
            addRelationBy: '',
            selectedPropertyToAdd: '',
            selectedPropertyRange: null,
            selectedPropertyToAddIsLangString: false,
            selectedPropertyToAddValue: null,
            checkedOptions: null,
            skipConfigProperties: ["alwaysProperties", "headings", "primaryProperties", "secondaryProperties", "tertiaryProperties", "relationshipsHeading", "relationshipsPriority"]
        };
    },
    mounted: function() {
        if (this.editingMultipleCompetencies && this.addedPropertiesAndValuesFromSearching.value.length) {
            this.selectedPropertyToAdd = this.addedPropertiesAndValuesFromSearching.property;
            this.selectedPropertyToAddValue = this.addedPropertiesAndValuesFromSearching.value;
            this.addRelationBy = "url";
        }
    },
    computed: {
        // A list of all available properties for the current configuration
        propertyOptions: function() {
            var options = [];
            if (this.profile) {
                for (var key in this.profile) {
                    if (!EcArray.has(this.skipConfigProperties, key)) {
                        if (this.profile[key]["readOnly"] === "true" || this.profile[key]["readOnly"] === true) {
                            continue;
                        }
                        // If one value is allowed for a property and it already exists, the user cannot add another. Only applies to single edit.
                        if (!this.editingMultipleCompetencies && this.profile[key]["max"] === 1) {
                            if (this.profile[key]["valuesIndexed"]) {
                                var f = this.profile[key]["valuesIndexed"];
                                f = f();
                                if (f && f[this.obj.shortId()]) {
                                    continue;
                                }
                            } else {
                                if (this.expandedThing[key] != null && this.expandedThing[key].length > 0) {
                                    continue;
                                }
                            }
                        }
                        var label = this.profile[key]["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
                        options.push({"value": key, "label": label});
                    }
                }
            }
            return options;
        },
        selectedPropertyToAddIsTextValue: function() {
            var property = this.selectedPropertyToAdd.value;
            var range;
            if (this.profile && this.profile[property]) {
                range = this.profile[property]["http://schema.org/rangeIncludes"][0]["@id"];
            }
            if (!range) {
                return false;
            }
            if (range.toLowerCase().indexOf("competency") !== -1 || range.toLowerCase().indexOf("concept") !== -1) {
                return false;
            }
            if (range.toLowerCase().indexOf("level") !== -1 && this.profile[property]["add"] !== "checkedOptions") {
                return false;
            }
            return true;
        }
    },
    methods: {
        updatePropertyString: function(input, index) {
            this.selectedPropertyToAddValue = input;
            this.$emit('propertyStringUpdated', this.selectedPropertyToAdd, input, this.selectedPropertyRange, this.idx);
        },
        addNewLevel: function() {
            var f = this.profile[this.selectedPropertyToAdd.value]["add"];
            var shortId = EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]);
            f(shortId);
        },
        removeValueAtIndex: function() {
            this.$store.commit('lode/removeAddingValueAtIndex', this.idx);
        },
        search: function() {
            this.addRelationBy = 'search';
            this.$emit('isSearching', true);
            if (this.selectedPropertyRange[0].toLowerCase().indexOf("concept") !== -1) {
                this.$store.commit('lode/searchType', "Concept");
                this.$store.commit('lode/copyOrLink', false);
            } else if (this.selectedPropertyRange[0].toLowerCase().indexOf("level") !== -1) {
                this.$store.commit('lode/searchType', "Level");
                this.$store.commit('lode/copyOrLink', true);
            } else {
                this.$store.commit('lode/searchType', "Competency");
                this.$store.commit('lode/copyOrLink', false);
            }
            if (this.$store.state.editor) {
                var selected = this.expandedThing ? EcRepository.getBlocking(EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"])) : null;
                this.$store.commit('editor/selectedCompetency', selected);
                this.$store.commit('editor/selectCompetencyRelation', this.selectedPropertyToAdd.value);
            }
            this.$store.commit('lode/competencySearchModalOpen', true);
        },
        getBlocking: function(id) {
            return EcRepository.getBlocking(id);
        }
    },
    watch: {
        selectedPropertyToAdd: function() {
            this.selectedPropertyToAddIsLangString = false;
            if (this.profile && this.profile[this.selectedPropertyToAdd.value]) {
                var range = [];
                var ary = this.profile[this.selectedPropertyToAdd.value]["http://schema.org/rangeIncludes"];
                if (ary != null || ary !== undefined) {
                    for (var i = 0; i < ary.length; i++) {
                        range.push(ary[i]["@id"]);
                        if (ary[i]["@id"] === "http://www.w3.org/2000/01/rdf-schema#langString") {
                            this.selectedPropertyToAddIsLangString = true;
                        }
                    }
                }
                this.selectedPropertyRange = range;
                this.$store.commit('lode/setAddingProperty', this.selectedPropertyToAdd.value);
            }
            if (this.selectedPropertyToAdd.value && this.selectedPropertyToAdd.value.toLowerCase().indexOf('level') !== -1 && this.profile && this.profile[this.selectedPropertyToAdd.value] && this.profile[this.selectedPropertyToAdd.value]['options']) {
                this.checkedOptions = [];
            } else {
                this.checkedOptions = null;
            }
        },
        checkedOptions: function() {
            this.$store.commit('lode/setAddingChecked', this.checkedOptions);
            // this.$emit('checkedOptions', this.checkedOptions);
        },
        selectedPropertyToAddValue: function() {
            this.$store.commit('lode/setAddingValue', this.selectedPropertyToAddValue);
        },
        selectedPropertyRange: function() {
            this.$store.commit('lode/setAddingRange', this.selectedPropertyRange);
        },
        addedPropertiesAndValuesFromSearching: function() {
            if (this.editingMultipleCompetencies && this.addedPropertiesAndValuesFromSearching.value.length) {
                this.selectedPropertyToAdd = this.addedPropertiesAndValuesFromSearching.property;
                this.selectedPropertyToAddValue = this.addedPropertiesAndValuesFromSearching.value;
                this.addRelationBy = "url";
            }
        }
    }
};
</script>