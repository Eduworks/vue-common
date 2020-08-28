<template>
    <div class="">
        <div class="section">
            <h2 class="title is-size-2 has-text-weight-light">
                Add a property
            </h2>
            <p
                class="subtitle is-size-5"
                v-if="selectedPropertyToAdd === ''">
                Select a property from one of the following groups.
            </p>
            <p
                class="subtitle is-size-5"
                v-else-if="selectedPropertyToAdd !== '' && !selectedPropertyToAddIsTextValue">
                When adding relationships or levels, you can
                either search for existing relationships/levels or
                add one via url. Choose one.
            </p>
        </div>
        <div
            class="section"
            v-if="selectedPropertyToAdd !== ''">
            <p
                v-if="selectedPropertyToAdd !== ''"
                class="title is-size-3 has-text-weight-normal">
                {{ selectedPropertyToAdd.label }}
                <span
                    @click="selectedPropertyToAdd = ''; addRelationBy = '';"
                    class="button is-pulled-right is-text has-text-primary">
                    <span class="icon">
                        <i class="fa fa-exchange-alt" />
                    </span>
                    <span>change property type to add</span>
                </span>
            </p>
            <!-- text property input -->
            <div
                v-if="selectedPropertyToAddIsTextValue || addRelationBy === 'url'"
                class="field add-property-field">
                <!-- if it is a text input type, show the following -->
                <div class="add-property__input-type">
                    <div class="add-property__select-type">
                        <div class="field is-expanded">
                            <!-- if options -->
                            <template v-if="checkedOptions && profile && profile[selectedPropertyToAdd.value] && profile[selectedPropertyToAdd.value]['options']">
                                <p class="subtitle is-size-6">
                                    Choose one or more of the following levels.
                                </p>
                                <div
                                    class="field"
                                    v-for="each in optionsArray"
                                    :key="each">
                                    <input
                                        type="checkbox"
                                        class="is-checkradio"
                                        v-model="checkedOptions"
                                        :value="each.val"
                                        :name="each.val"
                                        :id="each.val">
                                    <label
                                        class="label"
                                        :for="each.val">
                                        {{ each.name }}
                                    </label>
                                </div>
                            </template>
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
            <!-- non text value input: create new, search, or url -->
            <div
                v-else-if="selectedPropertyToAdd !== '' && !selectedPropertyToAddIsTextValue"
                class="field add-property__field">
                <div class="buttons is-left">
                    <div
                        v-if="selectedPropertyRange && selectedPropertyRange[0].toLowerCase().indexOf('level') !== -1 && !editingMultipleCompetencies"
                        @click="addNewLevel"
                        type="text"
                        class="button is-outlined is-primary">
                        <span class="icon">
                            <i class="fa fa-plus" />
                        </span>
                        <span>
                            create new Level
                        </span>
                    </div>
                    <!-- add by url -->
                    <div
                        @click="addRelationBy = 'url'"
                        type="text"
                        class="button is-outlined is-primary">
                        <span>
                            Add {{ selectedPropertyToAdd.label }} by url
                        </span>
                        <span class="icon">
                            <i class="fa fa-link" />
                        </span>
                    </div>
                    <!-- add by search -->
                    <div
                        @click="search"
                        type="button"
                        class="button is-outlined is-primary">
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
        <!-- select property to add -->
        <div class="section">
            <div
                v-if="selectedPropertyToAdd === ''"
                class="field">
                <div class="columns is-multiline property-columns">
                    <div
                        class="column is-12"
                        id="general-properties"
                        v-if="generalProperties.length !== 0"
                        @click="showGeneral = !showGeneral">
                        <label class="title is-size-5">
                            General
                        </label>
                        <span class="icon is-pulled-right">
                            <i
                                v-if="showGeneral"
                                class="fa fa-minus" />
                            <i
                                v-else
                                class="fa fa-plus" />
                        </span>
                    </div>
                    <div
                        class="column is-12 slide"
                        :class="{ 'collapsed': !showGeneral}">
                        <div class="columns is-mobile is-multiline">
                            <div
                                v-for="option in generalProperties"
                                :key="option"
                                class="column is-3 property">
                                <div
                                    @click="selectedPropertyToAdd = option"
                                    class="property-button"
                                    :title="option.description"
                                    :class="{'selected': option === selectedPropertyToAdd}">
                                    <p class="has-text-weight-semibold is-size-6">
                                        {{ option.label }}
                                    </p>
                                    <p class="is-size-7 property-description">
                                        {{ option.description }} ...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        class="column is-12"
                        v-if="relationshipProperties.length !== 0"
                        @click="showRelationships = !showRelationships"
                        id="relationship-properties">
                        <label class="title is-size-5">
                            Relationships
                        </label>
                        <span class="icon is-pulled-right">
                            <i
                                v-if="showRelationships"
                                class="fa fa-minus" />
                            <i
                                v-else
                                class="fa fa-plus" />
                        </span>
                    </div>
                    <div
                        class="column is-12 slide"
                        :class="{ 'collapsed': !showRelationships}">
                        <div class="columns is-mobile is-multiline">
                            <div
                                v-for="option in relationshipProperties"
                                :key="option"
                                class="column is-3  property">
                                <div
                                    @click="selectedPropertyToAdd = option"
                                    class="property-button"
                                    :title="option.description"
                                    :class="{'selected': option === selectedPropertyToAdd}">
                                    <p class="has-text-weight-semibold is-size-6">
                                        {{ option.label }}
                                    </p>
                                    <p class="is-size-7">
                                        {{ option.description }} ...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        class="column is-12"
                        v-if="resourceProperties.length !== 0"
                        @click="showRelationships = !showResources"
                        id="resource-properties">
                        <label
                            class="title is-size-5">
                            Resources
                        </label>
                        <span class="icon is-pulled-right">
                            <i
                                v-if="showResources"
                                class="fa fa-minus" />
                            <i
                                v-else
                                class="fa fa-plus" />
                        </span>
                    </div>
                    <div
                        class="column is-12 slide"
                        :class="{'collapsed': !showResources}">
                        <div class="columns is-mobile is-multiline property-columns">
                            <div
                                v-for="option in resourceProperties"
                                :key="option"
                                class="column is-3 property">
                                <div
                                    @click="selectedPropertyToAdd = option"
                                    class="property-button"
                                    :title="option.description"
                                    :class="{'selected': option === selectedPropertyToAdd}">
                                    <p class="has-text-weight-semibold is-size-6">
                                        {{ option.label }}
                                    </p>
                                    <p class="is-size-7">
                                        {{ option.description }} ...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p class="help is-danger">
                {{ errorMessage[0] }}
            </p>
        </div>
        <div
            class="section"
            v-if="$store.state.featuresEnabled.configurationsEnabled">
            <p class="subtitle">
                Note: Property options are determined by your <router-link
                    target="_blank"
                    to="/configuration">
                    configuration settings.
                </router-link> If a property is unavailable to you here, please refer to your
                configuration settings or contact your administrator.
            </p>
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
        addedPropertiesAndValuesFromSearching: Object,
        errorMessage: {
            type: Array,
            default: function() { return []; }
        }
    },
    components: {
        PropertyString
    },
    data: function() {
        return {
            showGeneral: true,
            showRelationships: true,
            showResources: true,
            addRelationBy: '',
            selectedPropertyToAdd: '',
            selectedPropertyRange: null,
            selectedPropertyToAddIsLangString: false,
            selectedPropertyToAddValue: null,
            checkedOptions: null,
            skipConfigProperties: ["alwaysProperties", "headings", "primaryProperties", "secondaryProperties", "tertiaryProperties", "relationshipsHeading", "relationshipsPriority"],
            optionsArray: []
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
        generalProperties() {
            let newArray = [];
            this.propertyOptions.forEach(function(element) {
                if (element.type !== 'relationship' && element.type !== 'resource') {
                    newArray.push(element);
                }
            });
            return newArray;
        },
        relationshipProperties() {
            let newArray = [];
            this.propertyOptions.forEach(function(element) {
                if (element.type === 'relationship') {
                    newArray.push(element);
                }
            });
            return newArray;
        },
        resourceProperties() {
            let newArray = [];
            this.propertyOptions.forEach(function(element) {
                if (element.type === 'resource') {
                    newArray.push(element);
                }
            });
            return newArray;
        },
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
                        var description = this.profile[key]["http://www.w3.org/2000/01/rdf-schema#comment"][0]["@value"];
                        var type = "property";
                        if (this.profile[key]["http://schema.org/rangeIncludes"][0]["@id"].toLowerCase().indexOf("competency") !== -1) {
                            type = "relationship";
                        } else if (this.profile[key]["http://schema.org/rangeIncludes"][0]["@id"].toLowerCase().indexOf("level") !== -1) {
                            type = "level";
                        }
                        if (this.profile[key]["resource"] === true) {
                            type = "resource";
                        }
                        options.push({"value": key, "label": label, "description": description, "type": type});
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
            if (this.selectedPropertyToAdd.value === "https://purl.org/ctdlasn/terms/knowledgeEmbodied" || this.selectedPropertyToAdd.value === "https://purl.org/ctdlasn/terms/skillEmbodied" ||
            this.selectedPropertyToAdd.value === "https://purl.org/ctdlasn/terms/taskEmbodied" || this.selectedPropertyToAdd.value === "https://purl.org/ctdlasn/terms/abilityEmbodied") {
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
            if (this.profile && this.profile[this.selectedPropertyToAdd.value] && this.profile[this.selectedPropertyToAdd.value]['options'] && this.checkedOptions) {
                for (let i = 0; i < this.profile[this.selectedPropertyToAdd.value]['options'].length; i++) {
                    let option = this.profile[this.selectedPropertyToAdd.value]['options'][i];
                    option.name = EcRepository.getBlocking(option.val).name;
                    this.optionsArray.push(option);
                }
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

<style lang="scss">
    @import '@/scss/variables.scss';
#resource-properties,
#general-properties,
#relationship-properties {
    padding-top: .5rem;
    border-top: 1px solid rgba($dark, .2);
}
.column.property {
    .property-button {
        border: solid 1px $primary;
        padding: .125rem .5rem;
        color: $primary;
        border-radius: .25rem;
        cursor: pointer;
        .property-description {
            text-align: left;
            padding-left: .25rem;
            font-size: $size-6;
            width: 100%;
            display: inline-block;
            direction: ltr;
            text-align: left;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;

        }
    }
    .property-button.selected {
        background-color: $light;
        color: $dark;
        cursor: none;
    }
    .property-button:hover {
        box-shadow: $two-dp;
        background-color: $primary;
        color: $white;
    }
     .property-button.selected:hover {
        box-shadow: none;
        cursor: not-allowed;
    }
}
.slide-leave-active,
.slide-enter-active  {
  transition: all .6s ease;
}
.slide {
    padding-bottom: 1rem !important;
    max-height: 600px;
    overflow-y: hidden;
    transition: all .5s ease;
}
.slide.collapsed {
    padding-bottom: 0rem !important;
    max-height: 0px;
    overflow: hidden;
    .columns {
        height: 0px;
        overflow: hidden;
    }
}
.slide-enter {
    max-height: 0px;
}
.slide-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  max-height: 0px;
}

</style>